import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useEmpresa } from '../../hooks/useEmpresa'
import { usePresupuestos, useLineasPresupuesto } from '../../hooks/usePresupuestos'
import { EstadoBadge } from '../../components/ui/EstadoBadge'
import { Button } from '../../components/ui/Button'
import { Colors } from '../../constants/colors'
import type { EstadoPresupuesto } from '../../types/database'

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }

export default function PresupuestoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { empresa } = useEmpresa()
  const { presupuestos, actualizar, eliminar } = usePresupuestos(empresa?.id)
  const { lineas, loading: loadingLineas } = useLineasPresupuesto(id)
  const [accionando, setAccionando] = useState(false)

  const presupuesto = presupuestos.find(p => p.id === id)

  if (!presupuesto) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
  }

  const baseImponible = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0)
  const totalIva = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario * (l.iva_porcentaje / 100), 0)
  const total = baseImponible + totalIva

  async function cambiarEstado(estado: EstadoPresupuesto) {
    setAccionando(true)
    try { await actualizar(id, { estado }) }
    catch (e: any) { Alert.alert('Error', e.message) }
    finally { setAccionando(false) }
  }

  async function convertirAFactura() {
    Alert.alert('Convertir a factura', '¿Crear una factura a partir de este presupuesto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Convertir', onPress: async () => {
          setAccionando(true)
          try {
            // Obtener siguiente número de serie de facturas
            const { data: serie } = await supabase
              .from('series_numericas')
              .select('*')
              .eq('empresa_id', empresa!.id)
              .eq('tipo', 'factura')
              .single()

            const siguiente = (serie?.ultimo_numero ?? 0) + 1
            const año = new Date().getFullYear()
            const digitos = serie?.digitos ?? 4
            const num = String(siguiente).padStart(digitos, '0')
            const numero = serie?.año_automatico
              ? `${serie.prefijo}-${año}-${num}`
              : `${serie?.prefijo ?? 'FAC'}-${num}`

            // Crear factura
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

            // Copiar líneas
            const lineasFactura = lineas.map((l, i) => ({
              factura_id: factura.id,
              descripcion: l.descripcion,
              unidad: l.unidad,
              cantidad: l.cantidad,
              precio_unitario: l.precio_unitario,
              iva_porcentaje: l.iva_porcentaje,
              orden: i,
            }))
            await supabase.from('lineas_factura').insert(lineasFactura)

            // Actualizar serie y estado del presupuesto
            if (serie) await supabase.from('series_numericas').update({ ultimo_numero: siguiente }).eq('id', serie.id)
            await actualizar(id, { estado: 'aceptado' })

            Alert.alert('✓ Factura creada', `Factura ${numero} generada`, [
              { text: 'Ver factura', onPress: () => router.replace({ pathname: '/facturas/[id]', params: { id: factura.id } }) },
              { text: 'Quedarse aquí', style: 'cancel' },
            ])
          } catch (e: any) {
            Alert.alert('Error', e.message)
          } finally {
            setAccionando(false)
          }
        },
      },
    ])
  }

  async function handleEliminar() {
    Alert.alert('Eliminar presupuesto', '¿Seguro? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => { await eliminar(id); router.back() },
      },
    ])
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
          <Text style={styles.seccionTitulo}>Partidas</Text>
          {loadingLineas ? (
            <ActivityIndicator color={Colors.primary} />
          ) : lineas.length === 0 ? (
            <Text style={styles.sinLineas}>Sin partidas</Text>
          ) : (
            lineas.map((l, i) => (
              <View key={l.id} style={[styles.linea, i < lineas.length - 1 && styles.lineaBorde]}>
                <View style={styles.lineaTop}>
                  <Text style={styles.lineaDesc}>{l.descripcion}</Text>
                  <Text style={styles.lineaTotal}>{fmt(l.cantidad * l.precio_unitario)}</Text>
                </View>
                <Text style={styles.lineaDetalle}>
                  {l.cantidad} {l.unidad} × {fmt(l.precio_unitario)} · IVA {l.iva_porcentaje}%
                </Text>
              </View>
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

        {/* Acción principal */}
        {presupuesto.estado !== 'rechazado' && (
          <Button
            label="Convertir a factura →"
            onPress={convertirAFactura}
            loading={accionando}
          />
        )}

        <Button label="Eliminar presupuesto" onPress={handleEliminar} variante="danger" />

      </ScrollView>
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
  seccionTitulo: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
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
