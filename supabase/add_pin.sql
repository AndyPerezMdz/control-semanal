-- ============================================================================
-- Agregar PIN de 4 dígitos por ingeniero (trazabilidad de quién registra qué)
-- Ejecuta esto UNA VEZ en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================================

alter table empleados add column if not exists pin_hash text;

-- Solo el admin (autenticado) puede fijar/cambiar un PIN
create or replace function set_empleado_pin(p_id uuid, p_pin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'El PIN debe ser de 4 dígitos.';
  end if;
  update empleados set pin_hash = crypt(p_pin, gen_salt('bf')) where id = p_id;
end;
$$;

-- Cualquiera (público, sin login) puede verificar un PIN al registrar una
-- actividad, pero esta función NUNCA devuelve el hash, solo true/false
create or replace function verify_empleado_pin(p_id uuid, p_pin text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  select pin_hash into v_hash from empleados where id = p_id;
  if v_hash is null then
    return false;
  end if;
  return v_hash = crypt(p_pin, v_hash);
end;
$$;

revoke all on function set_empleado_pin(uuid, text) from public;
revoke all on function verify_empleado_pin(uuid, text) from public;
grant execute on function set_empleado_pin(uuid, text) to authenticated;
grant execute on function verify_empleado_pin(uuid, text) to anon, authenticated;
