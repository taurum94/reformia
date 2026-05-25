import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Colors } from '../../constants/colors'

const accesos = [
  { label: 'Agente IA', desc: 'Genera un presupuesto por chat', ruta: '/agente', color: Colors.accent },
  { label: 'Presupuestos', desc: 'Ver y gestionar presupuestos', ruta: '/presupuestos', color: Colors.primary },
  { label: 'Facturas', desc: 'Ver y gestionar facturas', ruta: '/facturas', color: Colors.primaryLight },
]

export default function InicioScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.bienvenida}>Bienvenido a</Text>
        <Text style={styles.nombre}>Reformia</Text>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Acceso rápido</Text>
        {accesos.map(item => (
          <TouchableOpacity
            key={item.ruta}
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() => router.push(item.ruta as any)}
          >
            <Text style={styles.cardTitulo}>{item.label}</Text>
            <Text style={styles.cardDesc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  header: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 28,
  },
  bienvenida: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  nombre: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 4 },
  seccion: { gap: 12 },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
})
