-- ============================================================================
-- Control Semanal de Actividades — esquema inicial (Supabase / Postgres)
-- ============================================================================
-- Ejecuta esto completo en: Supabase Dashboard → SQL Editor → New query → Run
-- Reemplaza al Excel "ControlSemanalAct": CATALOGO -> categorias,
-- las pestañas por ingeniero -> actividades, DASHBOARD -> vistas/consultas.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- CATALOGO -> categorias
-- ---------------------------------------------------------------------------
create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  peso smallint not null check (peso between 1 and 5),
  evidencia_requerida text,           -- p.ej. "Dashboard_validadores", "InvGate"
  descripcion text,                   -- "Captura del Excel compartido en Teams."
  objetivo text,                      -- "Monitorear y validar eventos..."
  orden smallint not null default 0,  -- para mantener el orden del catálogo original
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Ingenieros -> empleados (el tío los administra desde /dashboard/equipo)
-- ---------------------------------------------------------------------------
create table if not exists empleados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  pin_cifrado bytea,  -- PIN de 4 dígitos (cifrado, reversible); ver funciones set/verify/obtener_pin abajo
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Listas fijas (igual que las columnas G/H/I de CATALOGO en el Excel)
-- ---------------------------------------------------------------------------
create type prioridad_t as enum ('BAJA', 'MEDIA', 'ALTA', 'CRÍTICA');

create type estatus_t as enum (
  'PENDIENTE',
  'EN PROCESO',
  'FINALIZADO',
  'FINALIZADO / RESTABLECIDO',
  'CANCELADO',
  'BLOQUEADO'
);

create type evidencia_t as enum ('SI', 'NO', 'NO APLICA');

-- ---------------------------------------------------------------------------
-- Pestañas por ingeniero + CONSOLIDADO -> una sola tabla: actividades
-- ---------------------------------------------------------------------------
create table if not exists actividades (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references empleados(id) on delete restrict,
  categoria_id uuid references categorias(id) on delete set null,

  fecha date not null default current_date,
  hora_inicio time,
  hora_fin time,

  descripcion text,
  unidad_ticket text,                 -- "UNIDAD / TICKET / LUGAR"
  prioridad prioridad_t not null default 'MEDIA',
  estatus estatus_t not null default 'PENDIENTE',
  evidencia evidencia_t not null default 'NO',
  referencia_folio text,
  comentarios text,                   -- "COMENTARIOS / BLOQUEO"

  -- calculados al insertar/editar (equivalente a J y K en el Excel), guardados
  -- como columna normal (no generated) porque dependen de otra tabla (categorias)
  tiempo_min numeric,
  carga_ponderada numeric,

  creado_en timestamptz not null default now()
);

create index if not exists idx_actividades_empleado on actividades(empleado_id);
create index if not exists idx_actividades_categoria on actividades(categoria_id);
create index if not exists idx_actividades_fecha on actividades(fecha);

-- ---------------------------------------------------------------------------
-- Trigger: calcula tiempo_min y carga_ponderada igual que las fórmulas del
-- Excel -> J: =IF(AND(B<>"",C<>""),MOD(C-B,1)*1440,"")   (soporta cruce de medianoche)
--         K: =IFERROR(J*VLOOKUP(categoria,CATALOGO,peso),"")
-- ---------------------------------------------------------------------------
create or replace function calcular_carga_actividad()
returns trigger as $$
declare
  v_peso smallint;
  v_minutos numeric;
begin
  if new.hora_inicio is not null and new.hora_fin is not null then
    v_minutos := extract(epoch from (new.hora_fin - new.hora_inicio)) / 60;
    if v_minutos < 0 then
      v_minutos := v_minutos + 1440; -- cruzó medianoche, igual que MOD(...,1) en Excel
    end if;
    new.tiempo_min := v_minutos;
  else
    new.tiempo_min := null;
  end if;

  if new.categoria_id is not null then
    select peso into v_peso from categorias where id = new.categoria_id;
  end if;

  if new.tiempo_min is not null and v_peso is not null then
    new.carga_ponderada := new.tiempo_min * v_peso;
  else
    new.carga_ponderada := null;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_calcular_carga on actividades;
create trigger trg_calcular_carga
  before insert or update on actividades
  for each row execute function calcular_carga_actividad();

