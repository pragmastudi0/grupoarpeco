-- ============================================================================
-- Etapa 2 · Clientes, CRM (oportunidades/seguimientos) y Ferias (C01–C08)
-- Fuente: docs/03_MODELO_DATOS.md y docs/04_ROLES_PERMISOS.md
--
--  * "Propio" = owner_id = auth.uid(). D/A ven global; V su cartera.
--  * WITH CHECK protege owner_id: V no se autoasigna registros ajenos.
--  * Deduplicación de clientes por RPC (coincidencias mínimas globales).
--  * Merge en vez de borrado; anulación en vez de DELETE.
-- ============================================================================

-- ─── Normalización (para unicidad y búsqueda) ───────────────────────────────
create extension if not exists unaccent with schema extensions;

create or replace function public.f_unaccent(text)
returns text
language sql
immutable
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent', $1) $$;

create or replace function public.normalize_name(p text)
returns text
language sql
immutable
set search_path = ''
as $$ select lower(regexp_replace(trim(public.f_unaccent(coalesce(p, ''))), '\s+', ' ', 'g')) $$;

create or replace function public.normalize_tax_id(p text)
returns text
language sql
immutable
set search_path = ''
as $$ select nullif(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '') $$;

-- Trigger genérico de updated_at.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$ begin new.updated_at := now(); return new; end $$;

-- ─── Clientes ───────────────────────────────────────────────────────────────
create table public.clients (
  id             uuid primary key default gen_random_uuid(),
  legal_name     text not null,
  name_key       text not null default '', -- lo completa el trigger set_client_keys
  tax_id         text,
  tax_id_key     text,
  phone          text,
  email          text,
  address        text,
  industry       text,
  notes          text,
  owner_id       uuid not null references auth.users (id),
  status         text not null default 'active' check (status in ('active', 'merged', 'archived')),
  merged_into_id uuid references public.clients (id),
  created_by     uuid references auth.users (id) default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz
);

create or replace function public.set_client_keys()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name_key := public.normalize_name(new.legal_name);
  new.tax_id_key := public.normalize_tax_id(new.tax_id);
  return new;
end $$;

create trigger clients_keys before insert or update on public.clients
  for each row execute function public.set_client_keys();
create trigger clients_touch before update on public.clients
  for each row execute function public.touch_updated_at();

-- Unicidad entre activos: CUIT normalizado y nombre normalizado.
create unique index clients_tax_id_uq on public.clients (tax_id_key)
  where tax_id_key is not null and status = 'active';
create unique index clients_name_key_uq on public.clients (name_key)
  where status = 'active';
create index clients_owner_status_idx on public.clients (owner_id, status);
create index clients_name_key_idx on public.clients (name_key);

-- ─── Contacto principal del cliente ─────────────────────────────────────────
create table public.client_contacts (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients (id) on delete cascade,
  name       text not null,
  phone      text,
  email      text,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create unique index client_contacts_primary_uq on public.client_contacts (client_id)
  where is_primary;
create trigger client_contacts_touch before update on public.client_contacts
  for each row execute function public.touch_updated_at();

-- ─── Ferias ─────────────────────────────────────────────────────────────────
create table public.fairs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  place       text,
  starts_on   date not null,
  ends_on     date,
  description text,
  status      text not null default 'active' check (status in ('active', 'cancelled')),
  created_by  uuid references auth.users (id) default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  constraint fairs_dates check (ends_on is null or ends_on >= starts_on)
);
create trigger fairs_touch before update on public.fairs
  for each row execute function public.touch_updated_at();

create table public.fair_staff (
  fair_id uuid not null references public.fairs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (fair_id, user_id)
);

-- ─── Prospectos de feria ────────────────────────────────────────────────────
create table public.fair_prospects (
  id           uuid primary key default gen_random_uuid(),
  fair_id      uuid not null references public.fairs (id) on delete cascade,
  client_id    uuid references public.clients (id),
  company_name text not null,
  name_key     text not null default '', -- lo completa el trigger set_prospect_keys
  contact_name text,
  phone        text,
  email        text,
  owner_id     uuid not null references auth.users (id),
  notes        text,
  first_seen_on date not null default (now() at time zone 'America/Argentina/Cordoba')::date,
  status       text not null default 'active' check (status in ('active', 'void')),
  created_by   uuid references auth.users (id) default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);
create or replace function public.set_prospect_keys()
returns trigger
language plpgsql
set search_path = ''
as $$ begin new.name_key := public.normalize_name(new.company_name); return new; end $$;
create trigger fair_prospects_keys before insert or update on public.fair_prospects
  for each row execute function public.set_prospect_keys();
create trigger fair_prospects_touch before update on public.fair_prospects
  for each row execute function public.touch_updated_at();
create unique index fair_prospects_uq on public.fair_prospects (fair_id, name_key)
  where status = 'active';
create index fair_prospects_owner_idx on public.fair_prospects (owner_id, status);
create index fair_prospects_client_idx on public.fair_prospects (client_id);

