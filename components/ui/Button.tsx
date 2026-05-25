import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native'
import { Colors } from '../../constants/colors'

interface Props {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variante?: 'primary' | 'secondary' | 'danger'
  style?: ViewStyle
}

export function Button({ label, onPress, loading, disabled, variante = 'primary', style }: Props) {
  const bg = variante === 'primary' ? Colors.accent
    : variante === 'danger' ? Colors.error
    : Colors.surface

  const textColor = variante === 'secondary' ? Colors.primary : '#fff'
  const borderColor = variante === 'secondary' ? Colors.primary : 'transparent'

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bg, borderColor }, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading
        ? <ActivityIndicator color={textColor} />
        : <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  disabled: { opacity: 0.55 },
  text: { fontWeight: '700', fontSize: 15 },
})
