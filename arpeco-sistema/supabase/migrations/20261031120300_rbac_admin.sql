-- ============================================================================
-- RBAC · Administración de roles/permisos + anti-escalación + guardrails
-- ============================================================================

-- Auditoría: ahora también la ve quien tenga permiso auditoria.view.
drop policy if exists audit_events_select on public.audit_events;
create policy audit_events_select on public.audit_events for select to authenticated
  using (public.has_permission('auditoria.view') or public.has_support_access());

-- Listado de usuarios y sus roles: propio, Dirección, o permiso usuarios.view
-- (p. ej. Superadministrador). Reemplaza las políticas atadas a is_direction.
drop policy if exists profiles_select_self_or_direction on public.profiles;
create policy profiles_select_self_or_direction on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_direction() or public.has_permission('usuarios.view'));

drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_direction() or public.has_permission('usuarios.view'));

-- ¿Último superadministrador activo? (para proteger contra quedarse sin superadmin)
create or replace function public.is_last_superadmin(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles ur join public.profiles p on p.id = ur.user_id
    where ur.user_id = p_user and ur.role_code = 'superadmin' and p.active
  ) and (
    select count(*) from public.user_roles ur join public.profiles p on p.id = ur.user_id
    where ur.role_code = 'superadmin' and p.active
  ) <= 1;
$$;

