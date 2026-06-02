import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Factura, LineaFactura } from '../types/database'

export type FacturaConCliente = Factura & { cliente_nombre?: string }

export function useFacturas(empresaId: string | undefined) {
  const [facturas, setFacturas] = useState<FacturaConCliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    cargar()
  }, [empresaId])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('facturas')
      .select('*, clientes(nombre)')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })

    setFacturas(
      (data ?? []).map((f: any) => ({
        ...f,
        cliente_nombre: f.clientes?.nombre,
      }))
    )
    setLoading(false)
  }

  async function crear(campos: Partial<Factura>): Promise<Factura> {
    const { data, error } = await supabase
      .from('facturas')
      .insert({ ...campos, empresa_id: empresaId })
      .select()
      .single()
    if (error) throw error
    await cargar()
    return data
  }

  async function actualizar(id: string, campos: Partial<Factura>) {
    const { error } = await supabase.from('facturas').update(campos).eq('id', id)
    if (error) throw error
    await cargar()
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from('facturas').delete().eq('id', id)
    if (error) throw error
    setFacturas(f => f.filter(x => x.id !== id))
  }

  return { facturas, loading, crear, actualizar, eliminar, recargar: cargar }
}

export function useLineasFactura(facturaId: string | undefined) {
  const [lineas, setLineas] = useState<LineaFactura[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!facturaId) return
    cargar()
  }, [facturaId])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('lineas_factura')
      .select('*')
      .eq('factura_id', facturaId)
      .order('orden')
    setLineas(data ?? [])
    setLoading(false)
  }

  async function crearLinea(campos: Omit<LineaFactura, 'id'>) {
    const { error } = await supabase.from('lineas_factura').insert(campos)
    if (error) throw error
    await cargar()
  }

  async function actualizarLinea(id: string, campos: Partial<LineaFactura>) {
    const { error } = await supabase.from('lineas_factura').update(campos).eq('id', id)
    if (error) throw error
    await cargar()
  }

  async function eliminarLinea(id: string) {
    const { error } = await supabase.from('lineas_factura').delete().eq('id', id)
    if (error) throw error
    await cargar()
  }

  return { lineas, loading, recargar: cargar, crearLinea, actualizarLinea, eliminarLinea }
}
