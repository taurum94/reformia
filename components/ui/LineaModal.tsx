import { useState, useEffect } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Colors } from '../../constants/colors'

export interface CamposLinea {
  descripcion: string
  unidad: string
  cantidad: number
  precio_unitario: number
  iva_porcentaje: number
}

interface Props {
  visible: boolean
  onClose: () => void
  onGuardar: (campos: CamposLinea) => Promise<void>
  onEliminar?: () => Promise<void>
  inicial?: Partial<CamposLinea>
  titulo?: string
}

const IVA_OPCIONES = [0, 4, 10, 21]
const UNIDADES = ['m²', 'm³', 'ml', 'ud', 'h', 'kg', 'partida']

export function LineaModal({ visible, onClose, onGuardar, onEliminar, inicial, titulo = 'Partida' }: Props) {
  const [descripcion, setDescripcion] = useState('')
  const [unidad, setUnidad] = useState('ud')
  const [cantidad, setCantidad] = useState('1')
  const [precio, setPrecio] = useState('')
  const [iva, setIva] = useState(21)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [confirmEliminar, setConfirmEliminar] = useState(false)

  useEffect(() => {
    if (visible) {
      setDescripcion(inicial?.descripcion ?? '')
      setUnidad(inicial?.unidad ?? 'ud')
      setCantidad(String(inicial?.cantidad ?? '1'))
      setPrecio(inicial?.precio_unitario != null ? String(inicial.precio_unitario) : '')
      setIva(inicial?.iva_porcentaje ?? 21)
      setGuardando(false)
      setEliminando(false)
      setConfirmEliminar(false)
    }
  }, [visible])

  const esEdicion = !!inicial?.descripcion

  async function handleGuardar() {
    if (!descripcion.trim() || !precio.trim()) return
    setGuardando(true)
    try {
      await onGuardar({
        descripcion: descripcion.trim(),
        unidad,
        cantidad: parseFloat(cantidad.replace(',', '.')) || 1,
        precio_unitario: parseFloat(precio.replace(',', '.')) || 0,
        iva_porcentaje: iva,
      })
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar() {
    if (!onEliminar) return
    if (!confirmEliminar) {
      setConfirmEliminar(true)
      setTimeout(() => setConfirmEliminar(false), 3000)
      return
    }
    setEliminando(true)
    try {
      await onEliminar()
      onClose()
    } finally {
      setEliminando(false)
    }
  }

  const puedeGuardar = descripcion.trim().length > 0 && precio.trim().length > 0

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.titulo}>{esEdicion ? `Editar ${titulo}` : `Nueva ${titulo}`}</Text>
            <TouchableOpacity onPress={onClose} style={styles.btnCerrar}>
              <Text style={styles.btnCerrarTexto}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

            {/* Descripción */}
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Ej: Alicatado de paredes con azulejo 30×60"
              placeholderTextColor={Colors.muted}
              multiline
              numberOfLines={2}
            />

            {/* Unidad */}
            <Text style={styles.label}>Unidad</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              <View style={styles.chips}>
                {UNIDADES.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.chip, unidad === u && styles.chipActivo]}
                    onPress={() => setUnidad(u)}
                  >
                    <Text style={[styles.chipText, unidad === u && styles.chipTextoActivo]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Cantidad y Precio */}
            <View style={styles.fila}>
              <View style={styles.campoMitad}>
                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  style={styles.input}
                  value={cantidad}
                  onChangeText={setCantidad}
                  keyboardType="decimal-pad"
                  placeholder="1"
                  placeholderTextColor={Colors.muted}
                />
              </View>
              <View style={styles.campoMitad}>
                <Text style={styles.label}>Precio unitario (€) *</Text>
                <TextInput
                  style={styles.input}
                  value={precio}
                  onChangeText={setPrecio}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  placeholderTextColor={Colors.muted}
                />
              </View>
            </View>

            {/* IVA */}
            <Text style={styles.label}>IVA</Text>
            <View style={styles.chips}>
              {IVA_OPCIONES.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, iva === p && styles.chipActivo]}
                  onPress={() => setIva(p)}
                >
                  <Text style={[styles.chipText, iva === p && styles.chipTextoActivo]}>{p}%</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview total */}
            {puedeGuardar && (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Importe sin IVA</Text>
                <Text style={styles.previewValor}>
                  {((parseFloat(cantidad.replace(',', '.')) || 1) * (parseFloat(precio.replace(',', '.')) || 0)).toFixed(2)} €
                </Text>
              </View>
            )}

          </ScrollView>

          {/* Botones */}
          <View style={styles.botones}>
            {esEdicion && onEliminar && (
              <TouchableOpacity
                style={[styles.btnEliminar, eliminando && { opacity: 0.6 }]}
                onPress={handleEliminar}
                disabled={eliminando}
              >
                {eliminando
                  ? <ActivityIndicator color={Colors.error} size="small" />
                  : <Text style={styles.btnEliminarTexto}>
                      {confirmEliminar ? '¿Seguro?' : 'Eliminar'}
                    </Text>
                }
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btnGuardar, !puedeGuardar && styles.btnGuardarDisabled, guardando && { opacity: 0.7 }]}
              onPress={handleGuardar}
              disabled={!puedeGuardar || guardando}
            >
              {guardando
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnGuardarTexto}>{esEdicion ? 'Guardar cambios' : 'Añadir partida'}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '90%', paddingBottom: 24,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  titulo: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  btnCerrar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  btnCerrarTexto: { fontSize: 14, color: Colors.textSecondary, fontWeight: '700' },
  form: { padding: 20, gap: 12, paddingBottom: 8 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },
  fila: { flexDirection: 'row', gap: 12 },
  campoMitad: { flex: 1, gap: 6 },
  chipsScroll: { maxHeight: 44 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipActivo: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextoActivo: { color: '#fff' },
  preview: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 10, padding: 14, marginTop: 4,
  },
  previewLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  previewValor: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  botones: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  btnEliminar: {
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.error, alignItems: 'center', justifyContent: 'center',
  },
  btnEliminarTexto: { color: Colors.error, fontWeight: '700', fontSize: 14 },
  btnGuardar: {
    flex: 1, backgroundColor: Colors.accent, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  btnGuardarDisabled: { backgroundColor: Colors.muted },
  btnGuardarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
