import { supabase } from './supabase'
import { llamarGroq, type MensajeChat } from './groq'

export interface LineaGenerada {
  descripcion: string
  unidad: string
  cantidad: number
  horas_mano_obra: number
  categoria_mano_obra: string
  materiales_coste: number
  indirectos_porcentaje: number
  margen_porcentaje: number
  iva_porcentaje: number
  // calculados
  coste_mano_obra?: number
  precio_unitario?: number
  total?: number
}

export interface RespuestaAgente {
  mensaje: string
  lineas: LineaGenerada[]
}

interface Contexto {
  preciosStr: string
  materialesStr: string
  indirectosPct: number
  margenPct: number
}

// Obtiene los precios de mano de obra, materiales y márgenes configurados
async function obtenerContexto(empresaId: string): Promise<Contexto> {
  const [{ data: precios }, { data: materiales }, { data: empresa }] = await Promise.all([
    supabase.from('precios_mano_obra').select('categoria, coste_hora').eq('empresa_id', empresaId).is('ubicacion_id', null),
    supabase.from('materiales').select('codigo, descripcion, categoria, unidad').eq('empresa_id', empresaId).limit(50),
    supabase.from('empresas').select('indirectos_porcentaje, margen_porcentaje').eq('id', empresaId).single(),
  ])

  const preciosStr = precios && precios.length > 0
    ? precios.map((p: any) => `  - ${p.categoria}: ${p.coste_hora}€/hora`).join('\n')
    : '  - (sin precios configurados, usa valores típicos del mercado español)'

  const materialesStr = materiales && materiales.length > 0
    ? materiales.map((m: any) => `  - [${m.codigo}] ${m.descripcion} (${m.unidad}) — ${m.categoria}`).join('\n')
    : '  - (sin catálogo configurado, estima costes de materiales típicos)'

  return {
    preciosStr,
    materialesStr,
    indirectosPct: (empresa as any)?.indirectos_porcentaje ?? 5,
    margenPct: (empresa as any)?.margen_porcentaje ?? 20,
  }
}

function buildSystemPrompt(ctx: Contexto): string {
  return `Eres un experto en presupuestos de obras y reformas en España. Tu trabajo es ayudar a profesionales de la construcción a generar presupuestos detallados a partir de descripciones en lenguaje natural.

PRECIOS DE MANO DE OBRA (€/hora):
${ctx.preciosStr}

CATÁLOGO DE MATERIALES:
${ctx.materialesStr}

INSTRUCCIONES:
1. Analiza la obra descrita por el profesional
2. Identifica las partidas de trabajo necesarias
3. Para cada partida calcula: horas de mano de obra, coste de materiales, % indirectos y % margen
4. Usa SIEMPRE los precios de mano de obra proporcionados arriba
5. Estima costes de materiales con precios realistas del mercado español actual
6. Aplica un ${ctx.indirectosPct}% de indirectos y un ${ctx.margenPct}% de margen por defecto salvo que se indique otro
7. Aplica IVA del 21% por defecto (10% en rehabilitación de vivienda habitual)

FORMATO DE RESPUESTA:
Responde SIEMPRE con este formato exacto:

[MENSAJE]
Texto conversacional breve explicando lo que has generado.
[/MENSAJE]

[PRESUPUESTO]
{
  "lineas": [
    {
      "descripcion": "Descripción clara de la partida",
      "unidad": "m²|ud|ml|m³",
      "cantidad": 10,
      "horas_mano_obra": 8,
      "categoria_mano_obra": "albanileria|electricidad|fontaneria|carpinteria|pintura|solados|yeso",
      "materiales_coste": 150.00,
      "indirectos_porcentaje": 5,
      "margen_porcentaje": 20,
      "iva_porcentaje": 21
    }
  ]
}
[/PRESUPUESTO]

IMPORTANTE: El JSON debe ser válido. Incluye siempre ambas secciones [MENSAJE] y [PRESUPUESTO].`
}

// Calcula precio unitario a partir de los componentes
export function calcularLinea(linea: LineaGenerada, precioHora: number): LineaGenerada {
  const coste_mano_obra = linea.horas_mano_obra * precioHora
  const coste_directo = coste_mano_obra + linea.materiales_coste
  const con_indirectos = coste_directo * (1 + linea.indirectos_porcentaje / 100)
  const con_margen = con_indirectos * (1 + linea.margen_porcentaje / 100)
  const precio_unitario = linea.cantidad > 0 ? con_margen / linea.cantidad : con_margen
  const total = precio_unitario * linea.cantidad

  return { ...linea, coste_mano_obra, precio_unitario, total }
}

// Llama al agente con el historial de mensajes y devuelve la respuesta parseada
export async function consultarAgente(
  empresaId: string,
  historial: MensajeChat[],
  mensajeUsuario: string
): Promise<RespuestaAgente> {
  const ctx = await obtenerContexto(empresaId)
  const systemPrompt = buildSystemPrompt(ctx)

  const mensajes: MensajeChat[] = [
    { role: 'system', content: systemPrompt },
    ...historial,
    { role: 'user', content: mensajeUsuario },
  ]

  const respuesta = await llamarGroq(mensajes)

  // Extraer mensaje conversacional
  const regexMensaje = /\[MENSAJE\]([\s\S]*?)\[\/MENSAJE\]/
  const matchMensaje = respuesta.match(regexMensaje)
  const mensaje = matchMensaje ? matchMensaje[1].trim() : respuesta

  // Extraer JSON del presupuesto
  const regexPresupuesto = /\[PRESUPUESTO\]([\s\S]*?)\[\/PRESUPUESTO\]/
  const matchPresupuesto = respuesta.match(regexPresupuesto)
  let lineas: LineaGenerada[] = []

  if (matchPresupuesto) {
    try {
      const json = JSON.parse(matchPresupuesto[1].trim())
      lineas = json.lineas ?? []
    } catch {
      // JSON malformado — el agente a veces falla, se muestra solo el mensaje
    }
  }

  return { mensaje, lineas }
}
