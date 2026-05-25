import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet, Switch, Alert, ActivityIndicator,
} from 'react-native'
import { Stack } from 'expo-router'
import { useEmpresa } from '../../hooks/useEmpresa'
import { useSeries } from '../../hooks/useSeries'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Colors } from '../../constants/colors'

type TipoSerie = 'presupuesto' | 'factura'

const DEFAULTS = {
  presupuesto: { prefijo: 'PRES', año_automatico: true, digitos: 4 },
  factura: { prefijo: 'FAC', año_automatico: true, digitos: 4 },
}

function preview(prefijo: string, año: boolean, digitos: number) {
  const num = '1'.padStart(digitos, '0')
  return año
    ? `${prefijo}-${new Date().getFullYear()}-${num}`
    : `${prefijo}-${num}`
}

function SerieForm({
  tipo, empresaId, serie,
  onGuardado,
}: {
  tipo: TipoSerie
  empresaId: string
  serie: any
  onGuardado: () => void
}) {
  const { guardar } = useSeries(empresaId)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    prefijo: serie?.prefijo ?? DEFAULTS[tipo].prefijo,
    año_automatico: serie?.año_automatico ?? DEFAULTS[tipo].año_automatico,
    digitos: String(serie?.digitos ?? DEFAULTS[tipo].digitos),
  })

  useEffect(() => {
    if (serie) {
      setForm({
        prefijo: serie.prefijo,
        año_automatico: serie.año_automatico,
        digitos: String(serie.digitos),
      })
    }
  }, [serie])

  async function handleGuardar() {
    const digitos = parseInt(form.digitos)
    if (!form.prefijo) return Alert.alert('Error', 'El prefijo no puede estar vacío')
    if (isNaN(digitos) || digitos < 1 || digitos > 8) return Alert.alert('Error', 'Los dígitos deben ser entre 1 y 8')

    setGuardando(true)
    try {
      await guardar({
        empresa_id: empresaId,
        tipo,
        prefijo: form.prefijo.toUpperCase(),
        año_automatico: form.año_automatico,
        digitos,
        ultimo_numero: serie?.ultimo_numero ?? 0,
      })
      Alert.alert('✓ Guardado', `Serie de ${tipo === 'presupuesto' ? 'presupuestos' : 'facturas'} actualizada`)
      onGuardado()
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setGuardando(false)
    }
  }

  const etiqueta = tipo === 'presupuesto' ? 'Presupuestos' : 'Facturas'

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>{etiqueta}</Text>

      <View style={styles.preview}>
        <Text style={styles.previewLabel}>Vista previa</Text>
        <Text style={styles.previewNum}>
          {preview(form.prefijo || '???', form.año_automatico, parseInt(form.digitos) || 4)}
        </Text>
      </View>

      <Input
        label="Prefijo"
        value={form.prefijo}
        onChangeText={v => setForm(f => ({ ...f, prefijo: v }))}
        placeholder="PRES"
        autoCapitalize="characters"
        style={{ textTransform: 'uppercase' }}
      />

      <Input
        label="Número de dígitos"
        value={form.digitos}
        onChangeText={v => setForm(f => ({ ...f, digitos: v }))}
        keyboardType="numeric"
        placeholder="4"
      />

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>Incluir año automático</Text>
          <Text style={styles.switchDesc}>Ej: PRES-2026-0001</Text>
        </View>
        <Switch
          value={form.año_automatico}
          onValueChange={v => setForm(f => ({ ...f, año_automatico: v }))}
          trackColor={{ true: Colors.accent }}
          thumbColor="#fff"
        />
      </View>

      <Button label="Guardar serie" onPress={handleGuardar} loading={guardando} />
    </View>
  )
}

export default function SeriesScreen() {
  const { empresa, loading } = useEmpresa()
  const { series, recargar } = useSeries(empresa?.id)

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    )
  }

  if (!empresa) {
    return (
      <View style={styles.center}>
        <Text style={styles.aviso}>Primero configura los datos de tu empresa en Ajustes</Text>
      </View>
    )
  }

  const seriePresupuesto = series.find(s => s.tipo === 'presupuesto')
  const serieFactura = series.find(s => s.tipo === 'factura')

  return (
    <>
      <Stack.Screen options={{ title: 'Series numéricas', headerShown: true, headerStyle: { backgroundColor: Colors.primary }, headerTintColor: '#fff' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.desc}>
          Las series garantizan una numeración correlativa e irrompible conforme a normativa fiscal.
        </Text>
        <SerieForm tipo="presupuesto" empresaId={empresa.id} serie={seriePresupuesto} onGuardado={recargar} />
        <SerieForm tipo="factura" empresaId={empresa.id} serie={serieFactura} onGuardado={recargar} />
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  aviso: { color: Colors.textSecondary, textAlign: 'center', fontSize: 15 },
  desc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  preview: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  previewLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 },
  previewNum: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  switchDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
})