-- ─── Oportunidades ──────────────────────────────────────────────────────────
create table public.opportunities (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid references public.clients (id),
  prospect_id       uuid references public.fair_prospects (id),
  origin_fair_id    uuid references public.fairs (id),
  title             text not null,
  owner_id          uuid not null references auth.users (id),
  stage             text not null default 'new'
                      check (stage in ('new', 'sent', 'negotiation', 'won', 'lost')),
  estimated_amount  numeric(18, 2) check (estimated_amount is null or estimated_amount >= 0),
  next_followup_on  date,
  closed_at         timestamptz,
  created_by        uuid references auth.users (id) default auth.uid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz,
  -- Exactamente una referencia comercial inicial (cliente o prospecto).
  constraint opp_one_ref check ((client_id is not null)::int + (prospect_id is not null)::int = 1)
);
create trigger opportunities_touch before update on public.opportunities
  for each row execute function public.touch_updated_at();
create index opportunities_owner_idx on public.opportunities (owner_id, stage, next_followup_on);
create index opportunities_fair_idx on public.opportunities (origin_fair_id);
create index opportunities_client_idx on public.opportunities (client_id);

-- ─── Seguimientos (append-only, se anulan) ──────────────────────────────────
create table public.followups (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.opportunities (id) on delete cascade,
  prospect_id    uuid references public.fair_prospects (id) on delete cascade,
  occurred_at    timestamptz not null default now(),
  kind           text not null,
  summary        text not null,
  next_on        date,
  owner_id       uuid not null references auth.users (id),
  status         text not null default 'active' check (status in ('active', 'void')),
  created_by     uuid references auth.users (id) default auth.uid(),
  created_at     timestamptz not null default now(),
  constraint followup_one_target check (
    (opportunity_id is not null)::int + (prospect_id is not null)::int >= 1
  )
);
create index followups_opp_idx on public.followups (opportunity_id, status);
create index followups_prospect_idx on public.followups (prospect_id, status);

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.clients        enable row level security;
alter table public.client_contacts enable row level security;
alter table public.fairs          enable row level security;
alter table public.fair_staff     enable row level security;
alter table public.fair_prospects enable row level security;
alter table public.opportunities  enable row level security;
alter table public.followups      enable row level security;

-- Helpers de rol para legibilidad.
create or replace function public.is_admin_or_direction()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_role('direction') or public.has_role('administration');
$$;
grant execute on function public.is_admin_or_direction() to authenticated;

-- Clientes: D/A global; V su cartera. V no cambia owner (WITH CHECK).
create policy clients_select on public.clients for select to authenticated
  using (public.is_admin_or_direction() or (public.is_active() and owner_id = (select auth.uid())));
create policy clients_insert on public.clients for insert to authenticated
  with check (
    public.is_active()
    and (public.is_admin_or_direction() or owner_id = (select auth.uid()))
  );
