// Tipos generados de Supabase — se actualizarán con `npx supabase gen types`
// Por ahora definimos los tipos core del proyecto

export type EstadoPresupuesto = 'borrador' | 'enviado' | 'aceptado' | 'rechazado'
export type EstadoFactura = 'borrador' | 'emitida' | 'pagada' | 'vencida'
export type TipoCliente = 'particular' | 'empresa'

export interface Empresa {
  id: string
  razon_social: string
  nif: string
  direccion: string
  telefono: string
  email: string
  web?: string
  logo_url?: string
  iban?: string
  indirectos_porcentaje?: number
  margen_porcentaje?: number
  created_at: string
}

export interface Cliente {
  id: string
  empresa_id: string
  nombre: string
  nif?: string
  direccion?: string
  telefono?: string
  email?: string
  tipo: TipoCliente
  created_at: string
}

export interface SerieNumerica {
  id: string
  empresa_id: string
  tipo: 'presupuesto' | 'factura'
  prefijo: string
  año_automatico: boolean
  digitos: number
  ultimo_numero: number
}

export interface TipoIva {
  id: string
  empresa_id: string
  nombre: string
  porcentaje: number
  por_defecto: boolean
}

export interface Pais {
  codigo: string
  nombre: string
}

export interface Provincia {
  codigo_pais: string
  codigo: string
  nombre: string
}

export interface Zona {
  codigo_pais: string
  codigo_provincia: string
  codigo: string
  nombre: string
}

export interface Ubicacion {
  id: string
  municipio?: string
  codigo_pais?: string
  codigo_provincia?: string
  codigo_zona?: string
}

export interface Proveedor {
  id: string
  empresa_id: string
  nombre: string
  nif?: string
  telefono?: string
  email?: string
  web?: string
  categorias: string[]
}

export interface Material {
  id: string
  empresa_id: string
  codigo: string
  descripcion: string
  categoria: string
  unidad: string
  proveedor_id?: string
}

export interface PrecioMaterial {
  id: string
  material_id: string
  proveedor_id: string
  ubicacion_id?: string
  precio_coste: number
  margen_porcentaje: number
}

export interface Presupuesto {
  id: string
  empresa_id: string
  cliente_id: string
  numero: string
  fecha: string
  estado: EstadoPresupuesto
  notas?: string
  lineas?: LineaPresupuesto[]
}

export interface LineaPresupuesto {
  id: string
  presupuesto_id: string
  descripcion: string
  unidad: string
  cantidad: number
  precio_unitario: number
  iva_porcentaje: number
  horas_mano_obra?: number | null
  coste_hora?: number | null
  materiales_coste?: number | null
  indirectos_porcentaje?: number | null
  margen_porcentaje?: number | null
  orden: number
}

export interface Factura {
  id: string
  empresa_id: string
  cliente_id: string
  presupuesto_id?: string
  numero: string
  fecha: string
  fecha_vencimiento?: string
  estado: EstadoFactura
  lineas?: LineaFactura[]
}

export interface LineaFactura {
  id: string
  factura_id: string
  descripcion: string
  unidad: string
  cantidad: number
  precio_unitario: number
  iva_porcentaje: number
  horas_mano_obra?: number | null
  coste_hora?: number | null
  materiales_coste?: number | null
  indirectos_porcentaje?: number | null
  margen_porcentaje?: number | null
  orden: number
}

// Placeholder hasta generar tipos reales con supabase CLI
export interface Database {
  public: {
    Tables: {
      empresas: { Row: Empresa; Insert: Omit<Empresa, 'id' | 'created_at'>; Update: Partial<Empresa> }
      clientes: { Row: Cliente; Insert: Omit<Cliente, 'id' | 'created_at'>; Update: Partial<Cliente> }
      presupuestos: { Row: Presupuesto; Insert: Omit<Presupuesto, 'id'>; Update: Partial<Presupuesto> }
      facturas: { Row: Factura; Insert: Omit<Factura, 'id'>; Update: Partial<Factura> }
    }
  }
}
