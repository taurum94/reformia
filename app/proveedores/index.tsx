import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native'
import { Stack, router } from 'expo-router'
import { useEmpresa } from '../../hooks/useEmpresa'
import { useProveedores } from '../../hooks/useProveedores'
import { Colors } from '../../constants/colors'

const CATEGORIAS: Record<string, string> = {
  albanileria: 'Albañilería', electricidad: 'Electricidad', fontaneria: 'Fontanería',
  carpinteria: 'Carpintería', pintura: 'Pintura', solados: 'Solados y alicatados',
  yeso: 'Yeso y escayola', otros: 'Otros',
}

export default function ProveedoresScreen() {
  const { empresa } = useEmpresa()
  const { proveedores, loading } = useProveedores(empresa?.id)
  const [busqueda, setBusqueda] = useState('')

  const filtrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.email?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <>
      <Stack.Screen options={{
        title: 'Proveedores',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/proveedores/form')} style={{ marginRight: 16 }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300' }}>+</Text>
          </TouchableOpacity>
        ),
      }} />

      <View style={styles.container}>
        <View style={styles.buscadorWrap}>
          <TextInput
            style={styles.buscador}
            placeholder="Buscar proveedor..."
            placeholderTextColor={Colors.muted}
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
        ) : filtrados.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.vacioTitulo}>{busqueda ? 'Sin resultados' : 'Sin proveedores'}</Text>
            <Text style={styles.vacioDesc}>
              {busqueda ? 'Prueba con otro término' : 'Pulsa + para añadir tu primer proveedor'}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.lista}>
            {filtrados.map(p => (
              <TouchableOpacity
                key={p.id}
                style={styles.fila}
                onPress={() => router.push({ pathname: '/proveedores/form', params: { id: p.id } })}
              >
                <View style={styles.filaInfo}>
                  <Text style={styles.filaNombre}>{p.nombre}</Text>
                  <Text style={styles.filaSub}>
                    {p.categorias.map(c => CATEGORIAS[c] ?? c).join(' · ') || 'Sin categorías'}
                  </Text>
                  {(p.telefono || p.email) && (
                    <Text style={styles.filaContacto}>
                      {[p.telefono, p.email].filter(Boolean).join(' · ')}
                    </Text>
                  )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  vacioTitulo: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  vacioDesc: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  lista: { padding: 12, gap: 8 },
  fila: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  filaInfo: { flex: 1, gap: 3 },
  filaNombre: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  filaSub: { fontSize: 13, color: Colors.accent, fontWeight: '500' },
  filaContacto: { fontSize: 12, color: Colors.textSecondary },
  arrow: { fontSize: 22, color: Colors.muted },
})
