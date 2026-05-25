import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { Stack } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useEmpresa } from '../../hooks/useEmpresa'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Colors } from '../../constants/colors'

const CATEGORIAS = [
  { id: 'albanileria', label: 'Albañilería' },
  { id: 'electricidad', label: 'Electricidad' },
  { id: 'fontaneria', label: 'Fontanería' },
  { id: 'carpinteria', label: 'Carpintería' },
  { id: 'pintura', label: 'Pintura' },
  { id: 'solados', label: 'Solados y alicatados' },
  { id: 'yeso', label: 'Yeso y escayola' },
]

type PrecioMO = { id?: string; categoria: string; coste_hora: string }

export default function PreciosScreen() {
  const { empresa } = useEmpresa()
  const [precios, setPrecios] = useState<PrecioMO[]>(
    CATEGORIAS.map(c => ({ categoria: c.id, coste_hora: '' }))
  )
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!empresa?.id) return
    cargar()
  }, [empresa?.id])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('precios_mano_obra')
      .select('*')
      .eq('empresa_id', empresa!.id)
      .is('ubicacion_id', null)

    setPrecios(CATEGORIAS.map(c => {
      const existente = data?.find(d => d.categoria === c.id)
      return { id: existente?.id, categoria: c.id, coste_hora: existente ? String(existente.coste_hora) : '' }
    }))
    setLoading(false)
  }

  function setPrecio(categoria: string, valor: string) {
    setPrecios(p => p.map(x => x.categoria === categoria ? { ...x, coste_hora: valor } : x))
  }

  async function handleGuardar() {
    const invalidos = precios.filter(p => p.coste_hora && isNaN(parseFloat(p.coste_hora.replace(',', '.'))))
    if (invalidos.length > 0) return Alert.alert('Error', 'Algunos precios no son válidos')

    setGuardando(true)
    try {
      for (const p of precios) {
        if (!p.coste_hora) continue
        const coste = parseFloat(p.coste_hora.replace(',', '.'))
        if (p.id) {
          await supabase.from('precios_mano_obra').update({ coste_hora: coste }).eq('id', p.id)
        } else {
          await supabase.from('precios_mano_obra').insert({ empresa_id: empresa!.id, categoria: p.categoria, coste_hora: coste, ubicacion_id: null })
        }
      }
      await cargar()
      Alert.alert('✓ Guardado', 'Precios de mano de obra actualizados')
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
          {CATEGORIAS.map(c => {
            const precio = precios.find(p => p.categoria === c.id)
            return (
              <View key={c.id} style={styles.fila}>
                <Text style={styles.filaCat}>{c.label}</Text>
                <Input
                  label=""
                  value={precio?.coste_hora ?? ''}
                  onChangeText={v => setPrecio(c.id, v)}
                  keyboardType="decimal-pad"
                  placeholder="18.00"
                  style={styles.inputPrecio}
                />
              </View>
            )
          })}
        </View>

        <Text style={styles.nota}>
          Tip: puedes definir precios diferentes por zona geográfica desde la sección de ubicaciones.
        </Text>

        <Button label="Guardar precios" onPress={handleGuardar} loading={guardando} />
      </ScrollView>
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
  fila: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  filaCat: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  inputPrecio: { width: 90, textAlign: 'right' },
  nota: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
})
