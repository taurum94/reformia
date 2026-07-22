import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'

interface Props {
  visible: boolean
  titulo: string
  mensaje?: string
  labelConfirmar?: string
  peligroso?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmModal({ visible, titulo, mensaje, labelConfirmar = 'Confirmar', peligroso = false, onConfirmar, onCancelar }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancelar}>
        <TouchableOpacity style={styles.caja} activeOpacity={1} onPress={() => {}}>
          <Text style={styles.titulo}>{titulo}</Text>
          {mensaje && <Text style={styles.mensaje}>{mensaje}</Text>}
          <View style={styles.botones}>
            <TouchableOpacity style={styles.btnCancelar} onPress={onCancelar}>
              <Text style={styles.btnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnConfirmar, peligroso && styles.btnPeligroso]}
              onPress={onConfirmar}
            >
              <Text style={styles.btnConfirmarTexto}>{labelConfirmar}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  caja: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 24, width: '100%', maxWidth: 360, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
  titulo: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  mensaje: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  botones: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnCancelar: {
    flex: 1, paddingVertical: 13, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  btnCancelarTexto: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  btnConfirmar: {
    flex: 1, paddingVertical: 13, borderRadius: 10,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  btnPeligroso: { backgroundColor: Colors.error },
  btnConfirmarTexto: { fontSize: 15, fontWeight: '700', color: '#fff' },
})
