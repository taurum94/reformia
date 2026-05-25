import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useEmpresa } from '../../hooks/useEmpresa'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Colors } from '../../constants/colors'

export default function AjustesScreen() {
  const { empresa, loading, guardar } = useEmpresa()
  const [guardando, setGuardando] = useState(false)

  const [form, setForm] = useState({
    razon_social: '',
    nif: '',
    direccion: '',
    telefono: '',
    email: '',
    web: '',
    iban: '',
  })

  // Cargar datos de la empresa cuando se obtienen
  useEffect(() => {
    if (empresa) {
      setForm({
        razon_social: empresa.razon_social ?? '',
        nif: empresa.nif ?? '',
        direccion: empresa.direccion ?? '',
        telefono: empresa.telefono ?? '',
        email: empresa.email ?? '',
        web: empresa.web ?? '',
        iban: empresa.iban ?? '',
      })
    }
  }, [empresa])

  function set(campo: keyof typeof form) {
    return (valor: string) => setForm(f => ({ ...f, [campo]: valor }))
  }

  async function handleGuardar() {
    if (!form.razon_social) {
      Alert.alert('Campo obligatorio', 'La razón social es obligatoria')
      return
    }
    setGuardando(true)
    try {
      await guardar(form)
      Alert.alert('✓ Guardado', 'Los datos de la empresa se han guardado correctamente')
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function handleCerrarSesion() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Sección empresa */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Datos de empresa</Text>

        <Input
          label="Razón social / Nombre autónomo"
          value={form.razon_social}
          onChangeText={set('razon_social')}
          placeholder="Reformas García S.L."
        />
        <Input
          label="NIF / CIF"
          value={form.nif}
          onChangeText={set('nif')}
          placeholder="B12345678"
          autoCapitalize="characters"
          opcional
        />
        <Input
          label="Dirección fiscal"
          value={form.direccion}
          onChangeText={set('direccion')}
          placeholder="Calle Mayor 1, 28001 Madrid"
          opcional
        />
        <Input
          label="Teléfono"
          value={form.telefono}
          onChangeText={set('telefono')}
          placeholder="600 000 000"
          keyboardType="phone-pad"
          opcional
        />
        <Input
          label="Email de contacto"
          value={form.email}
          onChangeText={set('email')}
          placeholder="info@tuweb.com"
          keyboardType="email-address"
          autoCapitalize="none"
          opcional
        />
        <Input
          label="Web"
          value={form.web}
          onChangeText={set('web')}
          placeholder="https://tuweb.com"
          keyboardType="url"
          autoCapitalize="none"
          opcional
        />
      </View>

      {/* Sección bancaria */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Datos bancarios</Text>
        <Input
          label="IBAN"
          value={form.iban}
          onChangeText={set('iban')}
          placeholder="ES00 0000 0000 0000 0000 0000"
          autoCapitalize="characters"
          opcional
        />
      </View>

      <Button label="Guardar cambios" onPress={handleGuardar} loading={guardando} />

      {/* Cerrar sesión */}
      <TouchableOpacity style={styles.cerrarSesion} onPress={handleCerrarSesion}>
        <Text style={styles.cerrarSesionText}>Cerrar sesión</Text>
      </TouchableOpacity>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  seccion: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  seccionTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cerrarSesion: { alignItems: 'center', paddingVertical: 12 },
  cerrarSesionText: { color: Colors.error, fontWeight: '600', fontSize: 15 },
})
