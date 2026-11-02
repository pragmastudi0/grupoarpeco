-- ============================================================================
-- Etapa 1 · Base segura — Identidad, roles, auditoría (B03)
-- Fuente de diseño: docs/03_MODELO_DATOS.md y docs/04_ROLES_PERMISOS.md
--
-- Principios aplicados:
--  * La base es la fuente única de verdad de autorización (RLS/GRANT/RPC).
--  * anon siempre denegado. Usuario inactivo falla todas las políticas.
--  * profiles.active y roles se cambian SOLO por función privilegiada auditada.
--  * audit_events es append-only (sin UPDATE/DELETE desde authenticated).
-- ============================================================================

-- ─── Tablas de catálogo e identidad ────────────────────────────────────────

create table public.roles (
  code  text primary key,
  label text not null
);

insert into public.roles (code, label) values
  ('direction',      'Dirección'),
  ('administration', 'Administración'),
  ('seller',         'Vendedor'),
  ('execution',      'Ejecución'),
  ('support',        'Soporte');

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null default '',
  email         text not null default '',
  active        boolean not null default false,
  activated_at  timestamptz,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

create table public.user_roles (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role_code  text not null references public.roles (code),
  granted_by uuid references auth.users (id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role_code)
);

create table public.support_access (
  id               uuid primary key default gen_random_uuid(),
  support_user_id  uuid not null references public.profiles (id) on delete cascade,
  approved_by      uuid not null references auth.users (id),
  reason           text not null,
  starts_at        timestamptz not null default now(),
  expires_at       timestamptz not null,
  scope            text not null default 'read',
  created_at       timestamptz not null default now(),
  constraint support_access_window check (expires_at > starts_at)
);

create table public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id   uuid,
  action      text not null,
  actor_id    uuid references auth.users (id),
  occurred_at timestamptz not null default now(),
  request_id  uuid,
  before_data jsonb,
  after_data  jsonb,
  reason      text
);

create index audit_events_entity_idx on public.audit_events (entity_type, entity_id, occurred_at desc);

-- ─── Funciones helper de autorización (usadas por las políticas RLS) ────────
-- SECURITY DEFINER + search_path vacío + referencias calificadas (guía Supabase).

create or replace function public.is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.active
  );
$$;

create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.user_roles ur on ur.user_id = p.id
    where p.id = (select auth.uid())
      and p.active
      and ur.role_code = p_role
  );
$$;

create or replace function public.is_direction()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('direction');
$$;

-- Lectura de auditoría por soporte sólo con una concesión vigente (D03).
create or replace function public.has_support_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.support_access sa
    join public.profiles p on p.id = sa.support_user_id
    where sa.support_user_id = (select auth.uid())
      and p.active
      and now() between sa.starts_at and sa.expires_at
  );
$$;

-- Registro de auditoría (actor = usuario actual).
create or replace function public.log_audit(
  p_entity_type text,
  p_entity_id   uuid,
  p_action      text,
  p_before      jsonb default null,
  p_after       jsonb default null,
  p_reason      text  default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_events (entity_type, entity_id, action, actor_id, before_data, after_data, reason)
  values (p_entity_type, p_entity_id, p_action, (select auth.uid()), p_before, p_after, p_reason);
$$;

-- ─── Triggers de alta y activación por invitación ───────────────────────────

-- Al crearse el usuario de Auth, nace su perfil INACTIVO. La activación real
-- ocurre al confirmar el email (aceptar invitación / fijar contraseña).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Primera confirmación de email → activa el perfil una sola vez.
-- Una baja posterior (active=false) no se revierte porque el email ya estaba confirmado.
create or replace function public.handle_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles
      set active = true, activated_at = now(), updated_at = now()
    where id = new.id and activated_at is null;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_confirmed();

-- Guardia de columnas de profiles: el propio usuario sólo edita display_name.
-- active / activated_at / id sólo cambian dentro de una acción administrativa
-- marcada (GUC local app.admin_action) por las RPC privilegiadas.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.admin_action', true), '') <> 'on' then
    if new.active is distinct from old.active
       or new.activated_at is distinct from old.activated_at
       or new.id is distinct from old.id
       or new.email is distinct from old.email then
      raise exception 'profiles: active/email/id sólo se cambian por función administrativa';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger guard_profile_update_trg
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table public.roles           enable row level security;
alter table public.profiles        enable row level security;
alter table public.user_roles      enable row level security;
alter table public.support_access  enable row level security;
alter table public.app_settings    enable row level security;
alter table public.audit_events    enable row level security;

-- roles: catálogo legible por cualquier usuario activo; sin escritura por API.
create policy roles_select on public.roles
  for select to authenticated
  using (public.is_active());

-- profiles: cada quien se ve a sí mismo; Dirección ve a todos.
create policy profiles_select_self_or_direction on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_direction());

-- El usuario puede editar su propia fila (la guardia restringe a display_name).
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- user_roles: lectura propia o Dirección. Sin INSERT/UPDATE/DELETE por API
-- (los cambios van sólo por RPC privilegiada). Default-deny cubre el resto.
create policy user_roles_select on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_direction());

-- support_access: lectura propia o Dirección.
create policy support_access_select on public.support_access
  for select to authenticated
  using (support_user_id = (select auth.uid()) or public.is_direction());

-- app_settings: configuración pública legible por usuarios activos.
create policy app_settings_select on public.app_settings
  for select to authenticated
  using (public.is_active());

-- audit_events: sólo Dirección, o Soporte con concesión vigente. Nunca escritura por API.
create policy audit_events_select on public.audit_events
  for select to authenticated
  using (public.is_direction() or public.has_support_access());

-- ─── GRANTs explícitos (las entidades nuevas no se exponen sin GRANT) ────────

revoke all on public.roles, public.profiles, public.user_roles,
  public.support_access, public.app_settings, public.audit_events
  from anon, authenticated;

grant select on public.roles           to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.user_roles      to authenticated;
grant select on public.support_access  to authenticated;
grant select on public.app_settings    to authenticated;
grant select on public.audit_events    to authenticated;

-- Las funciones helper se evalúan dentro de las políticas con el rol que consulta.
grant execute on function public.is_active()            to authenticated;
grant execute on function public.has_role(text)         to authenticated;
grant execute on function public.is_direction()         to authenticated;
grant execute on function public.has_support_access()   to authenticated;
revoke execute on function public.log_audit(text, uuid, text, jsonb, jsonb, text) from public, anon, authenticated;
