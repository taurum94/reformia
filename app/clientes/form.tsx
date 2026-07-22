import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useEmpresa } from '../../hooks/useEmpresa'
import { useClientes } from '../../hooks/useClientes'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { Colors } from '../../constants/colors'
import type { TipoCliente } from '../../types/database'

const TIPOS: { valor: TipoCliente; label: string }[] = [
  { valor: 'particular', label: 'Particular' },
  { valor: 'empresa', label: 'Empresa' },
]

export default function ClienteFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const esEdicion = !!id

  const { empresa } = useEmpresa()
  const { clientes, crear, actualizar, eliminar } = useClientes(empresa?.id)

  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    nif: '',
    direccion: '',
    telefono: '',
    email: '',
    tipo: 'particular' as TipoCliente,
  })

  useEffect(() => {
    if (esEdicion) {
      const cliente = clientes.find(c => c.id === id)
      if (cliente) {
        setForm({
          nombre: cliente.nombre,
          nif: cliente.nif ?? '',
          direccion: cliente.direccion ?? '',
          telefono: cliente.telefono ?? '',
          email: cliente.email ?? '',
          tipo: cliente.tipo,
        })
      }
    }
  }, [id, clientes])

  function set(campo: keyof typeof form) {
    return (valor: string) => setForm(f => ({ ...f, [campo]: valor }))
  }

  async function handleGuardar() {
    if (!form.nombre.trim()) {
      Alert.alert('Campo obligatorio', 'El nombre del cliente es obligatorio')
      return
    }
    setGuardando(true)
    try {
      if (esEdicion) {
        await actualizar(id!, form)
        router.back()
      } else {
        await crear(form)
        Alert.alert('✓ Creado', 'Cliente añadido correctamente')
        router.back()
      }
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar() {
    setEliminando(true)
    try { await eliminar(id!); router.back() }
    catch (e: any) { Alert.alert('Error', e.message) }
    finally { setEliminando(false) }
  }

  if (esEdicion && clientes.length === 0) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
  }

  return (
    <>
      <Stack.Screen options={{
        title: esEdicion ? 'Editar cliente' : 'Nuevo cliente',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
      }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Tipo de cliente */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Tipo de cliente</Text>
          <View style={styles.tipoRow}>
            {TIPOS.map(t => (
              <TouchableOpacity
                key={t.valor}
                style={[styles.tipoBtn, form.tipo === t.valor && styles.tipoBtnActivo]}
                onPress={() => setForm(f => ({ ...f, tipo: t.valor }))}
              >
                <Text style={[styles.tipoBtnText, form.tipo === t.valor && styles.tipoBtnTextActivo]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Datos de contacto */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Datos de contacto</Text>
          <Input
            label="Nombre / Razón social"
            value={form.nombre}
            onChangeText={set('nombre')}
            placeholder="García S.L. o Juan García"
          />
          <Input
            label="NIF / CIF"
            value={form.nif}
            onChangeText={set('nif')}
            placeholder="12345678A"
            autoCapitalize="characters"
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
            label="Email"
            value={form.email}
            onChangeText={set('email')}
            placeholder="cliente@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            opcional
          />
          <Input
            label="Dirección"
            value={form.direccion}
            onChangeText={set('direccion')}
            placeholder="Calle Mayor 1, 28001 Madrid"
            opcional
          />
        </View>

        <Button label={esEdicion ? 'Guardar cambios' : 'Crear cliente'} onPress={handleGuardar} loading={guardando} />

        {esEdicion && (
          <Button label="Eliminar cliente" onPress={() => setModalEliminar(true)} variante="danger" loading={eliminando} />
        )}

      </ScrollView>

      <ConfirmModal
        visible={modalEliminar}
        titulo="Eliminar cliente"
        mensaje="Esta acción no se puede deshacer."
        labelConfirmar="Eliminar"
        peligroso
        onConfirmar={() => { setModalEliminar(false); handleEliminar() }}
        onCancelar={() => setModalEliminar(false)}
      />
    </>
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
  seccionTitulo: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  tipoRow: { flexDirection: 'row', gap: 10 },
  tipoBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tipoBtnActivo: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  tipoBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tipoBtnTextActivo: { color: Colors.primary },
})
