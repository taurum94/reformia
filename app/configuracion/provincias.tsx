import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Stack, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { Colors } from '../../constants/colors'
import type { Pais, Provincia } from '../../types/database'

type FormState = { codigo_pais: string; codigo: string; nombre: string }
const FORM_VACIO: FormState = { codigo_pais: '', codigo: '', nombre: '' }

function SelectorPais({
  paises,
  seleccionado,
  onSeleccionar,
}: {
  paises: Pais[]
  seleccionado: string
  onSeleccionar: (codigo: string) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const pais = paises.find(p => p.codigo === seleccionado)

  return (
    <>
      <View>
        <Text style={styles.inputLabel}>País</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setAbierto(true)}>
          <Text style={pais ? styles.selectorTxt : styles.selectorPlaceholder}>
            {pais ? `${pais.codigo} — ${pais.nombre}` : 'Selecciona un país'}
          </Text>
          <Text style={styles.selectorArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={abierto} transparent animationType="slide" onRequestClose={() => setAbierto(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitulo}>Seleccionar país</Text>
              <TouchableOpacity onPress={() => setAbierto(false)} style={styles.pickerCerrar}>
                <Text style={styles.pickerCerrarTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}>
              {paises.map((p, i) => (
                <TouchableOpacity
                  key={p.codigo}
                  style={[styles.pickerFila, i < paises.length - 1 && styles.pickerFilaBorde]}
                  onPress={() => { onSeleccionar(p.codigo); setAbierto(false) }}
                >
                  <View style={styles.badge}>
                    <Text style={styles.badgeTxt}>{p.codigo}</Text>
                  </View>
                  <Text style={styles.pickerFilaNombre}>{p.nombre}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  )
}

function ModalProvincia({
  visible,
  inicial,
  paises,
  onClose,
  onGuardar,
}: {
  visible: boolean
  inicial?: Provincia
  paises: Pais[]
  onClose: () => void
  onGuardar: (data: FormState) => void
}) {
  const [form, setForm] = useState<FormState>(
    inicial
      ? { codigo_pais: inicial.codigo_pais, codigo: inicial.codigo, nombre: inicial.nombre }
      : FORM_VACIO
  )
  const editando = !!inicial

  function set(campo: keyof FormState) {
    return (v: string) => setForm(f => ({ ...f, [campo]: v }))
  }

  function handleGuardar() {
    if (!form.codigo_pais) return Alert.alert('Error', 'Selecciona un país')
    if (!form.codigo.trim()) return Alert.alert('Error', 'El código es obligatorio')
    if (!form.nombre.trim()) return Alert.alert('Error', 'El nombre es obligatorio')
    onGuardar({ codigo_pais: form.codigo_pais, codigo: form.codigo.trim().toUpperCase(), nombre: form.nombre.trim() })
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitulo}>{editando ? 'Editar provincia' : 'Nueva provincia'}</Text>
          <SelectorPais
            paises={paises}
            seleccionado={form.codigo_pais}
            onSeleccionar={v => setForm(f => ({ ...f, codigo_pais: v }))}
          />
          <Input
            label="Código (ej. M, B, V)"
            value={form.codigo}
            onChangeText={set('codigo')}
            placeholder="M"
            autoCapitalize="characters"
            editable={!editando}
          />
          <Input
            label="Nombre"
            value={form.nombre}
            onChangeText={set('nombre')}
            placeholder="Madrid"
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

export default function ProvinciasScreen() {
  const [paises, setPaises] = useState<Pais[]>([])
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [filtroPais, setFiltroPais] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editando, setEditando] = useState<Provincia | undefined>()
  const [eliminando, setEliminando] = useState<Provincia | null>(null)

  useFocusEffect(useCallback(() => { cargar() }, []))

  async function cargar() {
    setLoading(true)
    const [{ data: dp }, { data: dpr }] = await Promise.all([
      supabase.from('paises').select('*').order('nombre'),
      supabase.from('provincias').select('*').order('nombre'),
    ])
    setPaises(dp ?? [])
    setProvincias(dpr ?? [])
    if (!filtroPais && dp && dp.length > 0) setFiltroPais(dp[0].codigo)
    setLoading(false)
  }

  const filtradas = filtroPais
    ? provincias.filter(p => p.codigo_pais === filtroPais)
    : provincias

  function abrirNuevo() {
    setEditando(undefined)
    setModalVisible(true)
  }

  function abrirEditar(p: Provincia) {
    setEditando(p)
    setModalVisible(true)
  }

  async function handleGuardar(data: FormState) {
    try {
      if (editando) {
        const { error } = await supabase
          .from('provincias')
          .update({ nombre: data.nombre })
          .eq('codigo_pais', editando.codigo_pais)
          .eq('codigo', editando.codigo)
        if (error) throw error
      } else {
        const { error } = await supabase.from('provincias').insert(data)
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
    const { error } = await supabase
      .from('provincias')
      .delete()
      .eq('codigo_pais', eliminando.codigo_pais)
      .eq('codigo', eliminando.codigo)
    if (error) Alert.alert('Error', error.message)
    else await cargar()
    setEliminando(null)
  }

  const paisActual = paises.find(p => p.codigo === filtroPais)

  return (
    <>
      <Stack.Screen options={{
        title: 'Provincias',
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

          {/* Filtro por país */}
          {paises.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtroScroll}>
              {paises.map(p => (
                <TouchableOpacity
                  key={p.codigo}
                  style={[styles.filtroPill, filtroPais === p.codigo && styles.filtroPillActivo]}
                  onPress={() => setFiltroPais(p.codigo)}
                >
                  <Text style={[styles.filtroPillTxt, filtroPais === p.codigo && styles.filtroPillTxtActivo]}>
                    {p.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {filtradas.length === 0 ? (
            <View style={styles.vacio}>
              <Text style={styles.vacioTitulo}>Sin provincias</Text>
              <Text style={styles.vacioDesc}>
                {paisActual ? `Añade provincias de ${paisActual.nombre}` : 'Añade provincias'}
              </Text>
              <Button label="+ Añadir provincia" onPress={abrirNuevo} />
            </View>
          ) : (
            <View style={styles.lista}>
              {filtradas.map((p, i) => (
                <TouchableOpacity
                  key={`${p.codigo_pais}-${p.codigo}`}
                  style={[styles.fila, i < filtradas.length - 1 && styles.filaBorde]}
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

      <ModalProvincia
        visible={modalVisible}
        inicial={editando}
        paises={paises}
        onClose={() => setModalVisible(false)}
        onGuardar={handleGuardar}
      />

      <ConfirmModal
        visible={!!eliminando}
        titulo="Eliminar provincia"
        mensaje={`¿Eliminar "${eliminando?.nombre}"? Se eliminarán también sus zonas.`}
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
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filtroScroll: { marginBottom: 4 },
  filtroPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    marginRight: 8,
  },
  filtroPillActivo: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtroPillTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filtroPillTxtActivo: { color: '#fff' },
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
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  selector: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.background,
  },
  selectorTxt: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  selectorPlaceholder: { flex: 1, fontSize: 15, color: Colors.muted },
  selectorArrow: { fontSize: 20, color: Colors.muted },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, gap: 14,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: {
    backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '60%', paddingBottom: 24,
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickerTitulo: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  pickerCerrar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  pickerCerrarTxt: { fontSize: 14, color: Colors.textSecondary, fontWeight: '700' },
  pickerFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  pickerFilaBorde: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerFilaNombre: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
})
