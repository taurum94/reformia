import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native'
import { Stack, router } from 'expo-router'
import { useEmpresa } from '../../hooks/useEmpresa'
import { useClientes } from '../../hooks/useClientes'
import { Colors } from '../../constants/colors'

function iniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export default function ClientesScreen() {
  const { empresa } = useEmpresa()
  const { clientes, loading } = useClientes(empresa?.id)
  const [busqueda, setBusqueda] = useState('')

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda)
  )

  return (
    <>
      <Stack.Screen options={{
        title: 'Clientes',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/clientes/form')} style={{ marginRight: 16 }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300' }}>+</Text>
          </TouchableOpacity>
        ),
      }} />

      <View style={styles.container}>
        {/* Buscador */}
        <View style={styles.buscadorWrap}>
          <TextInput
            style={styles.buscador}
            placeholder="Buscar por nombre, email o teléfono..."
            placeholderTextColor={Colors.muted}
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : filtrados.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.vacioTitulo}>
              {busqueda ? 'Sin resultados' : 'Sin clientes'}
            </Text>
            <Text style={styles.vacioDesc}>
              {busqueda ? 'Prueba con otro término' : 'Pulsa + para añadir tu primer cliente'}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.lista}>
            {filtrados.map(c => (
              <TouchableOpacity
                key={c.id}
                style={styles.fila}
                onPress={() => router.push({ pathname: '/clientes/form', params: { id: c.id } })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{iniciales(c.nombre)}</Text>
                </View>
                <View style={styles.filaInfo}>
                  <Text style={styles.filaNombre}>{c.nombre}</Text>
                  <Text style={styles.filaSub}>
                    {[c.telefono, c.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                  </Text>
                </View>
                <View style={[styles.badge, c.tipo === 'empresa' ? styles.badgeEmpresa : styles.badgeParticular]}>
                  <Text style={styles.badgeText}>
                    {c.tipo === 'empresa' ? 'Empresa' : 'Particular'}
                  </Text>
                </View>
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
  buscador: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  vacioTitulo: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  vacioDesc: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  lista: { padding: 12, gap: 8 },
  fila: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  filaInfo: { flex: 1 },
  filaNombre: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  filaSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeEmpresa: { backgroundColor: '#EFF6FF' },
  badgeParticular: { backgroundColor: '#F0FDF4' },
  badgeText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
})
