import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Empresa } from '../types/database'

export function useEmpresa() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') setError(error.message)
    setEmpresa(data ?? null)
    setLoading(false)
  }

  async function guardar(campos: Omit<Empresa, 'id' | 'created_at' | 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay sesión activa')

    if (empresa) {
      const { data, error } = await supabase
        .from('empresas')
        .update(campos)
        .eq('id', empresa.id)
        .select()
        .single()
      if (error) throw error
      setEmpresa(data)
    } else {
      const { data, error } = await supabase
        .from('empresas')
        .insert({ ...campos, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      setEmpresa(data)
    }
  }

  return { empresa, loading, error, guardar, recargar: cargar }
}
