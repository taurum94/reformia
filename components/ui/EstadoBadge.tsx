import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'

const CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  borrador:  { label: 'Borrador',  bg: '#F1F5F9', color: Colors.textSecondary },
  enviado:   { label: 'Enviado',   bg: '#EFF6FF', color: '#2563EB' },
  aceptado:  { label: 'Aceptado', bg: '#F0FDF4', color: '#16A34A' },
  rechazado: { label: 'Rechazado',bg: '#FEF2F2', color: Colors.error },
  emitida:   { label: 'Emitida',  bg: '#EFF6FF', color: '#2563EB' },
  pagada:    { label: 'Pagada',   bg: '#F0FDF4', color: '#16A34A' },
  vencida:   { label: 'Vencida',  bg: '#FEF2F2', color: Colors.error },
}

export function EstadoBadge({ estado }: { estado: string }) {
  const cfg = CONFIG[estado] ?? { label: estado, bg: Colors.background, color: Colors.textSecondary }
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontSize: 12, fontWeight: '700' },
})
