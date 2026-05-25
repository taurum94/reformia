import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal,
} from 'react-native'
import { Stack } from 'expo-router'
import { useEmpresa } from '../../hooks/useEmpresa'
import { useIva } from '../../hooks/useIva'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Colors } from '../../constants/colors'

function ModalIva({
  visible, onClose, onGuardar,
}: {
  visible: boolean
  onClose: () => void
  onGuardar: (nombre: string, porcentaje: number, porDefecto: boolean) => void
}) {
  const [nombre, setNombre] = useState('')
  const [porcentaje, setPorcentaje] = useState('')
  const [porDefecto, setPorDefecto] = useState(false)

  function limpiar() { setNombre(''); setPorcentaje(''); setPorDefecto(false) }

  function handleGuardar() {
    const pct = parseFloat(porcentaje.replace(',', '.'))
    if (!nombre) return Alert.alert('Error', 'Introduce un nombre')
    if (isNaN(pct) || pct < 0 || pct > 100) return Alert.alert('Error', 'Porcentaje no válido (0-100)')
    onGuardar(nombre, pct, porDefecto)
    limpiar()
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitulo}>Nuevo tipo de IVA</Text>
          <Input label="Nombre" value={nombre} onChangeText={setNombre} placeholder="IVA General" />
          <Input
            label="Porcentaje (%)"
            value={porcentaje}
            onChangeText={setPorcentaje}
            keyboardType="decimal-pad"
            placeholder="21"
          />
          <TouchableOpacity style={styles.checkRow} onPress={() => setPorDefecto(v => !v)}>
            <View style={[styles.checkbox, porDefecto && styles.checkboxOn]}>
              {porDefecto && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>Usar como IVA por defecto</Text>
          </TouchableOpacity>
          <View style={styles.modalBtns}>
            <Button label="Cancelar" onPress={() => { limpiar(); onClose() }} variante="secondary" style={{ flex: 1 }} />
            <Button label="Guardar" onPress={handleGuardar} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default function IvaScreen() {
  const { empresa, loading: loadingEmpresa } = useEmpresa()
  const { tipos, loading, crear, eliminar, actualizar, crearDefaults } = useIva(empresa?.id)
  const [modalVisible, setModalVisible] = useState(false)
  const [guardando, setGuardando] = useState(false)

  async function handleCrearDefaults() {
    setGuardando(true)
    try {
      await crearDefaults()
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function handleGuardar(nombre: string, porcentaje: number, porDefecto: boolean) {
    try {
      await crear({ empresa_id: empresa!.id, nombre, porcentaje, por_defecto: porDefecto })
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  async function handleEliminar(id: string, nombre: string) {
    Alert.alert('Eliminar', `¿Eliminar "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try { await eliminar(id) }
          catch (e: any) { Alert.alert('Error', e.message) }
        },
      },
    ])
  }

  async function handleDefecto(id: string) {
    try { await actualizar(id, { por_defecto: true }) }
    catch (e: any) { Alert.alert('Error', e.message) }
  }

  if (loadingEmpresa || loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Tipos de IVA',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
      }} />

      <ModalIva visible={modalVisible} onClose={() => setModalVisible(false)} onGuardar={handleGuardar} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.desc}>
          Configura los tipos de IVA que usarás en tus presupuestos y facturas. Cada línea puede tener su propio tipo.
        </Text>

        {tipos.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioTitulo}>Sin tipos de IVA</Text>
            <Text style={styles.vacioDesc}>Crea los tipos manualmente o carga los valores estándar de España</Text>
            <Button label="Cargar IVA estándar España" onPress={handleCrearDefaults} loading={guardando} />
          </View>
        ) : (
          <View style={styles.lista}>
            {tipos.map(t => (
              <View key={t.id} style={styles.fila}>
                <View style={styles.filaIzq}>
                  <Text style={styles.filaNombre}>{t.nombre}</Text>
                  <View style={styles.tags}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{t.porcentaje}%</Text>
                    </View>
                    {t.por_defecto && (
                      <View style={[styles.tag, styles.tagDefecto]}>
                        <Text style={[styles.tagText, { color: Colors.accent }]}>Por defecto</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.filaBtns}>
                  {!t.por_defecto && (
                    <TouchableOpacity onPress={() => handleDefecto(t.id)}>
                      <Text style={styles.btnAccion}>⭐</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleEliminar(t.id, t.nombre)}>
                    <Text style={[styles.btnAccion, { color: Colors.error }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <Button label="+ Añadir tipo de IVA" onPress={() => setModalVisible(true)} variante="secondary" />
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  desc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  vacio: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  vacioTitulo: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  vacioDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  lista: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filaIzq: { flex: 1, gap: 6 },
  filaNombre: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  tags: { flexDirection: 'row', gap: 6 },
  tag: {
    backgroundColor: Colors.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagDefecto: { borderColor: Colors.accent },
  tagText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filaBtns: { flexDirection: 'row', gap: 12 },
  btnAccion: { fontSize: 18, color: Colors.textSecondary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 14,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  checkLabel: { fontSize: 14, color: Colors.textPrimary },
  modalBtns: { flexDirection: 'row', gap: 12 },
})
