import { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'
import { Stack } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useEmpresa } from '../../hooks/useEmpresa'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { Colors } from '../../constants/colors'

const CATEGORIAS_BASE = [
  { id: 'albanileria', label: 'Albañilería' },
  { id: 'electricidad', label: 'Electricidad' },
  { id: 'fontaneria', label: 'Fontanería' },
  { id: 'carpinteria', label: 'Carpintería' },
  { id: 'pintura', label: 'Pintura' },
  { id: 'solados', label: 'Solados y alicatados' },
  { id: 'yeso', label: 'Yeso y escayola' },
]

const BASE_IDS = new Set(CATEGORIAS_BASE.map(c => c.id))

type DbRow = { id: string; empresa_id: string; categoria: string; coste_hora: number; ubicacion_id: string | null }
type PrecioMO = { id?: string; categoria: string; label: string; coste_hora: string; esCustom: boolean }

export default function PreciosScreen() {
  const { empresa } = useEmpresa()
  const [precios, setPrecios] = useState<PrecioMO[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [precioAEliminar, setPrecioAEliminar] = useState<PrecioMO | null>(null)
  const [indirectosPct, setIndirectosPct] = useState('5')
  const [margenPct, setMargenPct] = useState('20')

  useEffect(() => {
    if (!empresa?.id) return
    cargar()
    setIndirectosPct(String(empresa.indirectos_porcentaje ?? 5))
    setMargenPct(String(empresa.margen_porcentaje ?? 20))
  }, [empresa?.id])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('precios_mano_obra')
      .select('*')
      .eq('empresa_id', empresa!.id)
      .is('ubicacion_id', null) as { data: DbRow[] | null }

    const base: PrecioMO[] = CATEGORIAS_BASE.map(c => {
      const existente = data?.find(d => d.categoria === c.id)
      return {
        id: existente?.id,
        categoria: c.id,
        label: c.label,
        coste_hora: existente ? String(existente.coste_hora) : '',
        esCustom: false,
      }
    })

    const custom: PrecioMO[] = (data ?? [])
      .filter(d => !BASE_IDS.has(d.categoria))
      .map(d => ({ id: d.id, categoria: d.categoria, label: d.categoria, coste_hora: String(d.coste_hora), esCustom: true }))

    setPrecios([...base, ...custom])
    setLoading(false)
  }

  function setPrecio(categoria: string, valor: string) {
    setPrecios(p => p.map(x => x.categoria === categoria ? { ...x, coste_hora: valor } : x))
  }

  function setLabel(categoria: string, valor: string) {
    setPrecios(p => p.map(x => x.categoria === categoria ? { ...x, label: valor } : x))
  }

  function añadirCategoria() {
    const tempKey = `__new_${Date.now()}`
    setPrecios(p => [...p, { categoria: tempKey, label: '', coste_hora: '', esCustom: true }])
  }

  async function confirmarEliminar() {
    if (!precioAEliminar) return
    try {
      if (precioAEliminar.id) {
        const { error } = await supabase.from('precios_mano_obra').delete().eq('id', precioAEliminar.id)
        if (error) throw error
      }
      setPrecios(p => p.filter(x => x.categoria !== precioAEliminar.categoria))
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setPrecioAEliminar(null)
    }
  }

  async function handleGuardar() {
    const invalidos = precios.filter(p => p.coste_hora && isNaN(parseFloat(p.coste_hora.replace(',', '.'))))
    if (invalidos.length > 0) return Alert.alert('Error', 'Algunos precios no son válidos')

    const customSinNombre = precios.filter(p => p.esCustom && p.coste_hora && !p.label.trim())
    if (customSinNombre.length > 0) return Alert.alert('Error', 'Todas las categorías personalizadas deben tener un nombre')

    const indirectos = parseFloat(indirectosPct.replace(',', '.'))
    const margen = parseFloat(margenPct.replace(',', '.'))
    if (isNaN(indirectos) || indirectos < 0) return Alert.alert('Error', 'El % de indirectos no es válido')
    if (isNaN(margen) || margen < 0) return Alert.alert('Error', 'El % de margen no es válido')

    setGuardando(true)
    try {
      for (const p of precios) {
        if (!p.coste_hora) continue
        const coste = parseFloat(p.coste_hora.replace(',', '.'))
        const categoria = p.esCustom ? p.label.trim() : p.categoria
        if (!categoria) continue

        const tbl = supabase.from('precios_mano_obra') as any
        if (p.id) {
          await tbl.update({ coste_hora: coste, categoria }).eq('id', p.id)
        } else {
          await tbl.insert({ empresa_id: empresa!.id, categoria, coste_hora: coste, ubicacion_id: null })
        }
      }

      await (supabase.from('empresas') as any)
        .update({ indirectos_porcentaje: indirectos, margen_porcentaje: margen })
        .eq('id', empresa!.id)

      await cargar()
      Alert.alert('✓ Guardado', 'Configuración actualizada')
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>

  return (
    <>
      <Stack.Screen options={{
        title: 'Precios mano de obra',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.desc}>
          Define el coste por hora de cada categoría de trabajo. El agente IA usará estos precios para calcular presupuestos automáticamente.
        </Text>

        <View style={styles.seccion}>
          <View style={styles.cabeceraTabla}>
            <Text style={[styles.cabeceraTxt, { flex: 1 }]}>Categoría</Text>
            <Text style={styles.cabeceraTxt}>€ / hora</Text>
          </View>

          {precios.map(precio => (
            <View key={precio.categoria} style={styles.fila}>
              {precio.esCustom ? (
                <TextInput
                  value={precio.label}
                  onChangeText={v => setLabel(precio.categoria, v)}
                  placeholder="Nueva categoría"
                  placeholderTextColor={Colors.muted}
                  style={styles.filaCat}
                />
              ) : (
                <Text style={styles.filaCat}>{precio.label}</Text>
              )}
              <Input
                label=""
                value={precio.coste_hora}
                onChangeText={v => setPrecio(precio.categoria, v)}
                keyboardType="decimal-pad"
                placeholder="18.00"
                style={styles.inputPrecio}
              />
              {precio.esCustom && (
                <TouchableOpacity onPress={() => setPrecioAEliminar(precio)} style={styles.btnEliminar}>
                  <Text style={styles.btnEliminarTxt}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.btnAnadir} onPress={añadirCategoria}>
            <Text style={styles.btnAnadirTxt}>+ Añadir categoría</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.nota}>
          Tip: puedes definir precios diferentes por zona geográfica desde la sección de ubicaciones.
        </Text>

        <View style={styles.seccion}>
          <View style={styles.cabeceraTabla}>
            <Text style={[styles.cabeceraTxt, { flex: 1 }]}>Márgenes por defecto</Text>
            <Text style={styles.cabeceraTxt}>%</Text>
          </View>
          <View style={styles.fila}>
            <Text style={styles.filaCat}>Costes indirectos</Text>
            <Input
              label=""
              value={indirectosPct}
              onChangeText={setIndirectosPct}
              keyboardType="decimal-pad"
              placeholder="5"
              style={styles.inputPrecio}
            />
          </View>
          <View style={[styles.fila, { borderBottomWidth: 0 }]}>
            <Text style={styles.filaCat}>Margen de beneficio</Text>
            <Input
              label=""
              value={margenPct}
              onChangeText={setMargenPct}
              keyboardType="decimal-pad"
              placeholder="20"
              style={styles.inputPrecio}
            />
          </View>
        </View>

        <Text style={styles.nota}>
          El agente IA aplicará estos porcentajes al generar presupuestos automáticamente.
        </Text>

        <Button label="Guardar" onPress={handleGuardar} loading={guardando} />
      </ScrollView>

      <ConfirmModal
        visible={!!precioAEliminar}
        titulo="Eliminar categoría"
        mensaje={`¿Eliminar "${precioAEliminar?.label || 'esta categoría'}"? Esta acción no se puede deshacer.`}
        labelConfirmar="Eliminar"
        peligroso
        onConfirmar={confirmarEliminar}
        onCancelar={() => setPrecioAEliminar(null)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  desc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  seccion: { backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cabeceraTabla: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cabeceraTxt: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  fila: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 8 },
  filaCat: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  inputPrecio: { width: 90, textAlign: 'right' },
  btnEliminar: { padding: 6 },
  btnEliminarTxt: { fontSize: 14, color: Colors.error, fontWeight: '700' },
  btnAnadir: { paddingVertical: 14, paddingHorizontal: 14, alignItems: 'center' },
  btnAnadirTxt: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  nota: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
})
