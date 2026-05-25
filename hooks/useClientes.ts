import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Cliente } from '../types/database'

export function useClientes(empresaId: string | undefined) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    cargar()
  }, [empresaId])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nombre')
    setClientes(data ?? [])
    setLoading(false)
  }

  async function crear(campos: Omit<Cliente, 'id' | 'created_at' | 'empresa_id'>) {
    const { data, error } = await supabase
      .from('clientes')
      .insert({ ...campos, empresa_id: empresaId })
      .select()
      .single()
    if (error) throw error
    setClientes(c => [...c, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    return data
  }

  async function actualizar(id: string, campos: Partial<Cliente>) {
    const { data, error } = await supabase
      .from('clientes')
      .update(campos)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setClientes(c => c.map(x => x.id === id ? data : x))
    return data
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) throw error
    setClientes(c => c.filter(x => x.id !== id))
  }

  return { clientes, loading, crear, actualizar, eliminar, recargar: cargar }
}
