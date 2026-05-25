import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Material } from '../types/database'

export function useMateriales(empresaId: string | undefined) {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    cargar()
  }, [empresaId])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('materiales')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('categoria')
    setMateriales(data ?? [])
    setLoading(false)
  }

  async function crear(campos: Omit<Material, 'id' | 'empresa_id'>) {
    const { data, error } = await supabase
      .from('materiales')
      .insert({ ...campos, empresa_id: empresaId })
      .select()
      .single()
    if (error) throw error
    setMateriales(m => [...m, data])
    return data
  }

  async function actualizar(id: string, campos: Partial<Material>) {
    const { data, error } = await supabase
      .from('materiales')
      .update(campos)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setMateriales(m => m.map(x => x.id === id ? data : x))
    return data
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from('materiales').delete().eq('id', id)
    if (error) throw error
    setMateriales(m => m.filter(x => x.id !== id))
  }

  return { materiales, loading, crear, actualizar, eliminar, recargar: cargar }
}