-- ─── Gestión de usuarios (gated por permiso) ─────────────────────────────────
create or replace function public.grant_role(
  p_target uuid, p_role text, p_reason text, p_second_approver uuid default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := (select auth.uid()); v_high boolean := p_role in ('direction','support');
begin
  if not public.has_permission('usuarios.manage_roles') then
    raise exception 'sin permiso para gestionar roles'; end if;
  if p_target is null or not exists (select 1 from public.profiles where id = p_target) then
    raise exception 'destino inexistente'; end if;
  if not exists (select 1 from public.roles where code = p_role) then
    raise exception 'rol inexistente: %', p_role; end if;
  if p_target = v_caller then raise exception 'no se permite modificar los roles propios'; end if;
  -- Asignar superadmin requiere ser superadmin (anti-escalación).
  if p_role = 'superadmin' and not public.has_role('superadmin') then
    raise exception 'sólo un superadministrador asigna el rol superadmin'; end if;
  if v_high then
    if p_second_approver is null or p_second_approver = v_caller then
      raise exception 'rol de alto privilegio: requiere segunda aprobación de otra Dirección'; end if;
    if not exists (select 1 from public.profiles p join public.user_roles ur on ur.user_id=p.id
      where p.id = p_second_approver and p.active and ur.role_code = 'direction') then
      raise exception 'segundo aprobador inválido: debe ser Dirección activa'; end if;
  end if;
  insert into public.user_roles (user_id, role_code, granted_by)
  values (p_target, p_role, v_caller) on conflict (user_id, role_code) do nothing;
  perform public.log_audit('user_roles', p_target, 'grant_role', null,
    jsonb_build_object('role', p_role, 'second_approver', p_second_approver), p_reason);
end $$;

create or replace function public.revoke_role(p_target uuid, p_role text, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := (select auth.uid());
begin
  if not public.has_permission('usuarios.manage_roles') then raise exception 'sin permiso'; end if;
  if p_target = v_caller then raise exception 'no se permite modificar los roles propios'; end if;
  if p_role = 'superadmin' and public.is_last_superadmin(p_target) then
    raise exception 'no se puede quitar el rol al último superadministrador activo'; end if;
  delete from public.user_roles where user_id = p_target and role_code = p_role;
  perform public.log_audit('user_roles', p_target, 'revoke_role',
    jsonb_build_object('role', p_role), null, p_reason);
end $$;

create or replace function public.set_user_active(p_target uuid, p_active boolean, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := (select auth.uid()); v_before boolean;
begin
  if not public.has_permission('usuarios.activate') then raise exception 'sin permiso'; end if;
  if p_target = v_caller then raise exception 'no se permite cambiar el estado activo propio'; end if;
  if not p_active and public.is_last_superadmin(p_target) then
    raise exception 'no se puede desactivar al último superadministrador activo'; end if;
  select active into v_before from public.profiles where id = p_target;
  if not found then raise exception 'destino inexistente'; end if;
  perform set_config('app.admin_action', 'on', true);
  update public.profiles set active = p_active,
    activated_at = case when p_active and activated_at is null then now() else activated_at end
  where id = p_target;
  perform set_config('app.admin_action', 'off', true);
  perform public.log_audit('profiles', p_target, 'set_user_active',
    jsonb_build_object('active', v_before), jsonb_build_object('active', p_active), p_reason);
end $$;

-- ─── Gestión de roles ────────────────────────────────────────────────────────
create or replace function public.create_role(p_code text, p_label text, p_description text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('roles.manage') then raise exception 'sin permiso para gestionar roles'; end if;
  if p_code !~ '^[a-z][a-z0-9_]{2,40}$' then raise exception 'código de rol inválido'; end if;
  insert into public.roles (code, label, description, is_system, protected)
  values (p_code, p_label, p_description, false, false);
  perform public.log_audit('roles', null, 'create_role', null,
    jsonb_build_object('code', p_code, 'label', p_label), null);
end $$;

create or replace function public.update_role(p_code text, p_label text, p_description text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('roles.manage') then raise exception 'sin permiso'; end if;
  if exists (select 1 from public.roles where code = p_code and (is_system or protected))
     and not public.has_role('superadmin') then
    raise exception 'los roles de sistema sólo los edita un superadministrador'; end if;
  update public.roles set label = p_label, description = p_description where code = p_code;
  perform public.log_audit('roles', null, 'update_role', null,
    jsonb_build_object('code', p_code, 'label', p_label), null);
end $$;

create or replace function public.delete_role(p_code text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('roles.manage') then raise exception 'sin permiso'; end if;
  if exists (select 1 from public.roles where code = p_code and (is_system or protected)) then
    raise exception 'no se puede eliminar un rol de sistema/protegido'; end if;
  if exists (select 1 from public.user_roles where role_code = p_code) then
    raise exception 'no se puede eliminar un rol con usuarios asignados'; end if;
  delete from public.roles where code = p_code;
  perform public.log_audit('roles', null, 'delete_role', jsonb_build_object('code', p_code), null, null);
end $$;

-- Matriz de permisos de un rol. Anti-escalación: no se puede conceder un permiso
-- que el solicitante no posee (salvo superadmin); reserved requiere superadmin.
create or replace function public.set_role_permissions(p_code text, p_perms text[])
returns void language plpgsql security definer set search_path = '' as $$
declare v_perm text;
begin
  if not public.has_permission('roles.manage') then raise exception 'sin permiso'; end if;
  if exists (select 1 from public.roles where code = p_code and (is_system or protected))
     and not public.has_role('superadmin') then
    raise exception 'la matriz de un rol de sistema sólo la edita un superadministrador'; end if;
  foreach v_perm in array coalesce(p_perms, '{}') loop
    if not exists (select 1 from public.permissions where code = v_perm) then
      raise exception 'permiso inexistente: %', v_perm; end if;
    if not public.has_role('superadmin') then
      if exists (select 1 from public.permissions where code = v_perm and reserved) then
        raise exception 'permiso reservado (sólo superadmin): %', v_perm; end if;
      if not public.has_permission(v_perm) then
        raise exception 'no podés delegar un permiso que no tenés: %', v_perm; end if;
    end if;
  end loop;
  delete from public.role_permissions where role_code = p_code;
  insert into public.role_permissions (role_code, permission_code)
    select p_code, unnest(coalesce(p_perms, '{}'));
  perform public.log_audit('role_permissions', null, 'set_role_permissions',
    null, jsonb_build_object('role', p_code, 'perms', p_perms), null);
end $$;

-- Excepción individual de permiso. reserved no admite excepción; no sobre uno mismo;
-- grant requiere que el solicitante posea el permiso (anti-escalación).
create or replace function public.set_user_permission(p_user uuid, p_perm text, p_effect text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('usuarios.manage_permissions') then raise exception 'sin permiso'; end if;
  if p_user = (select auth.uid()) then raise exception 'no se permite modificar los permisos propios'; end if;
  if not exists (select 1 from public.permissions where code = p_perm) then
    raise exception 'permiso inexistente'; end if;
  if exists (select 1 from public.permissions where code = p_perm and reserved) then
    raise exception 'un permiso reservado no se concede/deniega por excepción individual'; end if;
  if p_effect is null then
    delete from public.user_permissions where user_id = p_user and permission_code = p_perm;
    perform public.log_audit('user_permissions', p_user, 'clear_user_permission',
      jsonb_build_object('perm', p_perm), null, null);
    return;
  end if;
  if p_effect not in ('grant','deny') then raise exception 'efecto inválido'; end if;
  if p_effect = 'grant' and not public.has_role('superadmin') and not public.has_permission(p_perm) then
    raise exception 'no podés conceder un permiso que no tenés'; end if;
  insert into public.user_permissions (user_id, permission_code, effect, granted_by)
  values (p_user, p_perm, p_effect, (select auth.uid()))
  on conflict (user_id, permission_code) do update set effect = excluded.effect,
    granted_by = excluded.granted_by, granted_at = now();
  perform public.log_audit('user_permissions', p_user, 'set_user_permission',
    null, jsonb_build_object('perm', p_perm, 'effect', p_effect), null);
end $$;

-- GRANT/REVOKE execute de las RPC de administración.
revoke execute on function public.create_role(text, text, text) from public, anon;
revoke execute on function public.update_role(text, text, text) from public, anon;
revoke execute on function public.delete_role(text) from public, anon;
revoke execute on function public.set_role_permissions(text, text[]) from public, anon;
revoke execute on function public.set_user_permission(uuid, text, text) from public, anon;
grant execute on function public.create_role(text, text, text) to authenticated;
grant execute on function public.update_role(text, text, text) to authenticated;
grant execute on function public.delete_role(text) to authenticated;
grant execute on function public.set_role_permissions(text, text[]) to authenticated;
grant execute on function public.set_user_permission(uuid, text, text) to authenticated;
grant execute on function public.is_last_superadmin(uuid) to authenticated;
