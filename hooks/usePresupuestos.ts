import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Presupuesto, LineaPresupuesto } from '../types/database'

export type PresupuestoConCliente = Presupuesto & { cliente_nombre?: string }

export function usePresupuestos(empresaId: string | undefined) {
  const [presupuestos, setPresupuestos] = useState<PresupuestoConCliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    cargar()
  }, [empresaId])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('presupuestos')
      .select('*, clientes(nombre)')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })

    setPresupuestos(
      (data ?? []).map((p: any) => ({
        ...p,
        cliente_nombre: p.clientes?.nombre,
      }))
    )
    setLoading(false)
  }

  async function crear(campos: Partial<Presupuesto>): Promise<Presupuesto> {
    const { data, error } = await supabase
      .from('presupuestos')
      .insert({ ...campos, empresa_id: empresaId })
      .select()
      .single()
    if (error) throw error
    await cargar()
    return data
  }

  async function actualizar(id: string, campos: Partial<Presupuesto>) {
    const { error } = await supabase.from('presupuestos').update(campos).eq('id', id)
    if (error) throw error
    await cargar()
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from('presupuestos').delete().eq('id', id)
    if (error) throw error
    setPresupuestos(p => p.filter(x => x.id !== id))
  }

  return { presupuestos, loading, crear, actualizar, eliminar, recargar: cargar }
}

export function useLineasPresupuesto(presupuestoId: string | undefined) {
  const [lineas, setLineas] = useState<LineaPresupuesto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!presupuestoId) return
    cargar()
  }, [presupuestoId])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('lineas_presupuesto')
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .order('orden')
    setLineas(data ?? [])
    setLoading(false)
  }

  async function crearLinea(campos: Omit<LineaPresupuesto, 'id'>) {
    const { error } = await supabase.from('lineas_presupuesto').insert(campos)
    if (error) throw error
    await cargar()
  }

  async function actualizarLinea(id: string, campos: Partial<LineaPresupuesto>) {
    const { error } = await supabase.from('lineas_presupuesto').update(campos).eq('id', id)
    if (error) throw error
    await cargar()
  }

  async function eliminarLinea(id: string) {
    const { error } = await supabase.from('lineas_presupuesto').delete().eq('id', id)
    if (error) throw error
    await cargar()
  }

  return { lineas, loading, recargar: cargar, crearLinea, actualizarLinea, eliminarLinea }
}
