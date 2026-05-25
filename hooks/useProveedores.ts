import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Proveedor } from '../types/database'

export function useProveedores(empresaId: string | undefined) {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    cargar()
  }, [empresaId])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('proveedores')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nombre')
    setProveedores(data ?? [])
    setLoading(false)
  }

  async function crear(campos: Omit<Proveedor, 'id' | 'empresa_id'>) {
    const { data, error } = await supabase
      .from('proveedores')
      .insert({ ...campos, empresa_id: empresaId })
      .select()
      .single()
    if (error) throw error
    setProveedores(p => [...p, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    return data
  }

  async function actualizar(id: string, campos: Partial<Proveedor>) {
    const { data, error } = await supabase
      .from('proveedores')
      .update(campos)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setProveedores(p => p.map(x => x.id === id ? data : x))
    return data
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from('proveedores').delete().eq('id', id)
    if (error) throw error
    setProveedores(p => p.filter(x => x.id !== id))
  }

  return { proveedores, loading, crear, actualizar, eliminar, recargar: cargar }
}
