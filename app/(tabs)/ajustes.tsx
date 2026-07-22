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
  const [confirmandoCerrar, setConfirmandoCerrar] = useState(false)

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
    if (confirmandoCerrar) {
      await supabase.auth.signOut()
      router.replace('/(auth)/login')
    } else {
      setConfirmandoCerrar(true)
      setTimeout(() => setConfirmandoCerrar(false), 4000)
    }
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

      {/* Datos */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Datos</Text>
        <TouchableOpacity style={styles.enlace} onPress={() => router.push('/clientes')}>
          <View>
            <Text style={styles.enlaceTitulo}>Clientes</Text>
            <Text style={styles.enlaceDesc}>Gestiona tus clientes y sus datos de contacto</Text>
          </View>
          <Text style={styles.enlaceArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.separador} />
        <TouchableOpacity style={styles.enlace} onPress={() => router.push('/proveedores')}>
          <View>
            <Text style={styles.enlaceTitulo}>Proveedores</Text>
            <Text style={styles.enlaceDesc}>Gestiona tus proveedores de materiales</Text>
          </View>
          <Text style={styles.enlaceArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.separador} />
        <TouchableOpacity style={styles.enlace} onPress={() => router.push('/materiales')}>
          <View>
            <Text style={styles.enlaceTitulo}>Materiales</Text>
            <Text style={styles.enlaceDesc}>Catálogo de materiales y unidades</Text>
          </View>
          <Text style={styles.enlaceArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.separador} />
        <TouchableOpacity style={styles.enlace} onPress={() => router.push('/configuracion/precios')}>
          <View>
            <Text style={styles.enlaceTitulo}>Precios mano de obra</Text>
            <Text style={styles.enlaceDesc}>Coste por hora de cada categoría de trabajo</Text>
          </View>
          <Text style={styles.enlaceArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Geografía */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Geografía</Text>
        <TouchableOpacity style={styles.enlace} onPress={() => router.push('/configuracion/paises')}>
          <View>
            <Text style={styles.enlaceTitulo}>Países</Text>
            <Text style={styles.enlaceDesc}>Catálogo de países en los que operas</Text>
          </View>
          <Text style={styles.enlaceArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.separador} />
        <TouchableOpacity style={styles.enlace} onPress={() => router.push('/configuracion/provincias')}>
          <View>
            <Text style={styles.enlaceTitulo}>Provincias</Text>
            <Text style={styles.enlaceDesc}>Provincias por país</Text>
          </View>
          <Text style={styles.enlaceArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.separador} />
        <TouchableOpacity style={styles.enlace} onPress={() => router.push('/configuracion/zonas')}>
          <View>
            <Text style={styles.enlaceTitulo}>Zonas</Text>
            <Text style={styles.enlaceDesc}>Segmentación geográfica dentro de cada provincia</Text>
          </View>
          <Text style={styles.enlaceArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.separador} />
        <TouchableOpacity style={styles.enlace} onPress={() => router.push('/configuracion/ubicaciones')}>
          <View>
            <Text style={styles.enlaceTitulo}>Ubicaciones</Text>
            <Text style={styles.enlaceDesc}>Combinaciones país/provincia/zona para precios diferenciados</Text>
          </View>
          <Text style={styles.enlaceArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Configuración avanzada */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Configuración fiscal</Text>
        <TouchableOpacity style={styles.enlace} onPress={() => router.push('/configuracion/series')}>
          <View>
            <Text style={styles.enlaceTitulo}>Series numéricas</Text>
            <Text style={styles.enlaceDesc}>Formato de numeración de presupuestos y facturas</Text>
          </View>
          <Text style={styles.enlaceArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.separador} />
        <TouchableOpacity style={styles.enlace} onPress={() => router.push('/configuracion/iva')}>
          <View>
            <Text style={styles.enlaceTitulo}>Tipos de IVA</Text>
            <Text style={styles.enlaceDesc}>Configura los porcentajes de IVA aplicables</Text>
          </View>
          <Text style={styles.enlaceArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity style={styles.cerrarSesion} onPress={handleCerrarSesion}>
        <Text style={styles.cerrarSesionText}>
          {confirmandoCerrar ? '¿Seguro? Pulsa de nuevo para confirmar' : 'Cerrar sesión'}
        </Text>
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
  enlace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  enlaceTitulo: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  enlaceDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  enlaceArrow: { fontSize: 22, color: Colors.muted, fontWeight: '300' },
  separador: { height: 1, backgroundColor: Colors.border },
})
