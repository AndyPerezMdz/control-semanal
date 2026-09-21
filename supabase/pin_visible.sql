-- ============================================================================
-- Hacer el PIN visible en /dashboard/equipo (para que Tony no lo olvide)
-- Antes se guardaba con hash de un solo sentido (bcrypt) — imposible de leer
-- de vuelta. Se cambia a cifrado reversible (pgcrypto), suficiente para un
-- PIN interno de trazabilidad, no una contraseña real.
-- Ejecuta esto UNA VEZ en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================================

alter table empleados add column if not exists pin_cifrado bytea;
alter table empleados drop column if exists pin_hash;

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
