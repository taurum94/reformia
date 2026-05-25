import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useEmpresa } from '../../hooks/useEmpresa'
import { usePresupuestos } from '../../hooks/usePresupuestos'
import { EstadoBadge } from '../../components/ui/EstadoBadge'
import { Colors } from '../../constants/colors'
import type { EstadoPresupuesto } from '../../types/database'

const ESTADOS: { valor: EstadoPresupuesto | 'todos'; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'borrador', label: 'Borrador' },
  { valor: 'enviado', label: 'Enviado' },
  { valor: 'aceptado', label: 'Aceptado' },
  { valor: 'rechazado', label: 'Rechazado' },
]

export default function PresupuestosScreen() {
  const { empresa } = useEmpresa()
  const { presupuestos, loading, recargar } = usePresupuestos(empresa?.id)
  const [filtro, setFiltro] = useState<EstadoPresupuesto | 'todos'>('todos')

  useFocusEffect(useCallback(() => { recargar() }, [empresa?.id]))

  const filtrados = filtro === 'todos'
    ? presupuestos
    : presupuestos.filter(p => p.estado === filtro)

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosScroll} contentContainerStyle={styles.filtros}>
        {ESTADOS.map(e => (
          <TouchableOpacity
            key={e.valor}
            style={[styles.filtroChip, filtro === e.valor && styles.filtroActivo]}
            onPress={() => setFiltro(e.valor)}
          >
            <Text style={[styles.filtroText, filtro === e.valor && styles.filtroTextoActivo]}>
              {e.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : filtrados.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.vacioTitulo}>{filtro !== 'todos' ? 'Sin presupuestos en este estado' : 'Sin presupuestos'}</Text>
          <Text style={styles.vacioDesc}>
            {filtro !== 'todos' ? 'Prueba con otro filtro' : 'Usa el Agente IA para generar tu primer presupuesto'}
          </Text>
          {filtro === 'todos' && (
            <TouchableOpacity style={styles.btnAgente} onPress={() => router.push('/(tabs)/agente')}>
              <Text style={styles.btnAgenteText}>Ir al Agente IA →</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.lista} onRefreshCapture={recargar}>
          {filtrados.map(p => {
            return (
              <TouchableOpacity
                key={p.id}
                style={styles.card}
                onPress={() => router.push({ pathname: '/presupuestos/[id]', params: { id: p.id } })}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardNumero}>{p.numero}</Text>
                  <EstadoBadge estado={p.estado} />
                </View>
                <Text style={styles.cardCliente}>
                  {p.cliente_nombre ?? 'Sin cliente asignado'}
                </Text>
                <Text style={styles.cardFecha}>
                  {new Date(p.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
            )
          })}
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
  btnAgente: { marginTop: 8, backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  btnAgenteText: { color: '#fff', fontWeight: '700' },
  lista: { padding: 12, gap: 10 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, gap: 6,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: Colors.primary,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumero: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  cardCliente: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  cardFecha: { fontSize: 12, color: Colors.muted },
})
