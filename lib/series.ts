import { supabase } from './supabase'

/**
 * Genera el siguiente número correlativo para una serie.
 * Si no existe la serie para esta empresa, la crea con valores por defecto.
 * Devuelve el número formateado (ej: PRES-2026-0001) y actualiza el contador.
 */
export async function siguienteNumero(
  empresaId: string,
  tipo: 'presupuesto' | 'factura'
): Promise<string> {
  // 1. Buscar serie existente — limit(1) evita fallos con filas duplicadas
  const { data: filas } = await supabase
    .from('series_numericas')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('tipo', tipo)
    .order('ultimo_numero', { ascending: false })
    .limit(1)

  let serie = filas?.[0] ?? null

  // 2. Si no existe, crear una por defecto
  if (!serie) {
    const { data: nueva, error: errInsert } = await supabase
      .from('series_numericas')
      .insert({
        empresa_id: empresaId,
        tipo,
        prefijo: tipo === 'presupuesto' ? 'PRES' : 'FAC',
        año_automatico: true,
        digitos: 4,
        ultimo_numero: 0,
      })
      .select()
      .single()
    if (errInsert) throw errInsert
    serie = nueva
  }

  // 3. Incrementar contador
  const siguiente = (serie.ultimo_numero ?? 0) + 1
  const { error: errUpdate } = await supabase
    .from('series_numericas')
    .update({ ultimo_numero: siguiente })
    .eq('id', serie.id)
  if (errUpdate) throw errUpdate

  // 4. Formatear número
  const num = String(siguiente).padStart(serie.digitos ?? 4, '0')
  const año = new Date().getFullYear()
  return serie.año_automatico !== false
    ? `${serie.prefijo}-${año}-${num}`
    : `${serie.prefijo}-${num}`
}
