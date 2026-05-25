import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'

export default function FacturasScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.texto}>Facturas — Próximamente</Text>
      <Text style={styles.sub}>Listado y gestión de facturas</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  texto: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
})
