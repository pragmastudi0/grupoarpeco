-- ============================================================================
-- Etapa 1 · Base segura — RPC administrativas de roles y activación (B05)
-- Fuente: docs/04_ROLES_PERMISOS.md (patrón "mutaciones complejas sólo por RPC").
--
-- Reglas:
--  * Sólo Dirección activa y autenticada ejecuta estas funciones.
--  * Autopromoción rechazada: nadie se modifica a sí mismo.
--  * Roles de alto privilegio (direction, support) exigen segunda aprobación
--    humana distinta (doble control, D03 — TODO: flujo de aprobación completo).
--  * Todo cambio queda auditado en audit_events.
-- ============================================================================

create or replace function public.grant_role(
  p_target          uuid,
  p_role            text,
  p_reason          text,
  p_second_approver uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_high   boolean := p_role in ('direction', 'support');
begin
  if not public.is_direction() then
    raise exception 'no autorizado: requiere rol Dirección activo';
  end if;

  if p_target is null or not exists (select 1 from public.profiles where id = p_target) then
    raise exception 'destino inexistente';
  end if;

  if not exists (select 1 from public.roles where code = p_role) then
    raise exception 'rol inexistente: %', p_role;
  end if;

  -- Autopromoción rechazada.
  if p_target = v_caller then
    raise exception 'no se permite modificar los roles propios';
  end if;

  -- Doble control para alto privilegio (D03).
  if v_high then
    if p_second_approver is null or p_second_approver = v_caller then
      raise exception 'rol de alto privilegio: requiere segunda aprobación de otra Dirección';
    end if;
    if not exists (
      select 1 from public.profiles p
      join public.user_roles ur on ur.user_id = p.id
      where p.id = p_second_approver and p.active and ur.role_code = 'direction'
    ) then
      raise exception 'segundo aprobador inválido: debe ser Dirección activa';
    end if;
  end if;

  insert into public.user_roles (user_id, role_code, granted_by)
  values (p_target, p_role, v_caller)
  on conflict (user_id, role_code) do nothing;

  perform public.log_audit(
    'user_roles', p_target, 'grant_role',
    null,
    jsonb_build_object('role', p_role, 'second_approver', p_second_approver),
    p_reason
  );
end;
$$;

create or replace function public.revoke_role(
  p_target uuid,
  p_role   text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
begin
  if not public.is_direction() then
    raise exception 'no autorizado: requiere rol Dirección activo';
  end if;

  if p_target = v_caller then
    raise exception 'no se permite modificar los roles propios';
  end if;

  delete from public.user_roles where user_id = p_target and role_code = p_role;

  perform public.log_audit(
    'user_roles', p_target, 'revoke_role',
    jsonb_build_object('role', p_role), null, p_reason
  );
end;
$$;

create or replace function public.set_user_active(
  p_target uuid,
  p_active boolean,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_before boolean;
begin
  if not public.is_direction() then
    raise exception 'no autorizado: requiere rol Dirección activo';
  end if;

  -- No autodesactivarse (evita bloqueo accidental de la propia cuenta).
  if p_target = v_caller then
    raise exception 'no se permite cambiar el estado activo propio';
  end if;

  select active into v_before from public.profiles where id = p_target;
  if not found then
    raise exception 'destino inexistente';
  end if;

  -- Habilita el cambio de columna protegida por la guardia de profiles.
  perform set_config('app.admin_action', 'on', true);
  update public.profiles
    set active = p_active,
        activated_at = case when p_active and activated_at is null then now() else activated_at end
  where id = p_target;
  perform set_config('app.admin_action', 'off', true);

  perform public.log_audit(
    'profiles', p_target, 'set_user_active',
    jsonb_build_object('active', v_before),
    jsonb_build_object('active', p_active),
    p_reason
  );
end;
$$;

-- Sólo usuarios autenticados pueden invocar; anon/public denegado.
-- La validación de rol Dirección ocurre dentro de cada función.
revoke execute on function public.grant_role(uuid, text, text, uuid)  from public, anon;
revoke execute on function public.revoke_role(uuid, text, text)        from public, anon;
revoke execute on function public.set_user_active(uuid, boolean, text) from public, anon;

grant execute on function public.grant_role(uuid, text, text, uuid)  to authenticated;
grant execute on function public.revoke_role(uuid, text, text)        to authenticated;
grant execute on function public.set_user_active(uuid, boolean, text) to authenticated;

-- NOTA(Etapa 2): reassign_owner (reasignación de cartera/proyectos al dar de
-- baja un usuario) se implementa junto a las tablas comerciales (clients,
-- opportunities, projects), que aún no existen. Ver docs/06_BACKLOG.md B05/C04.
