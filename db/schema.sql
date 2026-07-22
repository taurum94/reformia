-- ============================================================
-- Reformia — Esquema de base de datos (Supabase / PostgreSQL)
-- ============================================================

-- ── Empresa ─────────────────────────────────────────────────
create table empresas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  razon_social text not null,
  nif text,
  direccion text,
  telefono text,
  email text,
  web text,
  logo_url text,
  iban text,
  indirectos_porcentaje numeric(5,2) default 5,
  margen_porcentaje numeric(5,2) default 20,
  created_at timestamptz default now()
);

-- ── Series numéricas ────────────────────────────────────────
create table series_numericas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  tipo text check (tipo in ('presupuesto', 'factura')) not null,
  prefijo text not null default 'PRES',
  año_automatico boolean default true,
  digitos int default 4,
  ultimo_numero int default 0
);

-- ── Tipos de IVA ────────────────────────────────────────────
create table tipos_iva (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  nombre text not null,
  porcentaje numeric(5,2) not null,
  por_defecto boolean default false
);

-- ── Geografía ───────────────────────────────────────────────
-- Catálogo compartido entre empresas (país → provincia → zona).
-- Cualquier usuario autenticado puede leer y mantener este catálogo.
create table paises (
  codigo varchar primary key,
  nombre varchar not null
);

create table provincias (
  codigo_pais varchar not null references paises(codigo) on delete cascade,
  codigo varchar not null,
  nombre varchar not null,
  primary key (codigo_pais, codigo)
);

create table zonas (
  codigo_pais varchar not null,
  codigo_provincia varchar not null,
  codigo varchar not null,
  nombre text not null,
  primary key (codigo_pais, codigo_provincia, codigo),
  foreign key (codigo_pais, codigo_provincia) references provincias(codigo_pais, codigo) on delete cascade
);

-- Combinación país/provincia/zona/municipio, referenciada por los precios
-- de mano de obra y de materiales para diferenciarlos por área geográfica.
create table ubicaciones (
  id uuid primary key default gen_random_uuid(),
  municipio text,
  codigo_pais varchar references paises(codigo),
  codigo_provincia varchar,
  codigo_zona varchar,
  foreign key (codigo_pais, codigo_provincia) references provincias(codigo_pais, codigo),
  foreign key (codigo_pais, codigo_provincia, codigo_zona) references zonas(codigo_pais, codigo_provincia, codigo)
);

-- ── Clientes ────────────────────────────────────────────────
create table clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  nombre text not null,
  nif text,
  direccion text,
  telefono text,
  email text,
  tipo text check (tipo in ('particular', 'empresa')) default 'particular',
  created_at timestamptz default now()
);

-- ── Proveedores ─────────────────────────────────────────────
create table proveedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  nombre text not null,
  nif text,
  telefono text,
  email text,
  web text,
  categorias text[] default '{}'
);

-- ── Materiales ──────────────────────────────────────────────
create table materiales (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  codigo text not null,
  descripcion text not null,
  categoria text not null,
  unidad text not null default 'ud',
  proveedor_principal_id uuid references proveedores(id)
);

create table precios_materiales (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references materiales(id) on delete cascade,
  proveedor_id uuid references proveedores(id) on delete cascade,
  ubicacion_id uuid references ubicaciones(id),
  precio_coste numeric(10,2) not null,
  margen_porcentaje numeric(5,2) default 0,
  actualizado_en timestamptz default now()
);

-- ── Precios de mano de obra por zona ────────────────────────
create table precios_mano_obra (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  ubicacion_id uuid references ubicaciones(id),
  categoria text not null,
  coste_hora numeric(10,2) not null
);

-- ── Presupuestos ────────────────────────────────────────────
create table presupuestos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  cliente_id uuid references clientes(id),
  numero text not null,
  fecha date not null default current_date,
  estado text check (estado in ('borrador','enviado','aceptado','rechazado')) default 'borrador',
  notas text,
  created_at timestamptz default now()
);

create table lineas_presupuesto (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid references presupuestos(id) on delete cascade,
  descripcion text not null,
  unidad text not null default 'ud',
  cantidad numeric(10,3) not null default 1,
  precio_unitario numeric(10,2) not null,
  iva_porcentaje numeric(5,2) not null default 21,
  -- desglose interno
  horas_mano_obra numeric(10,2),
  coste_hora numeric(10,2),
  materiales_coste numeric(10,2),
  indirectos_porcentaje numeric(5,2) default 0,
  margen_porcentaje numeric(5,2) default 0,
  orden int not null default 0
);

