import { useState, useEffect } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Colors } from '../../constants/colors'
import { useClientes } from '../../hooks/useClientes'
import type { Cliente } from '../../types/database'

interface Props {
  visible: boolean
  onClose: () => void
  onSeleccionar: (cliente: Cliente) => void
  empresaId: string | undefined
}

export function ClientePickerModal({ visible, onClose, onSeleccionar, empresaId }: Props) {
  const { clientes, loading } = useClientes(empresaId)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    if (visible) setBusqueda('')
  }, [visible])

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.nif ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.titulo}>Seleccionar cliente</Text>
            <TouchableOpacity onPress={onClose} style={styles.btnCerrar}>
              <Text style={styles.btnCerrarTexto}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buscadorWrap}>
            <TextInput
              style={styles.buscador}
              placeholder="Buscar por nombre o NIF..."
              placeholderTextColor={Colors.muted}
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
          ) : filtrados.length === 0 ? (
            <Text style={styles.vacio}>{busqueda ? 'Sin resultados' : 'No hay clientes'}</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled">
              {filtrados.map((c, i) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.fila, i < filtrados.length - 1 && styles.filaBorde]}
                  onPress={() => { onSeleccionar(c); onClose() }}
                >
                  <View style={styles.filaInfo}>
                    <Text style={styles.filaNombre}>{c.nombre}</Text>
                    {c.nif && <Text style={styles.filaNif}>{c.nif}</Text>}
                  </View>
                  <Text style={styles.filaArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '75%', paddingBottom: 24,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  titulo: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  btnCerrar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  btnCerrarTexto: { fontSize: 14, color: Colors.textSecondary, fontWeight: '700' },
  buscadorWrap: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  buscador: {
    backgroundColor: Colors.surface, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  vacio: { textAlign: 'center', color: Colors.textSecondary, padding: 24, fontSize: 14 },
  lista: { paddingHorizontal: 16, paddingTop: 4 },
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 8 },
  filaBorde: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  filaInfo: { flex: 1, gap: 2 },
  filaNombre: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  filaNif: { fontSize: 12, color: Colors.textSecondary },
  filaArrow: { fontSize: 22, color: Colors.muted },
})
