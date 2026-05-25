import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Colors } from '../../constants/colors'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    if (!email || !password) {
      setError('Introduce email y contraseña')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.replace('/(tabs)')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>Reformia</Text>
          <Text style={styles.subtitle}>Gestión de obras y reformas</Text>
        </View>

        <View style={styles.form}>
          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="tu@email.com"
            placeholderTextColor={Colors.muted}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={Colors.muted}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Entrar</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/registro')}>
            <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  inner: { flex: 1, justifyContent: 'center', padding: 28 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 42, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 8,
  },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  btn: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: {
    color: Colors.error,
    fontSize: 13,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
  },
  link: { textAlign: 'center', color: Colors.primary, marginTop: 16, fontWeight: '600' },
})