create policy clients_update_owner on public.clients for update to authenticated
  using (public.is_active() and owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy clients_update_admin on public.clients for update to authenticated
  using (public.is_admin_or_direction()) with check (public.is_admin_or_direction());

-- Contactos: siguen la visibilidad del cliente.
create policy client_contacts_all on public.client_contacts for all to authenticated
  using (
    exists (
      select 1 from public.clients c where c.id = client_id
      and (public.is_admin_or_direction() or (public.is_active() and c.owner_id = (select auth.uid())))
    )
  )
  with check (
    exists (
      select 1 from public.clients c where c.id = client_id
      and (public.is_admin_or_direction() or (public.is_active() and c.owner_id = (select auth.uid())))
    )
  );

-- Ferias: D crea/edita; A lee; V lee (participa o global para origen).
create policy fairs_select on public.fairs for select to authenticated
  using (public.is_active());
create policy fairs_write_direction on public.fairs for all to authenticated
  using (public.has_role('direction')) with check (public.has_role('direction'));

-- Participantes de feria: D gestiona; usuarios activos leen.
create policy fair_staff_select on public.fair_staff for select to authenticated
  using (public.is_active());
create policy fair_staff_write on public.fair_staff for all to authenticated
  using (public.has_role('direction')) with check (public.has_role('direction'));

-- Prospectos: D/A ven global; V su cartera. V no cambia owner.
create policy prospects_select on public.fair_prospects for select to authenticated
  using (public.is_admin_or_direction() or (public.is_active() and owner_id = (select auth.uid())));
create policy prospects_insert on public.fair_prospects for insert to authenticated
  with check (public.is_active() and (public.is_admin_or_direction() or owner_id = (select auth.uid())));
create policy prospects_update_owner on public.fair_prospects for update to authenticated
  using (public.is_active() and owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy prospects_update_admin on public.fair_prospects for update to authenticated
  using (public.is_admin_or_direction()) with check (public.is_admin_or_direction());

-- Oportunidades: D global (A lectura); V su cartera. V no cambia owner.
create policy opps_select on public.opportunities for select to authenticated
  using (public.is_admin_or_direction() or (public.is_active() and owner_id = (select auth.uid())));
create policy opps_insert on public.opportunities for insert to authenticated
  with check (public.is_active() and (public.has_role('direction') or owner_id = (select auth.uid())));
create policy opps_update_owner on public.opportunities for update to authenticated
  using (public.is_active() and owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy opps_update_direction on public.opportunities for update to authenticated
  using (public.has_role('direction')) with check (public.has_role('direction'));

-- Seguimientos: D global; V propios. Anulación por UPDATE de status.
create policy followups_select on public.followups for select to authenticated
  using (public.has_role('direction') or (public.is_active() and owner_id = (select auth.uid())));
create policy followups_insert on public.followups for insert to authenticated
  with check (public.is_active() and owner_id = (select auth.uid()));
create policy followups_update_owner on public.followups for update to authenticated
  using (public.is_active() and owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- ─── GRANTs explícitos ──────────────────────────────────────────────────────
revoke all on public.clients, public.client_contacts, public.fairs, public.fair_staff,
  public.fair_prospects, public.opportunities, public.followups from anon, authenticated;

grant select, insert, update on public.clients          to authenticated;
grant select, insert, update, delete on public.client_contacts to authenticated;
grant select, insert, update on public.fairs            to authenticated;
grant select, insert, delete on public.fair_staff       to authenticated;
grant select, insert, update on public.fair_prospects   to authenticated;
grant select, insert, update on public.opportunities    to authenticated;
grant select, insert, update on public.followups        to authenticated;

-- ============================================================================
-- RPCs de deduplicación, merge y reasignación
-- ============================================================================

-- Búsqueda global mínima de clientes para deduplicar antes de dar de alta.
-- Devuelve pocos campos; no revela la cartera completa.
create or replace function public.search_clients_min(p_query text)
returns table (id uuid, legal_name text, tax_id text, owner_id uuid, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.legal_name, c.tax_id, c.owner_id, c.status
  from public.clients c
  where public.is_active()
    and c.status = 'active'
    and (
      c.name_key like '%' || public.normalize_name(p_query) || '%'
      or (public.normalize_tax_id(p_query) is not null
          and c.tax_id_key = public.normalize_tax_id(p_query))
    )
  order by c.legal_name
  limit 10;
$$;
revoke execute on function public.search_clients_min(text) from public, anon;
grant execute on function public.search_clients_min(text) to authenticated;

-- Fusión de clientes (D/A): conserva FKs, marca origen como merged, audita.
create or replace function public.merge_clients(p_from uuid, p_into uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin_or_direction() then
    raise exception 'no autorizado: requiere Dirección o Administración';
  end if;
  if p_from = p_into then raise exception 'origen y destino iguales'; end if;
  if not exists (select 1 from public.clients where id = p_from and status = 'active') then
    raise exception 'cliente origen inexistente o no activo';
  end if;
  if not exists (select 1 from public.clients where id = p_into and status = 'active') then
    raise exception 'cliente destino inexistente o no activo';
  end if;

  update public.opportunities set client_id = p_into where client_id = p_from;
  update public.fair_prospects set client_id = p_into where client_id = p_from;
  -- Los contactos del origen se conservan asociados al origen fusionado.
  update public.clients
    set status = 'merged', merged_into_id = p_into, updated_at = now()
  where id = p_from;

  perform public.log_audit('clients', p_from, 'merge_clients',
    jsonb_build_object('from', p_from), jsonb_build_object('into', p_into), p_reason);
end $$;
revoke execute on function public.merge_clients(uuid, uuid, text) from public, anon;
grant execute on function public.merge_clients(uuid, uuid, text) to authenticated;

-- Reasignación de propietario (D/A): clientes, prospectos y oportunidades.
create or replace function public.reassign_owner(
  p_entity text, p_id uuid, p_new_owner uuid, p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_old uuid;
begin
  if not public.is_admin_or_direction() then
    raise exception 'no autorizado: requiere Dirección o Administración';
  end if;
  if not exists (select 1 from public.profiles where id = p_new_owner and active) then
    raise exception 'nuevo propietario inválido o inactivo';
  end if;

  if p_entity = 'client' then
    update public.clients set owner_id = p_new_owner, updated_at = now()
      where id = p_id returning owner_id into v_old;
  elsif p_entity = 'prospect' then
    update public.fair_prospects set owner_id = p_new_owner, updated_at = now()
      where id = p_id returning owner_id into v_old;
  elsif p_entity = 'opportunity' then
    update public.opportunities set owner_id = p_new_owner, updated_at = now()
      where id = p_id returning owner_id into v_old;
  else
    raise exception 'entidad no soportada: %', p_entity;
  end if;

  perform public.log_audit(p_entity, p_id, 'reassign_owner',
    jsonb_build_object('owner', v_old), jsonb_build_object('owner', p_new_owner), p_reason);
end $$;
revoke execute on function public.reassign_owner(text, uuid, uuid, text) from public, anon;
grant execute on function public.reassign_owner(text, uuid, uuid, text) to authenticated;