-- ---------------------------------------------------------------------------
-- PIN de 4 dígitos por ingeniero (trazabilidad de quién registra cada
-- actividad, sin necesidad de cuentas/contraseñas completas)
-- ---------------------------------------------------------------------------
create or replace function set_empleado_pin(p_id uuid, p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'El PIN debe ser de 4 dígitos.';
  end if;
  update empleados
  set pin_cifrado = pgp_sym_encrypt(p_pin, 'control-semanal-pin-2026')
  where id = p_id;
end;
$$;

create or replace function verify_empleado_pin(p_id uuid, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_cifrado bytea;
begin
  select pin_cifrado into v_cifrado from empleados where id = p_id;
  if v_cifrado is null then
    return false;
  end if;
  return pgp_sym_decrypt(v_cifrado, 'control-semanal-pin-2026') = p_pin;
end;
$$;

-- Regresa el PIN en claro de cada empleado — solo para el dashboard admin
create or replace function obtener_pines()
returns table(empleado_id uuid, pin text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select e.id,
         case when e.pin_cifrado is null then null
              else pgp_sym_decrypt(e.pin_cifrado, 'control-semanal-pin-2026')
         end
  from empleados e;
end;
$$;

revoke all on function set_empleado_pin(uuid, text) from public;
revoke all on function verify_empleado_pin(uuid, text) from public;
revoke all on function obtener_pines() from public;
grant execute on function set_empleado_pin(uuid, text) to authenticated;
grant execute on function verify_empleado_pin(uuid, text) to anon, authenticated;
grant execute on function obtener_pines() to authenticated;

-- ---------------------------------------------------------------------------
-- Seguridad (RLS) — replica el modelo acordado:
--   • Los ingenieros NO tienen login: pueden leer catálogo/empleados activos
--     y registrar actividades (insert), pero no ver el consolidado.
--   • El tío sí tiene login (Supabase Auth) y es el único que puede leer el
--     consolidado completo y administrar empleados/catálogo.
-- ---------------------------------------------------------------------------
alter table categorias enable row level security;
alter table empleados enable row level security;
alter table actividades enable row level security;

-- Lectura pública SOLO de lo necesario para llenar el formulario
create policy "categorias_lectura_publica_activas"
  on categorias for select
  using (activo = true);

create policy "empleados_lectura_publica_activos"
  on empleados for select
  using (activo = true);

-- Cualquiera puede registrar una actividad (sin login), pero no leerlas de vuelta
create policy "actividades_insert_publico"
  on actividades for insert
  with check (true);

-- Solo un usuario autenticado (el tío / admin) puede ver el consolidado y
-- administrar catálogo y empleados
create policy "categorias_admin_todo"
  on categorias for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "empleados_admin_todo"
  on empleados for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "actividades_admin_lectura_y_edicion"
  on actividades for select
  using (auth.role() = 'authenticated');

create policy "actividades_admin_update"
  on actividades for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "actividades_admin_delete"
  on actividades for delete
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Datos iniciales: el catálogo real del Excel (12 categorías)
-- ---------------------------------------------------------------------------
insert into categorias (nombre, peso, evidencia_requerida, descripcion, objetivo, orden) values
  ('REVISION DASHBOARD', 1, 'Dashboard_validadores', 'Captura del Excel compartido en Teams.', 'Monitorear y validar eventos de unidades con incidentes.', 1),
  ('REVISION VALIDADORES', 2, 'Evidencias operativas', 'Formulario de validación.', 'Diagnosticar y verificar estado operativo de validadores.', 2),
  ('ATENCION FOLIO', 2, 'InvGate', 'Número de ticket/folio en el registro.', 'Analizar, documentar y resolver folios/tickets.', 3),
  ('REVISION REPORTE MRP 7 a.m', 3, 'Reporte Recaudo', 'Teams / Drive.', 'Validar reporte inicial y detectar diferencias del corte 7:00 AM.', 4),
  ('REVISION REPORTE MRP 12 p.m', 2, 'Reporte Recaudo', 'Teams / Drive.', 'Validar reporte intermedio del corte 12:00 PM.', 5),
  ('REVISION REPORTE MRP 7 5 p.m', 1, 'Reporte Recaudo', 'Teams / Drive.', 'Validar reporte de cierre del corte 5:00 PM.', 6),
  ('ATENCION CAJEROS (GRUPO)', 3, 'Evidencias operativas', 'Formulario de atención.', 'Atender y resolver fallas operativas en cajeros TVM.', 7),
  ('RECEPCION/ENTREGA VALIDADORES VORTEX', 1, 'Movimiento de validadores', 'Formato físico + captura.', 'Controlar recepción y salida de validadores con proveedor.', 8),
  ('REVISION DE UNIDAD/VALIDADOR POR PETICION (GRUPO)', 3, 'Evidencias operativas', 'Formulario de atención.', 'Atender revisiones puntuales solicitadas.', 9),
  ('PRUEBAS AIPA VALIDADORES', 4, 'Reporte AIPA', 'PDF final compartido en Teams.', 'Ejecutar pruebas de software/firmware AIPA.', 10),
  ('APOYO EN CAMPO PRUEBAS', 4, 'Evidencias operativas', 'Formulario de atención.', 'Ejecutar pruebas técnicas de campo.', 11),
  ('APOYO EN CAMPO NOCTURNO', 5, 'Evidencias operativas', 'Formulario de atención.', 'Realizar intervenciones en ventana nocturna.', 12)
on conflict (nombre) do nothing;

-- Datos iniciales: el equipo real del Excel (el tío puede editarlos luego desde /dashboard/equipo)
insert into empleados (nombre) values
  ('DANIEL'), ('CARLOS'), ('ANTONIO'), ('JESUS')
on conflict (nombre) do nothing;
