import { useState, useEffect, useMemo } from 'react'
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
  horas_mano_obra?: number | null
  coste_hora?: number | null
  materiales_coste?: number | null
  indirectos_porcentaje?: number | null
  margen_porcentaje?: number | null
}

interface Props {
  visible: boolean
  onClose: () => void
  onGuardar: (campos: CamposLinea) => Promise<void>
  onEliminar?: () => Promise<void>
  inicial?: Partial<CamposLinea>
  titulo?: string
  indirectosPorDefecto?: number
  margenPorDefecto?: number
}

const IVA_OPCIONES = [0, 4, 10, 21]
const UNIDADES = ['m²', 'm³', 'ml', 'ud', 'h', 'kg', 'partida']

function toStr(v: number | null | undefined): string {
  return v != null ? String(v) : ''
}

function parseN(s: string): number {
  return parseFloat(s.replace(',', '.')) || 0
}

export function LineaModal({
  visible, onClose, onGuardar, onEliminar, inicial, titulo = 'Partida',
  indirectosPorDefecto = 5, margenPorDefecto = 20,
}: Props) {
  const [descripcion, setDescripcion] = useState('')
  const [unidad, setUnidad] = useState('ud')
  const [cantidad, setCantidad] = useState('1')
  const [iva, setIva] = useState(21)

  // Modo simple
  const [precio, setPrecio] = useState('')

  // Modo desglose
  const [modoDesglose, setModoDesglose] = useState(false)
  const [horasMO, setHorasMO] = useState('')
  const [costePH, setCostePH] = useState('')
  const [matCantidad, setMatCantidad] = useState('')
  const [matPrecioUnit, setMatPrecioUnit] = useState('')
  const [margen, setMargen] = useState('20')
  const [indirectos, setIndirectos] = useState('5')

  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [confirmEliminar, setConfirmEliminar] = useState(false)

  useEffect(() => {
    if (!visible) return
    setDescripcion(inicial?.descripcion ?? '')
    setUnidad(inicial?.unidad ?? 'ud')
    setCantidad(String(inicial?.cantidad ?? '1'))
    setPrecio(inicial?.precio_unitario != null ? String(inicial.precio_unitario) : '')
    setIva(inicial?.iva_porcentaje ?? 21)

    const tieneDesglose = inicial?.horas_mano_obra != null || inicial?.materiales_coste != null
    setModoDesglose(tieneDesglose)
    setHorasMO(toStr(inicial?.horas_mano_obra))
    setCostePH(toStr(inicial?.coste_hora))
    setMatCantidad('')
    setMatPrecioUnit('')
    setMargen(toStr(inicial?.margen_porcentaje) || String(margenPorDefecto))
    setIndirectos(toStr(inicial?.indirectos_porcentaje) || String(indirectosPorDefecto))

    setGuardando(false)
    setEliminando(false)
    setConfirmEliminar(false)
  }, [visible, indirectosPorDefecto, margenPorDefecto])

  const esEdicion = !!inicial?.descripcion

  const matCosteCalc = parseN(matCantidad) * parseN(matPrecioUnit)
  // Si el usuario no ha introducido componentes de materiales, conservar el valor guardado
  const matCosteEfectivo = matCosteCalc > 0 ? matCosteCalc : (inicial?.materiales_coste ?? 0)

  const precioCalculado = useMemo(() => {
    const horas = parseN(horasMO)
    const ph = parseN(costePH)
    const matCalc = parseN(matCantidad) * parseN(matPrecioUnit)
    const mat = matCalc > 0 ? matCalc : (inicial?.materiales_coste ?? 0)
    const ind = parseN(indirectos)
    const mg = parseN(margen)
    const qty = parseN(cantidad) || 1
    const costeDirecto = horas * ph + mat
    if (costeDirecto <= 0) return 0
    return (costeDirecto * (1 + ind / 100) * (1 + mg / 100)) / qty
  }, [horasMO, costePH, matCantidad, matPrecioUnit, inicial?.materiales_coste, indirectos, margen, cantidad])

  const precioFinal = modoDesglose ? precioCalculado : parseN(precio)
  const qty = parseN(cantidad) || 1
  const importeSinIVA = precioFinal * qty

  const puedeGuardar = descripcion.trim().length > 0 &&
    (modoDesglose ? precioCalculado > 0 : precio.trim().length > 0)

  async function handleGuardar() {
    if (!puedeGuardar) return
    setGuardando(true)
    try {
      await onGuardar({
        descripcion: descripcion.trim(),
        unidad,
        cantidad: parseN(cantidad) || 1,
        precio_unitario: modoDesglose ? precioCalculado : parseN(precio),
        iva_porcentaje: iva,
        horas_mano_obra: modoDesglose ? (parseN(horasMO) || null) : null,
        coste_hora: modoDesglose ? (parseN(costePH) || null) : null,
        materiales_coste: modoDesglose ? (matCosteEfectivo || null) : null,
        indirectos_porcentaje: modoDesglose ? parseN(indirectos) : null,
        margen_porcentaje: modoDesglose ? parseN(margen) : null,
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

            {/* Cantidad */}
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

              {/* IVA */}
              <View style={styles.campoMitad}>
                <Text style={styles.label}>IVA</Text>
                <View style={styles.chipsCompactos}>
                  {IVA_OPCIONES.map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.chipCompacto, iva === p && styles.chipActivo]}
                      onPress={() => setIva(p)}
                    >
                      <Text style={[styles.chipText, iva === p && styles.chipTextoActivo]}>{p}%</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Toggle modo */}
            <Text style={styles.label}>Modo de precio</Text>
            <View style={styles.modoToggle}>
              <TouchableOpacity
                style={[styles.modoBtn, !modoDesglose && styles.modoBtnActivo]}
                onPress={() => setModoDesglose(false)}
              >
                <Text style={[styles.modoBtnTexto, !modoDesglose && styles.modoBtnTextoActivo]}>Precio directo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modoBtn, modoDesglose && styles.modoBtnActivo]}
                onPress={() => setModoDesglose(true)}
              >
                <Text style={[styles.modoBtnTexto, modoDesglose && styles.modoBtnTextoActivo]}>Calcular desde costes</Text>
              </TouchableOpacity>
            </View>

            {!modoDesglose ? (
              <>
                <Text style={styles.label}>Precio unitario (€) *</Text>
                <TextInput
                  style={styles.input}
                  value={precio}
                  onChangeText={setPrecio}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  placeholderTextColor={Colors.muted}
                />
              </>
            ) : (
              <View style={styles.desgloseBox}>
                {/* Mano de obra */}
                <Text style={styles.desgloseSeccion}>Mano de obra</Text>
                <View style={styles.fila}>
                  <View style={styles.campoMitad}>
                    <Text style={styles.label}>Horas</Text>
                    <TextInput
                      style={styles.input}
                      value={horasMO}
                      onChangeText={setHorasMO}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.muted}
                    />
                  </View>
                  <View style={styles.campoMitad}>
                    <Text style={styles.label}>€ / hora</Text>
                    <TextInput
                      style={styles.input}
                      value={costePH}
                      onChangeText={setCostePH}
                      keyboardType="decimal-pad"
                      placeholder="0,00"
                      placeholderTextColor={Colors.muted}
                    />
                  </View>
                </View>
                {parseN(horasMO) > 0 && parseN(costePH) > 0 && (
                  <Text style={styles.desgloseLinea}>
                    Coste M.O.: {(parseN(horasMO) * parseN(costePH)).toFixed(2)} €
                  </Text>
                )}

                {/* Materiales */}
                <Text style={[styles.desgloseSeccion, { marginTop: 10 }]}>Materiales</Text>
                <View style={styles.fila}>
                  <View style={styles.campoMitad}>
                    <Text style={styles.label}>Cantidad</Text>
                    <TextInput
                      style={styles.input}
                      value={matCantidad}
                      onChangeText={setMatCantidad}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.muted}
                    />
                  </View>
                  <View style={styles.campoMitad}>
                    <Text style={styles.label}>€ / unidad</Text>
                    <TextInput
                      style={styles.input}
                      value={matPrecioUnit}
                      onChangeText={setMatPrecioUnit}
                      keyboardType="decimal-pad"
                      placeholder="0,00"
                      placeholderTextColor={Colors.muted}
                    />
                  </View>
                </View>
                {matCosteCalc > 0 && (
                  <Text style={styles.desgloseLinea}>
                    Coste materiales: {matCosteCalc.toFixed(2)} €
                  </Text>
                )}
                {matCosteCalc === 0 && (inicial?.materiales_coste ?? 0) > 0 && (
                  <Text style={styles.desgloseLinea}>
                    Guardado: {Number(inicial!.materiales_coste).toFixed(2)} € — introduce cantidad y precio para recalcular
                  </Text>
                )}

                {/* Indirectos y margen */}
                <Text style={[styles.desgloseSeccion, { marginTop: 10 }]}>Indirectos y margen</Text>
                <View style={styles.fila}>
                  <View style={styles.campoMitad}>
                    <Text style={styles.label}>Indirectos (%)</Text>
                    <TextInput
                      style={styles.input}
                      value={indirectos}
                      onChangeText={setIndirectos}
                      keyboardType="decimal-pad"
                      placeholder="5"
                      placeholderTextColor={Colors.muted}
                    />
                  </View>
                  <View style={styles.campoMitad}>
                    <Text style={styles.label}>Margen (%)</Text>
                    <TextInput
                      style={styles.input}
                      value={margen}
                      onChangeText={setMargen}
                      keyboardType="decimal-pad"
                      placeholder="20"
                      placeholderTextColor={Colors.muted}
                    />
                  </View>
                </View>
                <View style={[styles.campoMitad, styles.precioAutoBox]}>
                  <Text style={styles.label}>Precio unitario calculado</Text>
                  <Text style={styles.precioAutoValor}>
                    {precioCalculado > 0 ? `${precioCalculado.toFixed(2)} €` : '—'}
                  </Text>
                </View>
              </View>
            )}

            {/* Preview total */}
            {importeSinIVA > 0 && (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Importe sin IVA</Text>
                <Text style={styles.previewValor}>{importeSinIVA.toFixed(2)} €</Text>
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
    maxHeight: '92%', paddingBottom: 24,
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
  chipsCompactos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipCompacto: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipActivo: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextoActivo: { color: '#fff' },
  modoToggle: {
    flexDirection: 'row', borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  modoBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.surface },
  modoBtnActivo: { backgroundColor: Colors.primary },
  modoBtnTexto: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  modoBtnTextoActivo: { color: '#fff' },
  desgloseBox: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 8,
  },
  desgloseSeccion: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  desgloseLinea: { fontSize: 12, color: Colors.textSecondary, marginTop: -4 },
  precioAutoBox: { justifyContent: 'flex-end' },
  precioAutoValor: { fontSize: 20, fontWeight: '800', color: Colors.primary, paddingVertical: 8 },
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
