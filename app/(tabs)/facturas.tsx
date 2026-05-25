import { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useEmpresa } from '../../hooks/useEmpresa'
import { useFacturas } from '../../hooks/useFacturas'
import { EstadoBadge } from '../../components/ui/EstadoBadge'
import { Colors } from '../../constants/colors'
import type { EstadoFactura } from '../../types/database'

const ESTADOS: { valor: EstadoFactura | 'todos'; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'borrador', label: 'Borrador' },
  { valor: 'emitida', label: 'Emitida' },
  { valor: 'pagada', label: 'Pagada' },
  { valor: 'vencida', label: 'Vencida' },
]

export default function FacturasScreen() {
  const { empresa } = useEmpresa()
  const { facturas, loading, recargar } = useFacturas(empresa?.id)
  const [filtro, setFiltro] = useState<EstadoFactura | 'todos'>('todos')

  useFocusEffect(useCallback(() => { recargar() }, [empresa?.id]))

  const filtradas = filtro === 'todos' ? facturas : facturas.filter(f => f.estado === filtro)

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosScroll} contentContainerStyle={styles.filtros}>
        {ESTADOS.map(e => (
          <TouchableOpacity
            key={e.valor}
            style={[styles.filtroChip, filtro === e.valor && styles.filtroActivo]}
            onPress={() => setFiltro(e.valor)}
          >
            <Text style={[styles.filtroText, filtro === e.valor && styles.filtroTextoActivo]}>{e.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : filtradas.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.vacioTitulo}>{filtro !== 'todos' ? 'Sin facturas en este estado' : 'Sin facturas'}</Text>
          <Text style={styles.vacioDesc}>
            {filtro !== 'todos' ? 'Prueba con otro filtro' : 'Convierte un presupuesto aceptado en factura'}
          </Text>
          {filtro === 'todos' && (
            <TouchableOpacity style={styles.btnLink} onPress={() => router.push('/(tabs)/presupuestos')}>
              <Text style={styles.btnLinkText}>Ir a Presupuestos →</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          {filtradas.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.card, f.estado === 'pagada' && styles.cardPagada, f.estado === 'vencida' && styles.cardVencida]}
              onPress={() => router.push({ pathname: '/facturas/[id]', params: { id: f.id } })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardNumero}>{f.numero}</Text>
                <EstadoBadge estado={f.estado} />
              </View>
              <Text style={styles.cardCliente}>{f.cliente_nombre ?? 'Sin cliente asignado'}</Text>
              <Text style={styles.cardFecha}>
                {new Date(f.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                {f.fecha_vencimiento && ` · Vence ${new Date(f.fecha_vencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filtrosScroll: { maxHeight: 52, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filtros: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filtroChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  filtroActivo: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtroText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  filtroTextoActivo: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  vacioTitulo: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  vacioDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  btnLink: { marginTop: 8, backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  btnLinkText: { color: '#fff', fontWeight: '700' },
  lista: { padding: 12, gap: 10 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, gap: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderLeftWidth: 4, borderLeftColor: Colors.primaryLight },
  cardPagada: { borderLeftColor: '#16A34A' },
  cardVencida: { borderLeftColor: Colors.error },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumero: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  cardCliente: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  cardFecha: { fontSize: 12, color: Colors.muted },
})
