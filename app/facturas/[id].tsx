import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { htmlFactura, exportarPDF } from '../../lib/pdf'
import { useEmpresa } from '../../hooks/useEmpresa'
import { useFacturas, useLineasFactura } from '../../hooks/useFacturas'
import { EstadoBadge } from '../../components/ui/EstadoBadge'
import { Button } from '../../components/ui/Button'
import { LineaModal, type CamposLinea } from '../../components/ui/LineaModal'
import { Colors } from '../../constants/colors'
import type { EstadoFactura, LineaFactura } from '../../types/database'

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }

export default function FacturaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { empresa } = useEmpresa()
  const { facturas, actualizar, eliminar } = useFacturas(empresa?.id)
  const { lineas, loading: loadingLineas, crearLinea, actualizarLinea, eliminarLinea } = useLineasFactura(id)
  const [accionando, setAccionando] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [lineaModal, setLineaModal] = useState<{ visible: boolean; linea?: LineaFactura }>({ visible: false })

  const factura = facturas.find(f => f.id === id)

  if (!factura) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
  }

  const ivaDesglose = lineas.reduce<Record<number, number>>((acc, l) => {
    const base = l.cantidad * l.precio_unitario
    acc[l.iva_porcentaje] = (acc[l.iva_porcentaje] ?? 0) + base * (l.iva_porcentaje / 100)
    return acc
  }, {})

  const baseImponible = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0)
  const totalIva = Object.values(ivaDesglose).reduce((s, v) => s + v, 0)
  const total = baseImponible + totalIva

  async function handleExportarPDF() {
    if (!empresa) return
    setExportando(true)
    try {
      let cliente = null
      if (factura.cliente_id) {
        const { data } = await supabase.from('clientes').select('nombre,nif,direccion,email,telefono').eq('id', factura.cliente_id).single()
        cliente = data
      }
      const html = htmlFactura(empresa, factura, lineas, cliente)
      await exportarPDF(html, factura.numero)
    } catch (e: any) {
      Alert.alert('Error al generar PDF', e.message)
    } finally {
      setExportando(false)
    }
  }

  async function cambiarEstado(estado: EstadoFactura) {
    setAccionando(true)
    try { await actualizar(id, { estado }) }
    catch (e: any) { Alert.alert('Error', e.message) }
    finally { setAccionando(false) }
  }

  async function handleEliminar() {
    if (confirmandoEliminar) {
      await eliminar(id)
      router.back()
    } else {
      setConfirmandoEliminar(true)
      setTimeout(() => setConfirmandoEliminar(false), 4000)
    }
  }

  const estadosSiguientes: EstadoFactura[] = (['borrador', 'emitida', 'pagada', 'vencida'] as EstadoFactura[])
    .filter(e => e !== factura.estado)

  return (
    <>
      <Stack.Screen options={{
        title: factura.numero,
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
      }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Cabecera */}
        <View style={styles.cabecera}>
          <View style={styles.cabeceraTop}>
            <View>
              <Text style={styles.numero}>{factura.numero}</Text>
              <Text style={styles.fecha}>
                Emitida: {new Date(factura.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
              {factura.fecha_vencimiento && (
                <Text style={[styles.fecha, { color: Colors.warning }]}>
                  Vence: {new Date(factura.fecha_vencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Text>
              )}
            </View>
            <EstadoBadge estado={factura.estado} />
          </View>
          {(factura as any).cliente_nombre && (
            <Text style={styles.cliente}>👤 {(factura as any).cliente_nombre}</Text>
          )}
          {factura.presupuesto_id && (
            <Text style={styles.origen}>Generada desde presupuesto</Text>
          )}
        </View>

        {/* Líneas */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Text style={styles.seccionTitulo}>Conceptos</Text>
            <TouchableOpacity style={styles.btnAnadir} onPress={() => setLineaModal({ visible: true })}>
              <Text style={styles.btnAnadirTexto}>+ Añadir</Text>
            </TouchableOpacity>
          </View>
          {loadingLineas ? <ActivityIndicator color={Colors.primary} /> : lineas.length === 0 ? (
            <Text style={styles.sinLineas}>Sin conceptos</Text>
          ) : lineas.map((l, i) => (
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
          ))}

          {/* Totales fiscales */}
          {lineas.length > 0 && (
            <View style={styles.totales}>
              <View style={styles.totalFila}>
                <Text style={styles.totalLabel}>Base imponible</Text>
                <Text style={styles.totalValor}>{fmt(baseImponible)}</Text>
              </View>
              {Object.entries(ivaDesglose).map(([pct, importe]) => (
                <View key={pct} style={styles.totalFila}>
                  <Text style={styles.totalLabel}>IVA {pct}%</Text>
                  <Text style={styles.totalValor}>{fmt(importe)}</Text>
                </View>
              ))}
              <View style={[styles.totalFila, styles.totalFilaFinal]}>
                <Text style={styles.totalFinalLabel}>Total factura</Text>
                <Text style={styles.totalFinalValor}>{fmt(total)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Acciones */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Cambiar estado</Text>
          <View style={styles.estadoBtns}>
            {estadosSiguientes.map(e => (
              <Button
                key={e}
                label={e.charAt(0).toUpperCase() + e.slice(1)}
                onPress={() => cambiarEstado(e)}
                variante={e === 'pagada' ? 'primary' : 'secondary'}
                loading={accionando}
                style={styles.estadoBtn}
              />
            ))}
          </View>
        </View>

        <Button
          label="Exportar / Compartir PDF"
          onPress={handleExportarPDF}
          variante="secondary"
          loading={exportando}
        />

        <Button
          label={confirmandoEliminar ? '¿Seguro? Pulsa de nuevo para confirmar' : 'Eliminar factura'}
          onPress={handleEliminar}
          variante="danger"
        />
      </ScrollView>

      <LineaModal
        visible={lineaModal.visible}
        titulo="Concepto"
        onClose={() => setLineaModal({ visible: false })}
        inicial={lineaModal.linea}
        onGuardar={async (campos: CamposLinea) => {
          if (lineaModal.linea) {
            await actualizarLinea(lineaModal.linea.id, campos)
          } else {
            await crearLinea({
              ...campos,
              factura_id: id,
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
  origen: { fontSize: 12, color: Colors.muted, fontStyle: 'italic' },
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
