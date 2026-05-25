import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { SerieNumerica } from '../types/database'

export function useSeries(empresaId: string | undefined) {
  const [series, setSeries] = useState<SerieNumerica[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    cargar()
  }, [empresaId])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('series_numericas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('tipo')
    setSeries(data ?? [])
    setLoading(false)
  }

  async function guardar(serie: Omit<SerieNumerica, 'id'>) {
    const existente = series.find(s => s.tipo === serie.tipo)
    if (existente) {
      const { data, error } = await supabase
        .from('series_numericas')
        .update(serie)
        .eq('id', existente.id)
        .select()
        .single()
      if (error) throw error
      setSeries(s => s.map(x => x.id === existente.id ? data : x))
    } else {
      const { data, error } = await supabase
        .from('series_numericas')
        .insert(serie)
        .select()
        .single()
      if (error) throw error
      setSeries(s => [...s, data])
    }
  }

  return { series, loading, guardar, recargar: cargar }
}
