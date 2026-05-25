import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { Stack, router } from 'expo-router'
import { useEmpresa } from '../../hooks/useEmpresa'
import { useMateriales } from '../../hooks/useMateriales'
import { Colors } from '../../constants/colors'

export default function MaterialesScreen() {
  const { empresa } = useEmpresa()
  const { materiales, loading } = useMateriales(empresa?.id)
  const [busqueda, setBusqueda] = useState('')
  const [catFiltro, setCatFiltro] = useState<string | null>(null)

  const categorias = [...new Set(materiales.map(m => m.categoria))].sort()

  const filtrados = materiales.filter(m => {
    const coincideBusqueda = m.descripcion.toLowerCase().includes(busqueda.toLowerCase()) || m.codigo.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCat = !catFiltro || m.categoria === catFiltro
    return coincideBusqueda && coincideCat
  })

  return (
    <>
      <Stack.Screen options={{
        title: 'Materiales',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/materiales/form')} style={{ marginRight: 16 }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300' }}>+</Text>
          </TouchableOpacity>
        ),
      }} />
      <View style={styles.container}>
        <View style={styles.buscadorWrap}>
          <TextInput style={styles.buscador} placeholder="Buscar por descripción o código..." placeholderTextColor={Colors.muted} value={busqueda} onChangeText={setBusqueda} />
        </View>

        {categorias.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosScroll} contentContainerStyle={styles.filtros}>
            <TouchableOpacity style={[styles.filtroChip, !catFiltro && styles.filtroActivo]} onPress={() => setCatFiltro(null)}>
              <Text style={[styles.filtroText, !catFiltro && styles.filtroTextoActivo]}>Todos</Text>
            </TouchableOpacity>
            {categorias.map(c => (
              <TouchableOpacity key={c} style={[styles.filtroChip, catFiltro === c && styles.filtroActivo]} onPress={() => setCatFiltro(c === catFiltro ? null : c)}>
                <Text style={[styles.filtroText, catFiltro === c && styles.filtroTextoActivo]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
        ) : filtrados.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.vacioTitulo}>{busqueda || catFiltro ? 'Sin resultados' : 'Sin materiales'}</Text>
            <Text style={styles.vacioDesc}>{busqueda || catFiltro ? 'Prueba con otro filtro' : 'Pulsa + para añadir tu primer material'}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.lista}>
            {filtrados.map(m => (
              <TouchableOpacity key={m.id} style={styles.fila} onPress={() => router.push({ pathname: '/materiales/form', params: { id: m.id } })}>
                <View style={styles.filaInfo}>
                  <View style={styles.filaTop}>
                    <Text style={styles.filaNombre}>{m.descripcion}</Text>
                    <Text style={styles.filaUnidad}>{m.unidad}</Text>
                  </View>
                  <View style={styles.filaBottom}>
                    <Text style={styles.filaCodigo}>{m.codigo}</Text>
                    <Text style={styles.filaCat}>{m.categoria}</Text>
                  </View>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  buscadorWrap: { padding: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  buscador: { backgroundColor: Colors.background, borderRadius: 10, padding: 10, fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  filtrosScroll: { maxHeight: 52, backgroundColor: Colors.surface },
  filtros: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  filtroChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  filtroActivo: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtroText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  filtroTextoActivo: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  vacioTitulo: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  vacioDesc: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  lista: { padding: 12, gap: 8 },
  fila: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  filaInfo: { flex: 1, gap: 4 },
  filaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filaNombre: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  filaUnidad: { fontSize: 12, color: Colors.textSecondary, backgroundColor: Colors.background, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  filaBottom: { flexDirection: 'row', gap: 8 },
  filaCodigo: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'monospace' },
  filaCat: { fontSize: 12, color: Colors.accent, fontWeight: '500' },
  arrow: { fontSize: 22, color: Colors.muted },
})
