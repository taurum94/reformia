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
import type { Pais, Provincia, Zona, Ubicacion } from '../../types/database'

type UbicacionFull = Ubicacion & {
  paises?: { nombre: string }
  provincias?: { nombre: string }
  zonas?: { nombre: string }
}

type FormState = {
  municipio: string
  codigo_pais: string
  codigo_provincia: string
  codigo_zona: string
}
const FORM_VACIO: FormState = { municipio: '', codigo_pais: '', codigo_provincia: '', codigo_zona: '' }

function SelectorGenerico<T>({
  label,
  items,
  seleccionado,
  onSeleccionar,
  getKey,
  getLabel,
  placeholder,
  opcional,
}: {
  label: string
  items: T[]
  seleccionado: string
  onSeleccionar: (key: string) => void
  getKey: (item: T) => string
  getLabel: (item: T) => string
  placeholder: string
  opcional?: boolean
}) {
  const [abierto, setAbierto] = useState(false)
  const seleccionadoItem = items.find(i => getKey(i) === seleccionado)

  return (
    <>
      <View>
        <Text style={styles.inputLabel}>
          {label}{opcional && <Text style={styles.opcional}> (opcional)</Text>}
        </Text>
        <TouchableOpacity style={styles.selector} onPress={() => setAbierto(true)}>
          <Text style={seleccionadoItem ? styles.selectorTxt : styles.selectorPlaceholder}>
            {seleccionadoItem ? getLabel(seleccionadoItem) : placeholder}
          </Text>
          {seleccionadoItem && opcional ? (
            <TouchableOpacity onPress={() => onSeleccionar('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.selectorLimpiar}>✕</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.selectorArrow}>›</Text>
          )}
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

function ModalUbicacion({
  visible,
  inicial,
  paises,
  provincias,
  zonas,
  onClose,
  onGuardar,
}: {
  visible: boolean
  inicial?: UbicacionFull
  paises: Pais[]
  provincias: Provincia[]
  zonas: Zona[]
  onClose: () => void
  onGuardar: (data: FormState) => void
}) {
  const [form, setForm] = useState<FormState>(
    inicial
      ? {
          municipio: inicial.municipio ?? '',
          codigo_pais: inicial.codigo_pais ?? '',
          codigo_provincia: inicial.codigo_provincia ?? '',
          codigo_zona: inicial.codigo_zona ?? '',
        }
      : FORM_VACIO
  )
  const editando = !!inicial

  const provsFiltradas = provincias.filter(p => p.codigo_pais === form.codigo_pais)
  const zonasFiltradas = zonas.filter(z =>
    z.codigo_pais === form.codigo_pais && z.codigo_provincia === form.codigo_provincia
  )

  function set(campo: keyof FormState) {
    return (v: string) => setForm(f => ({ ...f, [campo]: v }))
  }

  function handleGuardar() {
    if (!form.codigo_pais) return Alert.alert('Error', 'Selecciona un país')
    onGuardar({
      municipio: form.municipio.trim(),
      codigo_pais: form.codigo_pais,
      codigo_provincia: form.codigo_provincia || '',
      codigo_zona: form.codigo_zona || '',
    })
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.modalCard} keyboardShouldPersistTaps="handled">
          <Text style={styles.modalTitulo}>{editando ? 'Editar ubicación' : 'Nueva ubicación'}</Text>
          <SelectorGenerico<Pais>
            label="País"
            items={paises}
            seleccionado={form.codigo_pais}
            onSeleccionar={v => setForm(f => ({ ...f, codigo_pais: v, codigo_provincia: '', codigo_zona: '' }))}
            getKey={p => p.codigo}
            getLabel={p => p.nombre}
            placeholder="Selecciona un país"
          />
          <SelectorGenerico<Provincia>
            label="Provincia"
            items={provsFiltradas}
            seleccionado={form.codigo_provincia}
            onSeleccionar={v => setForm(f => ({ ...f, codigo_provincia: v, codigo_zona: '' }))}
            getKey={p => p.codigo}
            getLabel={p => p.nombre}
            placeholder={form.codigo_pais ? 'Selecciona una provincia' : 'Primero selecciona un país'}
            opcional
          />
          <SelectorGenerico<Zona>
            label="Zona"
            items={zonasFiltradas}
            seleccionado={form.codigo_zona}
            onSeleccionar={set('codigo_zona')}
            getKey={z => z.codigo}
            getLabel={z => z.nombre}
            placeholder={form.codigo_provincia ? 'Selecciona una zona' : 'Primero selecciona una provincia'}
            opcional
          />
          <Input
            label="Municipio"
            value={form.municipio}
            onChangeText={set('municipio')}
            placeholder="Madrid"
            opcional
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

function etiquetaUbicacion(u: UbicacionFull): string {
  const partes = [
    u.paises?.nombre,
    u.provincias?.nombre,
    u.zonas?.nombre,
    u.municipio,
  ].filter(Boolean)
  return partes.join(' › ')
}

export default function UbicacionesScreen() {
  const [paises, setPaises] = useState<Pais[]>([])
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [ubicaciones, setUbicaciones] = useState<UbicacionFull[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editando, setEditando] = useState<UbicacionFull | undefined>()
  const [eliminando, setEliminando] = useState<UbicacionFull | null>(null)

  useFocusEffect(useCallback(() => { cargar() }, []))

  async function cargar() {
    setLoading(true)
    const [{ data: dp }, { data: dpr }, { data: dz }, { data: du }] = await Promise.all([
      supabase.from('paises').select('*').order('nombre'),
      supabase.from('provincias').select('*').order('nombre'),
      supabase.from('zonas').select('*').order('nombre'),
      supabase.from('ubicaciones').select('*, paises(nombre), provincias(nombre), zonas(nombre)').order('municipio'),
    ])
    setPaises(dp ?? [])
    setProvincias(dpr ?? [])
    setZonas(dz ?? [])
    setUbicaciones((du as UbicacionFull[]) ?? [])
    setLoading(false)
  }

  function abrirNuevo() {
    setEditando(undefined)
    setModalVisible(true)
  }

  function abrirEditar(u: UbicacionFull) {
    setEditando(u)
    setModalVisible(true)
  }

  async function handleGuardar(data: FormState) {
    try {
      const payload = {
        municipio: data.municipio || null,
        codigo_pais: data.codigo_pais || null,
        codigo_provincia: data.codigo_provincia || null,
        codigo_zona: data.codigo_zona || null,
      }
      if (editando) {
        const { error } = await supabase.from('ubicaciones').update(payload).eq('id', editando.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('ubicaciones').insert(payload)
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
    const { error } = await supabase.from('ubicaciones').delete().eq('id', eliminando.id)
    if (error) Alert.alert('Error', error.message)
    else await cargar()
    setEliminando(null)
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Ubicaciones',
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
          <Text style={styles.desc}>
            Las ubicaciones combinan país, provincia y zona. Se usan para definir precios de mano de obra y materiales por área geográfica.
          </Text>

          {ubicaciones.length === 0 ? (
            <View style={styles.vacio}>
              <Text style={styles.vacioTitulo}>Sin ubicaciones</Text>
              <Text style={styles.vacioDesc}>Crea ubicaciones para diferenciar precios por zona geográfica</Text>
              <Button label="+ Añadir ubicación" onPress={abrirNuevo} />
            </View>
          ) : (
            <View style={styles.lista}>
              {ubicaciones.map((u, i) => (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.fila, i < ubicaciones.length - 1 && styles.filaBorde]}
                  onPress={() => abrirEditar(u)}
                >
                  <View style={styles.filaInfo}>
                    <Text style={styles.filaNombre}>{etiquetaUbicacion(u) || '(sin nombre)'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setEliminando(u)} style={styles.btnEliminar}>
                    <Text style={styles.btnEliminarTxt}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <ModalUbicacion
        visible={modalVisible}
        inicial={editando}
        paises={paises}
        provincias={provincias}
        zonas={zonas}
        onClose={() => setModalVisible(false)}
        onGuardar={handleGuardar}
      />

      <ConfirmModal
        visible={!!eliminando}
        titulo="Eliminar ubicación"
        mensaje={`¿Eliminar "${etiquetaUbicacion(eliminando!)}"`}
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
  desc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
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
  filaInfo: { flex: 1 },
  filaNombre: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  btnEliminar: { padding: 6 },
  btnEliminarTxt: { fontSize: 16, color: Colors.error, fontWeight: '700' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  opcional: { fontSize: 12, color: Colors.muted, fontWeight: '400' },
  selector: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.background,
  },
  selectorTxt: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  selectorPlaceholder: { flex: 1, fontSize: 15, color: Colors.muted },
  selectorArrow: { fontSize: 20, color: Colors.muted },
  selectorLimpiar: { fontSize: 14, color: Colors.error, fontWeight: '700', paddingLeft: 8 },
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
