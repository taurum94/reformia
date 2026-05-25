import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native'
import { Colors } from '../../constants/colors'

interface Props extends TextInputProps {
  label: string
  error?: string
  opcional?: boolean
}

export function Input({ label, error, opcional, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {opcional && <Text style={styles.opcional}>Opcional</Text>}
      </View>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={Colors.muted}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  opcional: { fontSize: 11, color: Colors.muted },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  inputError: { borderColor: Colors.error },
  error: { fontSize: 12, color: Colors.error },
})
