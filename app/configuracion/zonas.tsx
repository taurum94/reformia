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
import type { Pais, Provincia, Zona } from '../../types/database'

type FormState = { codigo_pais: string; codigo_provincia: string; codigo: string; nombre: string }
const FORM_VACIO: FormState = { codigo_pais: '', codigo_provincia: '', codigo: '', nombre: '' }

function SelectorGenerico<T>({
  label,
  items,
  seleccionado,
  onSeleccionar,
  getKey,
  getLabel,
  placeholder,
}: {
  label: string
  items: T[]
  seleccionado: string
  onSeleccionar: (key: string) => void
  getKey: (item: T) => string
  getLabel: (item: T) => string
  placeholder: string
}) {
  const [abierto, setAbierto] = useState(false)
  const seleccionadoItem = items.find(i => getKey(i) === seleccionado)

  return (
    <>
      <View>
        <Text style={styles.inputLabel}>{label}</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setAbierto(true)}>
          <Text style={seleccionadoItem ? styles.selectorTxt : styles.selectorPlaceholder}>
            {seleccionadoItem ? getLabel(seleccionadoItem) : placeholder}
          </Text>
          <Text style={styles.selectorArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={abierto} transparent animationType="slide" onRequestClose={() => setAbierto(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitulo}>{label}</Text>
              <TouchableOpacity onPress={() => setAbierto(false)} style={styles.pickerCerrar}>
                <Text style={styles.pickerCerrarTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}>
              {items.map((item, i) => (
                <TouchableOpacity
                  key={getKey(item)}
                  style={[styles.pickerFila, i < items.length - 1 && styles.pickerFilaBorde]}
                  onPress={() => { onSeleccionar(getKey(item)); setAbierto(false) }}
                >
                  <Text style={styles.pickerFilaNombre}>{getLabel(item)}</Text>
                </TouchableOpacity>
              ))}
              {items.length === 0 && (
                <Text style={styles.pickerVacio}>Sin opciones disponibles</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  )
}

function ModalZona({
  visible,
  inicial,
  paises,
  provincias,
  onClose,
  onGuardar,
}: {
  visible: boolean
  inicial?: Zona
  paises: Pais[]
  provincias: Provincia[]
  onClose: () => void
  onGuardar: (data: FormState) => void
}) {
  const [form, setForm] = useState<FormState>(
    inicial
      ? { codigo_pais: inicial.codigo_pais, codigo_provincia: inicial.codigo_provincia, codigo: inicial.codigo, nombre: inicial.nombre }
      : FORM_VACIO
  )
  const editando = !!inicial

  const provsFiltradas = provincias.filter(p => p.codigo_pais === form.codigo_pais)

  function set(campo: keyof FormState) {
    return (v: string) => setForm(f => ({ ...f, [campo]: v }))
  }

  function handleGuardar() {
    if (!form.codigo_pais) return Alert.alert('Error', 'Selecciona un país')
    if (!form.codigo_provincia) return Alert.alert('Error', 'Selecciona una provincia')
    if (!form.codigo.trim()) return Alert.alert('Error', 'El código es obligatorio')
    if (!form.nombre.trim()) return Alert.alert('Error', 'El nombre es obligatorio')
    onGuardar({
      codigo_pais: form.codigo_pais,
      codigo_provincia: form.codigo_provincia,
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
    })
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.modalCard} keyboardShouldPersistTaps="handled">
          <Text style={styles.modalTitulo}>{editando ? 'Editar zona' : 'Nueva zona'}</Text>
          <SelectorGenerico<Pais>
            label="País"
            items={paises}
            seleccionado={form.codigo_pais}
            onSeleccionar={v => setForm(f => ({ ...f, codigo_pais: v, codigo_provincia: '' }))}
            getKey={p => p.codigo}
            getLabel={p => `${p.codigo} — ${p.nombre}`}
            placeholder="Selecciona un país"
          />
          <SelectorGenerico<Provincia>
            label="Provincia"
            items={provsFiltradas}
            seleccionado={form.codigo_provincia}
            onSeleccionar={v => setForm(f => ({ ...f, codigo_provincia: v }))}
            getKey={p => p.codigo}
            getLabel={p => `${p.codigo} — ${p.nombre}`}
            placeholder={form.codigo_pais ? 'Selecciona una provincia' : 'Primero selecciona un país'}
          />
          <Input
            label="Código (ej. Z1, NORTE)"
            value={form.codigo}
            onChangeText={set('codigo')}
            placeholder="Z1"
            autoCapitalize="characters"
            editable={!editando}
          />
          <Input
            label="Nombre"
            value={form.nombre}
            onChangeText={set('nombre')}
            placeholder="Zona Norte"
          />
          <View style={styles.modalBtns}>
            <Button label="Cancelar" onPress={onClose} variante="secondary" style={{ flex: 1 }} />
            <Button label="Guardar" onPress={handleGuardar} style={{ flex: 1 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default function ZonasScreen() {
  const [paises, setPaises] = useState<Pais[]>([])
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [filtroPais, setFiltroPais] = useState<string>('')
  const [filtroProvincia, setFiltroProvincia] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editando, setEditando] = useState<Zona | undefined>()
  const [eliminando, setEliminando] = useState<Zona | null>(null)

  useFocusEffect(useCallback(() => { cargar() }, []))

  async function cargar() {
    setLoading(true)
    const [{ data: dp }, { data: dpr }, { data: dz }] = await Promise.all([
      supabase.from('paises').select('*').order('nombre'),
      supabase.from('provincias').select('*').order('nombre'),
      supabase.from('zonas').select('*').order('nombre'),
    ])
    setPaises(dp ?? [])
    setProvincias(dpr ?? [])
    setZonas(dz ?? [])
    if (!filtroPais && dp && dp.length > 0) {
      setFiltroPais(dp[0].codigo)
      const prvsDelPais = (dpr ?? []).filter(p => p.codigo_pais === dp[0].codigo)
      if (prvsDelPais.length > 0) setFiltroProvincia(prvsDelPais[0].codigo)
    }
    setLoading(false)
  }

  const provsFiltradas = provincias.filter(p => p.codigo_pais === filtroPais)
  const zonasFiltradas = zonas.filter(z =>
    (!filtroPais || z.codigo_pais === filtroPais) &&
    (!filtroProvincia || z.codigo_provincia === filtroProvincia)
  )

  function abrirNuevo() {
    setEditando(undefined)
    setModalVisible(true)
  }

  function abrirEditar(z: Zona) {
    setEditando(z)
    setModalVisible(true)
  }

  async function handleGuardar(data: FormState) {
    try {
      if (editando) {
        const { error } = await supabase
          .from('zonas')
          .update({ nombre: data.nombre })
          .eq('codigo_pais', editando.codigo_pais)
          .eq('codigo_provincia', editando.codigo_provincia)
          .eq('codigo', editando.codigo)
        if (error) throw error
      } else {
        const { error } = await supabase.from('zonas').insert(data)
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
      .from('zonas')
      .delete()
      .eq('codigo_pais', eliminando.codigo_pais)
      .eq('codigo_provincia', eliminando.codigo_provincia)
      .eq('codigo', eliminando.codigo)
    if (error) Alert.alert('Error', error.message)
    else await cargar()
    setEliminando(null)
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Zonas',
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
                  onPress={() => {
                    setFiltroPais(p.codigo)
                    const prv = provincias.find(pr => pr.codigo_pais === p.codigo)
                    setFiltroProvincia(prv?.codigo ?? '')
                  }}
                >
                  <Text style={[styles.filtroPillTxt, filtroPais === p.codigo && styles.filtroPillTxtActivo]}>
                    {p.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Filtro por provincia */}
          {provsFiltradas.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtroScroll}>
              {provsFiltradas.map(p => (
                <TouchableOpacity
                  key={p.codigo}
                  style={[styles.filtroPill, filtroProvincia === p.codigo && styles.filtroPillActivo]}
                  onPress={() => setFiltroProvincia(p.codigo)}
                >
                  <Text style={[styles.filtroPillTxt, filtroProvincia === p.codigo && styles.filtroPillTxtActivo]}>
                    {p.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {zonasFiltradas.length === 0 ? (
            <View style={styles.vacio}>
              <Text style={styles.vacioTitulo}>Sin zonas</Text>
              <Text style={styles.vacioDesc}>Añade zonas para segmentar precios por área geográfica</Text>
              <Button label="+ Añadir zona" onPress={abrirNuevo} />
            </View>
          ) : (
            <View style={styles.lista}>
              {zonasFiltradas.map((z, i) => (
                <TouchableOpacity
                  key={`${z.codigo_pais}-${z.codigo_provincia}-${z.codigo}`}
                  style={[styles.fila, i < zonasFiltradas.length - 1 && styles.filaBorde]}
                  onPress={() => abrirEditar(z)}
                >
                  <View style={styles.badge}>
                    <Text style={styles.badgeTxt}>{z.codigo}</Text>
                  </View>
                  <Text style={styles.filaNombre}>{z.nombre}</Text>
                  <TouchableOpacity onPress={() => setEliminando(z)} style={styles.btnEliminar}>
                    <Text style={styles.btnEliminarTxt}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <ModalZona
        visible={modalVisible}
        inicial={editando}
        paises={paises}
        provincias={provincias}
        onClose={() => setModalVisible(false)}
        onGuardar={handleGuardar}
      />

      <ConfirmModal
        visible={!!eliminando}
        titulo="Eliminar zona"
        mensaje={`¿Eliminar "${eliminando?.nombre}"?`}
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
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filtroScroll: { flexGrow: 0 },
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
    backgroundColor: Colors.accent, borderRadius: 6,
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
  pickerVacio: { textAlign: 'center', color: Colors.textSecondary, padding: 24, fontSize: 14 },
})