-- ── Facturas ─────────────────────────────────────────────────
create table facturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  cliente_id uuid references clientes(id),
  presupuesto_id uuid references presupuestos(id),
  numero text not null,
  fecha date not null default current_date,
  fecha_vencimiento date,
  estado text check (estado in ('borrador','emitida','pagada','vencida')) default 'borrador',
  created_at timestamptz default now()
);

create table lineas_factura (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid references facturas(id) on delete cascade,
  descripcion text not null,
  unidad text not null default 'ud',
  cantidad numeric(10,3) not null default 1,
  precio_unitario numeric(10,2) not null,
  iva_porcentaje numeric(5,2) not null default 21,
  -- desglose interno
  horas_mano_obra numeric(10,2),
  coste_hora numeric(10,2),
  materiales_coste numeric(10,2),
  indirectos_porcentaje numeric(5,2) default 0,
  margen_porcentaje numeric(5,2) default 0,
  orden int not null default 0
);

-- ── RLS (Row Level Security) ─────────────────────────────────
-- Activada en todas las tablas.
alter table empresas enable row level security;
alter table series_numericas enable row level security;
alter table tipos_iva enable row level security;
alter table paises enable row level security;
alter table provincias enable row level security;
alter table zonas enable row level security;
alter table ubicaciones enable row level security;
alter table clientes enable row level security;
alter table proveedores enable row level security;
alter table materiales enable row level security;
alter table precios_materiales enable row level security;
alter table precios_mano_obra enable row level security;
alter table presupuestos enable row level security;
alter table lineas_presupuesto enable row level security;
alter table facturas enable row level security;
alter table lineas_factura enable row level security;

-- Cada usuario solo ve su empresa y sus datos
create policy "usuarios ven su empresa" on empresas
  for all using (user_id = auth.uid());

create policy "usuarios ven sus series" on series_numericas
  for all using (empresa_id in (select id from empresas where user_id = auth.uid()));

create policy "usuarios ven sus tipos de iva" on tipos_iva
  for all using (empresa_id in (select id from empresas where user_id = auth.uid()));

create policy "usuarios ven sus clientes" on clientes
  for all using (empresa_id in (select id from empresas where user_id = auth.uid()));

create policy "usuarios ven sus proveedores" on proveedores
  for all using (empresa_id in (select id from empresas where user_id = auth.uid()));

create policy "usuarios ven sus materiales" on materiales
  for all using (empresa_id in (select id from empresas where user_id = auth.uid()));

create policy "usuarios ven sus precios de materiales" on precios_materiales
  for all using (
    material_id in (
      select id from materiales
      where empresa_id in (select id from empresas where user_id = auth.uid())
    )
  );

create policy "usuarios ven sus precios de mano de obra" on precios_mano_obra
  for all using (empresa_id in (select id from empresas where user_id = auth.uid()));

create policy "usuarios ven sus presupuestos" on presupuestos
  for all using (empresa_id in (select id from empresas where user_id = auth.uid()));

create policy "usuarios ven sus lineas de presupuesto" on lineas_presupuesto
  for all using (
    presupuesto_id in (
      select id from presupuestos
      where empresa_id in (select id from empresas where user_id = auth.uid())
    )
  );

create policy "usuarios ven sus facturas" on facturas
  for all using (empresa_id in (select id from empresas where user_id = auth.uid()));

create policy "usuarios ven sus lineas de factura" on lineas_factura
  for all using (
    factura_id in (
      select id from facturas
      where empresa_id in (select id from empresas where user_id = auth.uid())
    )
  );

-- Geografía: catálogo compartido — lectura pública, escritura para cualquier
-- usuario autenticado. NOTA: esto permite que cualquier empresa modifique o
-- borre países/provincias/zonas de otras. Es una permisividad conocida
-- (aceptada como catálogo colaborativo); si se quiere restringir, cambiar
-- las políticas "_modify" para exigir un rol de administrador.
create policy "paises_select" on paises for select using (true);
create policy "paises_modify" on paises for all to authenticated using (true) with check (true);

create policy "provincias_select" on provincias for select using (true);
create policy "provincias_modify" on provincias for all to authenticated using (true) with check (true);

create policy "zonas_select" on zonas for select using (true);
create policy "zonas_modify" on zonas for all to authenticated using (true) with check (true);

create policy "ubicaciones_select" on ubicaciones for select using (true);
create policy "ubicaciones_modify" on ubicaciones for all to authenticated using (true) with check (true);
