import { useState, useRef } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { useEmpresa } from '../../hooks/useEmpresa'
import { consultarAgente, calcularLinea, type LineaGenerada, type RespuestaAgente } from '../../lib/agente'
import { supabase } from '../../lib/supabase'
import type { MensajeChat } from '../../lib/groq'
import { Colors } from '../../constants/colors'

type Mensaje = {
  role: 'user' | 'assistant'
  content: string
  lineas?: LineaGenerada[]
  preciosHora?: Record<string, number>
}

const SUGERENCIAS = [
  'Reforma completa de baño de 6m²: alicatar paredes, plato de ducha, inodoro y lavabo',
  'Pintar piso de 80m²: paredes y techos, dos manos',
  'Instalación eléctrica: cuadro, 8 puntos de luz y 6 enchufes',
  'Solado de salón 30m² con porcelánico 60x60',
]

function BurbujaMensaje({ msg, preciosHora, onGuardar }: {
  msg: Mensaje
  preciosHora: Record<string, number>
  onGuardar: (lineas: LineaGenerada[]) => void
}) {
  const esUsuario = msg.role === 'user'
  const lineasCalculadas = msg.lineas?.map(l =>
    calcularLinea(l, preciosHora[l.categoria_mano_obra] ?? 18)
  ) ?? []
  const total = lineasCalculadas.reduce((s, l) => s + (l.total ?? 0), 0)

  return (
    <View style={[styles.burbuja, esUsuario ? styles.burbujaUsuario : styles.burbujaAgente]}>
      {!esUsuario && <Text style={styles.burbujaLabel}>🤖 Agente Reformia</Text>}
      <Text style={[styles.burbujaTexto, esUsuario && styles.burbujaTextoUsuario]}>
        {msg.content}
      </Text>

      {lineasCalculadas.length > 0 && (
        <View style={styles.presupuesto}>
          <Text style={styles.presupuestoTitulo}>Presupuesto generado</Text>
          {lineasCalculadas.map((l, i) => (
            <View key={i} style={styles.lineaPresup}>
              <View style={styles.lineaPresupTop}>
                <Text style={styles.lineaDesc}>{l.descripcion}</Text>
                <Text style={styles.lineaTotal}>{(l.total ?? 0).toFixed(2)}€</Text>
              </View>
              <Text style={styles.lineaDetalle}>
                {l.cantidad} {l.unidad} · MO: {l.horas_mano_obra}h · Mat: {l.materiales_coste}€ · Margen: {l.margen_porcentaje}%
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total sin IVA</Text>
            <Text style={styles.totalValor}>{total.toFixed(2)}€</Text>
          </View>
          <TouchableOpacity style={styles.btnGuardar} onPress={() => onGuardar(lineasCalculadas)}>
            <Text style={styles.btnGuardarText}>Guardar como presupuesto →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

export default function AgenteScreen() {
  const { empresa } = useEmpresa()
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [historial, setHistorial] = useState<MensajeChat[]>([])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [preciosHora, setPreciosHora] = useState<Record<string, number>>({
    albanileria: 18, electricidad: 22, fontaneria: 20,
    carpinteria: 20, pintura: 16, solados: 19, yeso: 17,
  })
  const scrollRef = useRef<ScrollView>(null)

  async function enviar(texto?: string) {
    const msg = (texto ?? input).trim()
    if (!msg || cargando) return
    if (!empresa?.id) {
      Alert.alert('Configura tu empresa', 'Ve a Ajustes y rellena los datos de tu empresa primero.')
      return
    }

    setInput('')
    const msgUsuario: Mensaje = { role: 'user', content: msg }
    setMensajes(prev => [...prev, msgUsuario])
    setCargando(true)

    try {
      // Cargar precios actuales de Supabase
      const { data: precios } = await supabase
        .from('precios_mano_obra')
        .select('categoria, coste_hora')
        .eq('empresa_id', empresa.id)
        .is('ubicacion_id', null)

      const mapa: Record<string, number> = { ...preciosHora }
      precios?.forEach(p => { mapa[p.categoria] = p.coste_hora })
      setPreciosHora(mapa)

      const respuesta: RespuestaAgente = await consultarAgente(empresa.id, historial, msg)

      const msgAgente: Mensaje = {
        role: 'assistant',
        content: respuesta.mensaje,
        lineas: respuesta.lineas,
      }
      setMensajes(prev => [...prev, msgAgente])
      setHistorial(prev => [
        ...prev,
        { role: 'user', content: msg },
        { role: 'assistant', content: respuesta.mensaje },
      ])
    } catch (e: any) {
      setMensajes(prev => [...prev, {
        role: 'assistant',
        content: `Error al conectar con el agente: ${e.message}`,
      }])
    } finally {
      setCargando(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  async function guardarPresupuesto(lineas: LineaGenerada[]) {
    if (!empresa?.id) return

    Alert.alert('Guardar presupuesto', '¿Quieres guardar este presupuesto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Guardar', onPress: async () => {
          try {
            // Obtener siguiente número de serie
            const { data: serie } = await supabase
              .from('series_numericas')
              .select('*')
              .eq('empresa_id', empresa.id)
              .eq('tipo', 'presupuesto')
              .single()

            const siguiente = (serie?.ultimo_numero ?? 0) + 1
            const año = new Date().getFullYear()
            const digitos = serie?.digitos ?? 4
            const num = String(siguiente).padStart(digitos, '0')
            const numero = serie?.año_automatico
              ? `${serie.prefijo}-${año}-${num}`
              : `${serie?.prefijo ?? 'PRES'}-${num}`

            // Crear presupuesto
            const { data: presupuesto, error } = await supabase
              .from('presupuestos')
              .insert({ empresa_id: empresa.id, numero, fecha: new Date().toISOString().split('T')[0], estado: 'borrador' })
              .select()
              .single()
            if (error) throw error

            // Crear líneas
            const lineasDB = lineas.map((l, i) => ({
              presupuesto_id: presupuesto.id,
              descripcion: l.descripcion,
              unidad: l.unidad,
              cantidad: l.cantidad,
              precio_unitario: Number((l.precio_unitario ?? 0).toFixed(2)),
              iva_porcentaje: l.iva_porcentaje,
              horas_mano_obra: l.horas_mano_obra,
              coste_hora: preciosHora[l.categoria_mano_obra] ?? 18,
              materiales_coste: l.materiales_coste,
              indirectos_porcentaje: l.indirectos_porcentaje,
              margen_porcentaje: l.margen_porcentaje,
              orden: i,
            }))

            await supabase.from('lineas_presupuesto').insert(lineasDB)

            // Actualizar último número de serie
            if (serie) {
              await supabase
                .from('series_numericas')
                .update({ ultimo_numero: siguiente })
                .eq('id', serie.id)
            }

            Alert.alert('✓ Guardado', `Presupuesto ${numero} creado`, [
              { text: 'Ver presupuesto', onPress: () => router.push('/presupuestos') },
              { text: 'Seguir aquí', style: 'cancel' },
            ])
          } catch (e: any) {
            Alert.alert('Error', e.message)
          }
        }
      },
    ])
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Chat */}
      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {mensajes.length === 0 && (
          <View style={styles.bienvenida}>
            <Text style={styles.bienvenidaIcon}>🏗️</Text>
            <Text style={styles.bienvenidaTitulo}>Agente de presupuestos</Text>
            <Text style={styles.bienvenidaDesc}>
              Descríbeme la obra y generaré un presupuesto detallado con precios de tu zona.
            </Text>
            <Text style={styles.bienvenidaLabel}>Ejemplos:</Text>
            {SUGERENCIAS.map((s, i) => (
              <TouchableOpacity key={i} style={styles.sugerencia} onPress={() => enviar(s)}>
                <Text style={styles.sugerenciaTexto}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {mensajes.map((msg, i) => (
          <BurbujaMensaje key={i} msg={msg} preciosHora={preciosHora} onGuardar={guardarPresupuesto} />
        ))}

        {cargando && (
          <View style={[styles.burbuja, styles.burbujaAgente]}>
            <Text style={styles.burbujaLabel}>🤖 Agente Reformia</Text>
            <View style={styles.typing}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.typingTexto}>Calculando presupuesto...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Describe la obra..."
          placeholderTextColor={Colors.muted}
          multiline
          maxLength={500}
          onSubmitEditing={() => enviar()}
        />
        <TouchableOpacity
          style={[styles.btnEnviar, (!input.trim() || cargando) && styles.btnEnviarDisabled]}
          onPress={() => enviar()}
          disabled={!input.trim() || cargando}
        >
          <Text style={styles.btnEnviarIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  chat: { flex: 1 },
  chatContent: { padding: 16, gap: 12, paddingBottom: 8 },
  bienvenida: { alignItems: 'center', paddingTop: 20, paddingBottom: 8, gap: 10 },
  bienvenidaIcon: { fontSize: 48 },
  bienvenidaTitulo: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  bienvenidaDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  bienvenidaLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  sugerencia: { backgroundColor: Colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border, width: '100%' },
  sugerenciaTexto: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  burbuja: { borderRadius: 14, padding: 14, maxWidth: '90%', gap: 6 },
  burbujaUsuario: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  burbujaAgente: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  burbujaLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  burbujaTexto: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  burbujaTextoUsuario: { color: '#fff' },
  presupuesto: { marginTop: 8, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, gap: 8 },
  presupuestoTitulo: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
  lineaPresup: { backgroundColor: Colors.background, borderRadius: 8, padding: 10, gap: 3 },
  lineaPresupTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  lineaDesc: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  lineaTotal: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  lineaDetalle: { fontSize: 11, color: Colors.textSecondary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  totalValor: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  btnGuardar: { backgroundColor: Colors.accent, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  btnGuardarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingTexto: { fontSize: 14, color: Colors.textSecondary },
  inputArea: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, maxHeight: 120 },
  btnEnviar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  btnEnviarDisabled: { backgroundColor: Colors.muted },
  btnEnviarIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
})
