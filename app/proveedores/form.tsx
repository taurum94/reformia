import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useEmpresa } from '../../hooks/useEmpresa'
import { useProveedores } from '../../hooks/useProveedores'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { Colors } from '../../constants/colors'

const CATEGORIAS = [
  { id: 'albanileria', label: 'Albañilería' },
  { id: 'electricidad', label: 'Electricidad' },
  { id: 'fontaneria', label: 'Fontanería' },
  { id: 'carpinteria', label: 'Carpintería' },
  { id: 'pintura', label: 'Pintura' },
  { id: 'solados', label: 'Solados y alicatados' },
  { id: 'yeso', label: 'Yeso y escayola' },
  { id: 'otros', label: 'Otros' },
]

export default function ProveedorFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const esEdicion = !!id
  const { empresa } = useEmpresa()
  const { proveedores, crear, actualizar, eliminar } = useProveedores(empresa?.id)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [form, setForm] = useState({ nombre: '', nif: '', telefono: '', email: '', web: '', categorias: [] as string[] })

  useEffect(() => {
    if (esEdicion) {
      const p = proveedores.find(x => x.id === id)
      if (p) setForm({ nombre: p.nombre, nif: p.nif ?? '', telefono: p.telefono ?? '', email: p.email ?? '', web: p.web ?? '', categorias: p.categorias ?? [] })
    }
  }, [id, proveedores])

  function set(campo: keyof typeof form) { return (v: string) => setForm(f => ({ ...f, [campo]: v })) }

  function toggleCategoria(cat: string) {
    setForm(f => ({
      ...f,
      categorias: f.categorias.includes(cat) ? f.categorias.filter(c => c !== cat) : [...f.categorias, cat],
    }))
  }

  async function handleGuardar() {
    if (!form.nombre.trim()) return Alert.alert('Campo obligatorio', 'El nombre es obligatorio')
    setGuardando(true)
    try {
      if (esEdicion) { await actualizar(id!, form); router.back() }
      else { await crear(form); Alert.alert('✓ Creado', 'Proveedor añadido'); router.back() }
    } catch (e: any) { Alert.alert('Error', e.message) }
    finally { setGuardando(false) }
  }

  async function handleEliminar() {
    setEliminando(true)
    try { await eliminar(id!); router.back() }
    catch (e: any) { Alert.alert('Error', e.message) }
    finally { setEliminando(false) }
  }

  if (esEdicion && proveedores.length === 0) return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>

  return (
    <>
      <Stack.Screen options={{ title: esEdicion ? 'Editar proveedor' : 'Nuevo proveedor', headerShown: true, headerStyle: { backgroundColor: Colors.primary }, headerTintColor: '#fff' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Datos del proveedor</Text>
          <Input label="Nombre" value={form.nombre} onChangeText={set('nombre')} placeholder="Materiales García S.L." />
          <Input label="NIF / CIF" value={form.nif} onChangeText={set('nif')} placeholder="B12345678" autoCapitalize="characters" opcional />
          <Input label="Teléfono" value={form.telefono} onChangeText={set('telefono')} keyboardType="phone-pad" placeholder="600 000 000" opcional />
          <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" placeholder="info@proveedor.com" opcional />
          <Input label="Web" value={form.web} onChangeText={set('web')} keyboardType="url" autoCapitalize="none" placeholder="https://proveedor.com" opcional />
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Categorías que suministra</Text>
          <View style={styles.cats}>
            {CATEGORIAS.map(c => {
              const activo = form.categorias.includes(c.id)
              return (
                <TouchableOpacity key={c.id} style={[styles.catChip, activo && styles.catChipActivo]} onPress={() => toggleCategoria(c.id)}>
                  <Text style={[styles.catText, activo && styles.catTextActivo]}>{c.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <Button label={esEdicion ? 'Guardar cambios' : 'Crear proveedor'} onPress={handleGuardar} loading={guardando} />
        {esEdicion && <Button label="Eliminar proveedor" onPress={() => setModalEliminar(true)} variante="danger" loading={eliminando} />}
      </ScrollView>
      <ConfirmModal
        visible={modalEliminar}
        titulo="Eliminar proveedor"
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
  seccion: { backgroundColor: Colors.surface, borderRadius: 14, padding: 18, gap: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  seccionTitulo: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  catChipActivo: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  catText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  catTextActivo: { color: Colors.primary, fontWeight: '700' },
})
