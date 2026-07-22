import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useEmpresa } from '../../hooks/useEmpresa'
import { useMateriales } from '../../hooks/useMateriales'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { Colors } from '../../constants/colors'

const UNIDADES = ['ud', 'm²', 'm³', 'm', 'kg', 'l', 'saco', 'caja', 'rollo', 'ml']
const CATEGORIAS = ['Albañilería', 'Electricidad', 'Fontanería', 'Carpintería', 'Pintura', 'Solados y alicatados', 'Yeso y escayola', 'Otros']

export default function MaterialFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const esEdicion = !!id
  const { empresa } = useEmpresa()
  const { materiales, crear, actualizar, eliminar } = useMateriales(empresa?.id)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [form, setForm] = useState({ codigo: '', descripcion: '', categoria: 'Otros', unidad: 'ud' })

  useEffect(() => {
    if (esEdicion) {
      const m = materiales.find(x => x.id === id)
      if (m) setForm({ codigo: m.codigo, descripcion: m.descripcion, categoria: m.categoria, unidad: m.unidad })
    }
  }, [id, materiales])

  function set(campo: keyof typeof form) { return (v: string) => setForm(f => ({ ...f, [campo]: v })) }

  async function handleGuardar() {
    if (!form.descripcion.trim()) return Alert.alert('Campo obligatorio', 'La descripción es obligatoria')
    if (!form.codigo.trim()) return Alert.alert('Campo obligatorio', 'El código es obligatorio')
    setGuardando(true)
    try {
      if (esEdicion) { await actualizar(id!, form); router.back() }
      else { await crear(form); Alert.alert('✓ Creado', 'Material añadido'); router.back() }
    } catch (e: any) { Alert.alert('Error', e.message) }
    finally { setGuardando(false) }
  }

  async function handleEliminar() {
    setEliminando(true)
    try { await eliminar(id!); router.back() }
    catch (e: any) { Alert.alert('Error', e.message) }
    finally { setEliminando(false) }
  }

  if (esEdicion && materiales.length === 0) return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>

  return (
    <>
      <Stack.Screen options={{ title: esEdicion ? 'Editar material' : 'Nuevo material', headerShown: true, headerStyle: { backgroundColor: Colors.primary }, headerTintColor: '#fff' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Identificación</Text>
          <Input label="Código" value={form.codigo} onChangeText={set('codigo')} placeholder="MAT-001" autoCapitalize="characters" />
          <Input label="Descripción" value={form.descripcion} onChangeText={set('descripcion')} placeholder="Azulejo 30x60 cm blanco mate" />
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Categoría</Text>
          <View style={styles.chips}>
            {CATEGORIAS.map(c => (
              <Button key={c} label={c} onPress={() => setForm(f => ({ ...f, categoria: c }))}
                variante={form.categoria === c ? 'primary' : 'secondary'}
                style={styles.chip} />
            ))}
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Unidad de medida</Text>
          <View style={styles.chips}>
            {UNIDADES.map(u => (
              <Button key={u} label={u} onPress={() => setForm(f => ({ ...f, unidad: u }))}
                variante={form.unidad === u ? 'primary' : 'secondary'}
                style={styles.chip} />
            ))}
          </View>
        </View>

        <Button label={esEdicion ? 'Guardar cambios' : 'Crear material'} onPress={handleGuardar} loading={guardando} />
        {esEdicion && <Button label="Eliminar material" onPress={() => setModalEliminar(true)} variante="danger" loading={eliminando} />}
      </ScrollView>

      <ConfirmModal
        visible={modalEliminar}
        titulo="Eliminar material"
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 4, height: 36, minWidth: 60 },
})
