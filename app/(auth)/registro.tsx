import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Colors } from '../../constants/colors'

export default function RegistroScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function handleRegistro() {
    if (!email || !password || !nombre) {
      setError('Rellena todos los campos')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setOk(true)
    }
  }

  if (ok) {
    return (
      <View style={styles.okContainer}>
        <Text style={styles.okIcon}>✓</Text>
        <Text style={styles.okTitulo}>¡Cuenta creada!</Text>
        <Text style={styles.okTexto}>
          Revisa tu email para confirmar la cuenta y luego inicia sesión.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.btnText}>Ir al login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>Reformia</Text>
          <Text style={styles.subtitle}>Crea tu cuenta</Text>
        </View>

        <View style={styles.form}>
          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.label}>Nombre / Empresa</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Reformas García S.L."
            placeholderTextColor={Colors.muted}
          />

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
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={Colors.muted}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegistro}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Crear cuenta</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 42, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  form: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, gap: 8 },
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
  okContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  okIcon: { fontSize: 64, color: '#fff', marginBottom: 16 },
  okTitulo: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 12 },
  okTexto: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 32 },
})
