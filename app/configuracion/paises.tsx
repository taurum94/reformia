import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Stack, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { Colors } from '../../constants/colors'
import type { Pais } from '../../types/database'

type FormState = { codigo: string; nombre: string }
const FORM_VACIO: FormState = { codigo: '', nombre: '' }

function ModalPais({
  visible,
  inicial,
  onClose,
  onGuardar,
}: {
  visible: boolean
  inicial?: Pais
  onClose: () => void
  onGuardar: (data: FormState) => void
}) {
  const [form, setForm] = useState<FormState>(inicial ?? FORM_VACIO)
  const editando = !!inicial

  function set(campo: keyof FormState) {
    return (v: string) => setForm(f => ({ ...f, [campo]: v }))
  }

  function handleGuardar() {
    if (!form.codigo.trim()) return Alert.alert('Error', 'El código es obligatorio')
    if (!form.nombre.trim()) return Alert.alert('Error', 'El nombre es obligatorio')
    onGuardar({ codigo: form.codigo.trim().toUpperCase(), nombre: form.nombre.trim() })
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitulo}>{editando ? 'Editar país' : 'Nuevo país'}</Text>
          <Input
            label="Código (ej. ES, FR, DE)"
            value={form.codigo}
            onChangeText={set('codigo')}
            placeholder="ES"
            autoCapitalize="characters"
            editable={!editando}
          />
          <Input
            label="Nombre"
            value={form.nombre}
            onChangeText={set('nombre')}
            placeholder="España"
          />
          <View style={styles.modalBtns}>
            <Button label="Cancelar" onPress={onClose} variante="secondary" style={{ flex: 1 }} />
            <Button label="Guardar" onPress={handleGuardar} style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default function PaisesScreen() {
  const [paises, setPaises] = useState<Pais[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editando, setEditando] = useState<Pais | undefined>()
  const [eliminando, setEliminando] = useState<Pais | null>(null)

  useFocusEffect(useCallback(() => { cargar() }, []))

  async function cargar() {
    setLoading(true)
    const { data, error } = await supabase.from('paises').select('*').order('nombre')
    if (error) Alert.alert('Error', error.message)
    else setPaises(data ?? [])
    setLoading(false)
  }

  function abrirNuevo() {
    setEditando(undefined)
    setModalVisible(true)
  }

  function abrirEditar(p: Pais) {
    setEditando(p)
    setModalVisible(true)
  }

  async function handleGuardar(data: FormState) {
    try {
      if (editando) {
        const { error } = await supabase.from('paises').update({ nombre: data.nombre }).eq('codigo', editando.codigo)
        if (error) throw error
      } else {
        const { error } = await supabase.from('paises').insert(data)
        if (error) throw error
      }
      setModalVisible(false)
      await cargar()
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  async function confirmarEliminar() {
    if (!eliminando) return
    const { error } = await supabase.from('paises').delete().eq('codigo', eliminando.codigo)
    if (error) Alert.alert('Error', error.message)
    else await cargar()
    setEliminando(null)
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Países',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerRight: () => (
          <TouchableOpacity onPress={abrirNuevo} style={{ marginRight: 16 }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300' }}>+</Text>
          </TouchableOpacity>
        ),
      }} />

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {paises.length === 0 ? (
            <View style={styles.vacio}>
              <Text style={styles.vacioTitulo}>Sin países</Text>
              <Text style={styles.vacioDesc}>Añade los países en los que operas</Text>
              <Button label="+ Añadir país" onPress={abrirNuevo} />
            </View>
          ) : (
            <View style={styles.lista}>
              {paises.map((p, i) => (
                <TouchableOpacity
                  key={p.codigo}
                  style={[styles.fila, i < paises.length - 1 && styles.filaBorde]}
                  onPress={() => abrirEditar(p)}
                >
                  <View style={styles.badge}>
                    <Text style={styles.badgeTxt}>{p.codigo}</Text>
                  </View>
                  <Text style={styles.filaNombre}>{p.nombre}</Text>
                  <TouchableOpacity onPress={() => setEliminando(p)} style={styles.btnEliminar}>
                    <Text style={styles.btnEliminarTxt}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <ModalPais
        visible={modalVisible}
        inicial={editando}
        onClose={() => setModalVisible(false)}
        onGuardar={handleGuardar}
      />

      <ConfirmModal
        visible={!!eliminando}
        titulo="Eliminar país"
        mensaje={`¿Eliminar "${eliminando?.nombre}"? Se eliminarán también sus provincias y zonas.`}
        labelConfirmar="Eliminar"
        peligroso
        onConfirmar={confirmarEliminar}
        onCancelar={() => setEliminando(null)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vacio: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 24,
    alignItems: 'center', gap: 12,
  },
  vacioTitulo: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  vacioDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  lista: {
    backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  fila: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  filaBorde: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  badge: {
    backgroundColor: Colors.primary, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, minWidth: 40, alignItems: 'center',
  },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  filaNombre: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  btnEliminar: { padding: 6 },
  btnEliminarTxt: { fontSize: 16, color: Colors.error, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, gap: 14,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
})
