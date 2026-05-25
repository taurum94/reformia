-- Precios de mano de obra de prueba (mercado español 2026)
-- Se insertan para la primera empresa encontrada en la base de datos
-- Ejecutar en Supabase SQL Editor

insert into precios_mano_obra (empresa_id, categoria, coste_hora, ubicacion_id)
select e.id, v.categoria, v.coste_hora, null
from empresas e
cross join (values
  ('albanileria',   18.00),
  ('electricidad',  22.00),
  ('fontaneria',    20.00),
  ('carpinteria',   20.00),
  ('pintura',       16.00),
  ('solados',       19.00),
  ('yeso',          17.00)
) as v(categoria, coste_hora)
on conflict do nothing;
