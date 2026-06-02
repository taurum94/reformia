import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { siguienteNumero } from '../../lib/series'
import { htmlPresupuesto, exportarPDF } from '../../lib/pdf'
import { useEmpresa } from '../../hooks/useEmpresa'
import { usePresupuestos, useLineasPresupuesto } from '../../hooks/usePresupuestos'
import { EstadoBadge } from '../../components/ui/EstadoBadge'
import { Button } from '../../components/ui/Button'
import { LineaModal, type CamposLinea } from '../../components/ui/LineaModal'
import { Colors } from '../../constants/colors'
import type { EstadoPresupuesto, LineaPresupuesto } from '../../types/database'

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }

export default function PresupuestoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { empresa } = useEmpresa()
  const { presupuestos, actualizar, eliminar } = usePresupuestos(empresa?.id)
  const { lineas, loading: loadingLineas, crearLinea, actualizarLinea, eliminarLinea } = useLineasPresupuesto(id)
  const [accionando, setAccionando] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [lineaModal, setLineaModal] = useState<{ visible: boolean; linea?: LineaPresupuesto }>({ visible: false })

  const presupuesto = presupuestos.find(p => p.id === id)

  if (!presupuesto) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
  }

  const baseImponible = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0)
  const totalIva = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario * (l.iva_porcentaje / 100), 0)
  const total = baseImponible + totalIva

  async function handleExportarPDF() {
    if (!empresa) return
    setExportando(true)
    try {
      let cliente = null
      if (presupuesto.cliente_id) {
        const { data } = await supabase.from('clientes').select('nombre,nif,direccion,email,telefono').eq('id', presupuesto.cliente_id).single()
        cliente = data
      }
      const html = htmlPresupuesto(empresa, presupuesto, lineas, cliente)
      await exportarPDF(html, presupuesto.numero)
    } catch (e: any) {
      Alert.alert('Error al generar PDF', e.message)
    } finally {
      setExportando(false)
    }
  }

  async function cambiarEstado(estado: EstadoPresupuesto) {
    setAccionando(true)
    try { await actualizar(id, { estado }) }
    catch (e: any) { Alert.alert('Error', e.message) }
    finally { setAccionando(false) }
  }

  async function convertirAFactura() {
    if (accionando) return
    setAccionando(true)
    try {
      const numero = await siguienteNumero(empresa!.id, 'factura')

      const { data: factura, error } = await supabase
        .from('facturas')
        .insert({
          empresa_id: empresa!.id,
          cliente_id: presupuesto.cliente_id,
          presupuesto_id: presupuesto.id,
          numero,
          fecha: new Date().toISOString().split('T')[0],
          estado: 'borrador',
        })
        .select()
        .single()
      if (error) throw error

      const lineasFactura = lineas.map((l, i) => ({
        factura_id: factura.id,
        descripcion: l.descripcion,
        unidad: l.unidad,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        iva_porcentaje: l.iva_porcentaje,
        orden: i,
      }))
      if (lineasFactura.length > 0) {
        const { error: errLineas } = await supabase.from('lineas_factura').insert(lineasFactura)
        if (errLineas) throw errLineas
      }

      await actualizar(id, { estado: 'aceptado' })

      // Navegar directamente a la factura creada (Alert multi-botón no funciona en web)
      router.replace({ pathname: '/facturas/[id]', params: { id: factura.id } })
    } catch (e: any) {
      Alert.alert('Error al crear factura', e.message)
    } finally {
      setAccionando(false)
    }
  }

  async function handleEliminar() {
    // Alert.alert multi-botón no funciona en web — confirmación inline con estado
    if (confirmandoEliminar) {
      await eliminar(id)
      router.back()
    } else {
      setConfirmandoEliminar(true)
      setTimeout(() => setConfirmandoEliminar(false), 4000)
    }
  }

  return (
    <>
      <Stack.Screen options={{
        title: presupuesto.numero,
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
      }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Cabecera */}
        <View style={styles.cabecera}>
          <View style={styles.cabeceraTop}>
            <View>
              <Text style={styles.numero}>{presupuesto.numero}</Text>
              <Text style={styles.fecha}>
                {new Date(presupuesto.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <EstadoBadge estado={presupuesto.estado} />
          </View>
          {(presupuesto as any).cliente_nombre && (
            <Text style={styles.cliente}>👤 {(presupuesto as any).cliente_nombre}</Text>
          )}
        </View>

        {/* Líneas */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Text style={styles.seccionTitulo}>Partidas</Text>
            <TouchableOpacity style={styles.btnAnadir} onPress={() => setLineaModal({ visible: true })}>
              <Text style={styles.btnAnadirTexto}>+ Añadir</Text>
            </TouchableOpacity>
          </View>
          {loadingLineas ? (
            <ActivityIndicator color={Colors.primary} />
          ) : lineas.length === 0 ? (
            <Text style={styles.sinLineas}>Sin partidas</Text>
          ) : (
            lineas.map((l, i) => (
              <TouchableOpacity
                key={l.id}
                style={[styles.linea, i < lineas.length - 1 && styles.lineaBorde]}
                onPress={() => setLineaModal({ visible: true, linea: l })}
              >
                <View style={styles.lineaTop}>
                  <Text style={styles.lineaDesc}>{l.descripcion}</Text>
                  <Text style={styles.lineaTotal}>{fmt(l.cantidad * l.precio_unitario)}</Text>
                </View>
                <Text style={styles.lineaDetalle}>
                  {l.cantidad} {l.unidad} × {fmt(l.precio_unitario)} · IVA {l.iva_porcentaje}%
                </Text>
              </TouchableOpacity>
            ))
          )}

          {/* Totales */}
          {lineas.length > 0 && (
            <View style={styles.totales}>
              <View style={styles.totalFila}>
                <Text style={styles.totalLabel}>Base imponible</Text>
                <Text style={styles.totalValor}>{fmt(baseImponible)}</Text>
              </View>
              <View style={styles.totalFila}>
                <Text style={styles.totalLabel}>IVA</Text>
                <Text style={styles.totalValor}>{fmt(totalIva)}</Text>
              </View>
              <View style={[styles.totalFila, styles.totalFilaFinal]}>
                <Text style={styles.totalFinalLabel}>Total</Text>
                <Text style={styles.totalFinalValor}>{fmt(total)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Acciones de estado */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Cambiar estado</Text>
          <View style={styles.estadoBtns}>
            {(['borrador', 'enviado', 'aceptado', 'rechazado'] as EstadoPresupuesto[])
              .filter(e => e !== presupuesto.estado)
              .map(e => (
                <Button
                  key={e}
                  label={e.charAt(0).toUpperCase() + e.slice(1)}
                  onPress={() => cambiarEstado(e)}
                  variante="secondary"
                  loading={accionando}
                  style={styles.estadoBtn}
                />
              ))}
          </View>
        </View>

        {/* Exportar PDF */}
        <Button
          label="Exportar / Compartir PDF"
          onPress={handleExportarPDF}
          variante="secondary"
          loading={exportando}
        />

        {/* Acción principal */}
        {presupuesto.estado !== 'rechazado' && (
          <Button
            label="Convertir a factura →"
            onPress={convertirAFactura}
            loading={accionando}
          />
        )}

        <Button
          label={confirmandoEliminar ? '¿Seguro? Pulsa de nuevo para confirmar' : 'Eliminar presupuesto'}
          onPress={handleEliminar}
          variante="danger"
        />

      </ScrollView>

      <LineaModal
        visible={lineaModal.visible}
        onClose={() => setLineaModal({ visible: false })}
        inicial={lineaModal.linea}
        onGuardar={async (campos: CamposLinea) => {
          if (lineaModal.linea) {
            await actualizarLinea(lineaModal.linea.id, campos)
          } else {
            await crearLinea({
              ...campos,
              presupuesto_id: id,
              orden: lineas.length,
            })
          }
        }}
        onEliminar={lineaModal.linea ? () => eliminarLinea(lineaModal.linea!.id) : undefined}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cabecera: { backgroundColor: Colors.surface, borderRadius: 14, padding: 18, gap: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cabeceraTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  numero: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  fecha: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cliente: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  seccion: { backgroundColor: Colors.surface, borderRadius: 14, padding: 18, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  seccionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seccionTitulo: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  btnAnadir: { backgroundColor: Colors.accent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  btnAnadirTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sinLineas: { fontSize: 14, color: Colors.textSecondary },
  linea: { paddingVertical: 10, gap: 3 },
  lineaBorde: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  lineaTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  lineaDesc: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  lineaTotal: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  lineaDetalle: { fontSize: 12, color: Colors.textSecondary },
  totales: { borderTopWidth: 1.5, borderTopColor: Colors.border, paddingTop: 12, gap: 6 },
  totalFila: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 13, color: Colors.textSecondary },
  totalValor: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  totalFilaFinal: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, marginTop: 4 },
  totalFinalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  totalFinalValor: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  estadoBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  estadoBtn: { flex: 1, minWidth: 100 },
})
