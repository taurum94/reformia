import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { TipoIva } from '../types/database'

export function useIva(empresaId: string | undefined) {
  const [tipos, setTipos] = useState<TipoIva[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    cargar()
  }, [empresaId])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('tipos_iva')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('porcentaje', { ascending: false })
    setTipos(data ?? [])
    setLoading(false)
  }

  async function crear(tipo: Omit<TipoIva, 'id'>) {
    // Si el nuevo es por defecto, quitar el anterior
    if (tipo.por_defecto) await quitarDefecto()
    const { data, error } = await supabase
      .from('tipos_iva')
      .insert(tipo)
      .select()
      .single()
    if (error) throw error
    setTipos(t => [...t, data])
  }

  async function actualizar(id: string, campos: Partial<TipoIva>) {
    if (campos.por_defecto) await quitarDefecto()
    const { data, error } = await supabase
      .from('tipos_iva')
      .update(campos)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setTipos(t => t.map(x => x.id === id ? data : x))
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from('tipos_iva').delete().eq('id', id)
    if (error) throw error
    setTipos(t => t.filter(x => x.id !== id))
  }

  async function quitarDefecto() {
    await supabase
      .from('tipos_iva')
      .update({ por_defecto: false })
      .eq('empresa_id', empresaId)
  }

  async function crearDefaults() {
    const defaults = [
      { empresa_id: empresaId!, nombre: 'IVA General', porcentaje: 21, por_defecto: true },
      { empresa_id: empresaId!, nombre: 'IVA Reducido (rehabilitación)', porcentaje: 10, por_defecto: false },
      { empresa_id: empresaId!, nombre: 'IVA Superreducido', porcentaje: 4, por_defecto: false },
      { empresa_id: empresaId!, nombre: 'Exento', porcentaje: 0, por_defecto: false },
    ]
    const { data, error } = await supabase.from('tipos_iva').insert(defaults).select()
    if (error) throw error
    setTipos(data)
  }

  return { tipos, loading, crear, actualizar, eliminar, crearDefaults, recargar: cargar }
}
