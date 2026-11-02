-- ============================================================================
-- Etapa 3 · Presupuestos, ítems, revisiones y numeración (Q01–Q05)
-- Fuente: docs/03_MODELO_DATOS.md y docs/04_ROLES_PERMISOS.md
--
--  * Totales calculados por la base (fuente única). subtotal = round(qty*precio,2).
--  * Estados draft→sent→accepted/rejected/void. Enviar congela una revisión.
--  * Costo estimado y notas internas: SÓLO Dirección (protección por columna).
--  * Numeración legible P-AAAA-NNNN por document_sequences (con bloqueo).
-- ============================================================================

-- digest() para el hash de las revisiones.
create extension if not exists pgcrypto with schema extensions;

-- ─── Numeración de documentos ───────────────────────────────────────────────
create table public.document_sequences (
  kind    text not null,
  year    int  not null,
  next_no int  not null,
  primary key (kind, year)
);

create or replace function public.next_document_no(p_kind text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year   int := extract(year from (now() at time zone 'America/Argentina/Cordoba'))::int;
  v_no     int;
  v_prefix text := case p_kind
                     when 'quote' then 'P'
                     when 'sale' then 'V'
                     when 'project' then 'PRY'
                     else upper(left(p_kind, 1)) end;
begin
  update public.document_sequences
    set next_no = next_no + 1
    where kind = p_kind and year = v_year
    returning next_no - 1 into v_no;
  if not found then
    insert into public.document_sequences (kind, year, next_no) values (p_kind, v_year, 2);
    v_no := 1;
  end if;
  return format('%s-%s-%s', v_prefix, v_year, lpad(v_no::text, 4, '0'));
end $$;

-- ─── Presupuestos ───────────────────────────────────────────────────────────
create table public.quotes (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references public.clients (id),
  opportunity_id     uuid references public.opportunities (id),
  origin_fair_id     uuid references public.fairs (id),
  owner_id           uuid not null references auth.users (id),
  commercial_no      text unique,
  revision           int not null default 1 check (revision >= 1),
  title              text not null,
  event_on           date,
  issued_on          date,
  valid_until        date,
  status             text not null default 'draft'
                       check (status in ('draft', 'sent', 'accepted', 'rejected', 'void')),
  currency           char(3) not null default 'ARS' check (currency = 'ARS'),
  estimated_cost     numeric(18, 2) check (estimated_cost is null or estimated_cost >= 0),
  total              numeric(18, 2) not null default 0,
  public_notes       text,
  internal_notes     text,
  sent_at            timestamptz,
  accepted_at        timestamptz,
  acceptance_evidence text,
  created_by         uuid references auth.users (id) default auth.uid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz
);
create index quotes_client_idx on public.quotes (client_id, created_at desc);
create index quotes_owner_idx on public.quotes (owner_id, status, issued_on);
create index quotes_opp_idx on public.quotes (opportunity_id);

create or replace function public.set_quote_no()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.commercial_no is null then
    new.commercial_no := public.next_document_no('quote');
  end if;
  return new;
end $$;
create trigger quotes_no before insert on public.quotes
  for each row execute function public.set_quote_no();
create trigger quotes_touch before update on public.quotes
  for each row execute function public.touch_updated_at();

-- ─── Ítems del presupuesto ──────────────────────────────────────────────────
create table public.quote_items (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid not null references public.quotes (id) on delete cascade,
  position    int not null,
  description text not null,
  quantity    numeric(12, 3) not null check (quantity > 0),
  unit_price  numeric(18, 2) not null check (unit_price >= 0),
  subtotal    numeric(18, 2) not null default 0,
  unique (quote_id, position)
);

-- subtotal calculado por la base (regla única de redondeo).
create or replace function public.set_item_subtotal()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.subtotal := round(new.quantity * new.unit_price, 2);
  return new;
end $$;
create trigger quote_items_subtotal before insert or update on public.quote_items
  for each row execute function public.set_item_subtotal();

-- total del presupuesto = suma de subtotales.
create or replace function public.recompute_quote_total()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_quote uuid := coalesce(new.quote_id, old.quote_id);
begin
  update public.quotes
    set total = coalesce((select sum(subtotal) from public.quote_items where quote_id = v_quote), 0),
        updated_at = now()
  where id = v_quote;
  return null;
end $$;
create trigger quote_items_total after insert or update or delete on public.quote_items
  for each row execute function public.recompute_quote_total();

-- ─── Revisiones inmutables ──────────────────────────────────────────────────
create table public.quote_revisions (
  id         uuid primary key default gen_random_uuid(),
  quote_id   uuid not null references public.quotes (id) on delete cascade,
  revision   int not null,
  snapshot   jsonb not null,
  sha256     text not null,
  created_at timestamptz not null default now(),
  unique (quote_id, revision)
);

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.quotes          enable row level security;
alter table public.quote_items     enable row level security;
alter table public.quote_revisions enable row level security;

-- Presupuestos: D/A global; V su cartera. V no cambia owner.
create policy quotes_select on public.quotes for select to authenticated
  using (public.is_admin_or_direction() or (public.is_active() and owner_id = (select auth.uid())));
create policy quotes_insert on public.quotes for insert to authenticated
  with check (public.is_active() and (public.is_admin_or_direction() or owner_id = (select auth.uid())));
create policy quotes_update_owner on public.quotes for update to authenticated
  using (public.is_active() and owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy quotes_update_admin on public.quotes for update to authenticated
  using (public.is_admin_or_direction()) with check (public.is_admin_or_direction());

-- Ítems: visibles/editables según el presupuesto; edición sólo en borrador.
create policy quote_items_select on public.quote_items for select to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id
    and (public.is_admin_or_direction() or (public.is_active() and q.owner_id = (select auth.uid())))));
create policy quote_items_write on public.quote_items for all to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id
    and q.status = 'draft'
    and (public.is_admin_or_direction() or (public.is_active() and q.owner_id = (select auth.uid())))))
  with check (exists (select 1 from public.quotes q where q.id = quote_id
    and q.status = 'draft'
    and (public.is_admin_or_direction() or (public.is_active() and q.owner_id = (select auth.uid())))));

-- Revisiones: lectura según presupuesto; escritura sólo por función.
create policy quote_revisions_select on public.quote_revisions for select to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id
    and (public.is_admin_or_direction() or (public.is_active() and q.owner_id = (select auth.uid())))));

-- ─── GRANTs (protección por COLUMNA: costo/margen e internos sólo D) ─────────
revoke all on public.quotes, public.quote_items, public.quote_revisions from anon, authenticated;

-- authenticated ve/edita columnas públicas; estimated_cost e internal_notes NO.
grant select (id, client_id, opportunity_id, origin_fair_id, owner_id, commercial_no,
  revision, title, event_on, issued_on, valid_until, status, currency, total, public_notes,
  sent_at, accepted_at, acceptance_evidence, created_by, created_at, updated_at)
  on public.quotes to authenticated;
grant insert (client_id, opportunity_id, origin_fair_id, owner_id, title, event_on,
  valid_until, public_notes) on public.quotes to authenticated;
grant update (client_id, opportunity_id, origin_fair_id, title, event_on, valid_until,
  public_notes) on public.quotes to authenticated;

grant select, insert, update, delete on public.quote_items to authenticated;
grant select on public.quote_revisions to authenticated;

-- ============================================================================
-- RPCs de ciclo de vida y datos internos
-- ============================================================================

-- Lectura de costo/margen (SÓLO Dirección). Devuelve null si no corresponde.
create or replace function public.quote_margin(p_id uuid)
returns table (estimated_cost numeric, margin_pct numeric, internal_notes text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_role('direction') then
    return; -- sin filas para no-Dirección
  end if;
  return query
    select q.estimated_cost,
           case when q.estimated_cost is null or q.total = 0 then null
                else round((q.total - q.estimated_cost) / q.total * 100, 2) end,
           q.internal_notes
    from public.quotes q where q.id = p_id;
end $$;
revoke execute on function public.quote_margin(uuid) from public, anon;
grant execute on function public.quote_margin(uuid) to authenticated;

-- Fijar costo estimado / notas internas (SÓLO Dirección).
create or replace function public.set_quote_internal(
  p_id uuid, p_cost numeric default null, p_notes text default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_role('direction') then
    raise exception 'sólo Dirección puede editar costo/margen';
  end if;
  update public.quotes set estimated_cost = p_cost, internal_notes = p_notes, updated_at = now()
    where id = p_id;
  perform public.log_audit('quotes', p_id, 'set_quote_internal', null,
    jsonb_build_object('estimated_cost', p_cost), 'edición interna');
end $$;
revoke execute on function public.set_quote_internal(uuid, numeric, text) from public, anon;
grant execute on function public.set_quote_internal(uuid, numeric, text) to authenticated;

-- Enviar presupuesto: borrador→enviado, congela una revisión inmutable.
create or replace function public.send_quote(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare q public.quotes; v_snapshot jsonb;
begin
  select * into q from public.quotes where id = p_id for update;
  if not found then raise exception 'presupuesto inexistente'; end if;
  if not (public.is_admin_or_direction() or (public.is_active() and q.owner_id = (select auth.uid()))) then
    raise exception 'no autorizado'; end if;
  if q.status <> 'draft' then raise exception 'sólo se puede enviar un borrador'; end if;
  if not exists (select 1 from public.quote_items where quote_id = p_id) then
    raise exception 'el presupuesto no tiene ítems'; end if;

  v_snapshot := jsonb_build_object(
    'quote', to_jsonb(q),
    'items', (select coalesce(jsonb_agg(to_jsonb(i) order by i.position), '[]'::jsonb)
              from public.quote_items i where i.quote_id = p_id)
  );
  insert into public.quote_revisions (quote_id, revision, snapshot, sha256)
  values (p_id, q.revision, v_snapshot, encode(extensions.digest(v_snapshot::text, 'sha256'), 'hex'));

  update public.quotes set status = 'sent', sent_at = now(),
    issued_on = coalesce(issued_on, (now() at time zone 'America/Argentina/Cordoba')::date),
    updated_at = now()
  where id = p_id;

  perform public.log_audit('quotes', p_id, 'send_quote', null,
    jsonb_build_object('revision', q.revision), null);
end $$;
revoke execute on function public.send_quote(uuid) from public, anon;
grant execute on function public.send_quote(uuid) to authenticated;

-- Revisar un presupuesto enviado: crea nueva revisión editable (vuelve a borrador).
create or replace function public.revise_quote(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare q public.quotes;
begin
  select * into q from public.quotes where id = p_id for update;
  if not found then raise exception 'presupuesto inexistente'; end if;
  if not (public.is_admin_or_direction() or (public.is_active() and q.owner_id = (select auth.uid()))) then
    raise exception 'no autorizado'; end if;
  if q.status <> 'sent' then raise exception 'sólo se revisa un presupuesto enviado'; end if;

  update public.quotes set status = 'draft', revision = revision + 1, sent_at = null, updated_at = now()
    where id = p_id;
  perform public.log_audit('quotes', p_id, 'revise_quote',
    jsonb_build_object('revision', q.revision),
    jsonb_build_object('revision', q.revision + 1), null);
end $$;
revoke execute on function public.revise_quote(uuid) from public, anon;
grant execute on function public.revise_quote(uuid) to authenticated;

-- Rechazar un presupuesto enviado.
create or replace function public.reject_quote(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare q public.quotes;
begin
  select * into q from public.quotes where id = p_id for update;
  if not found then raise exception 'presupuesto inexistente'; end if;
  if not (public.is_admin_or_direction() or (public.is_active() and q.owner_id = (select auth.uid()))) then
    raise exception 'no autorizado'; end if;
  if q.status <> 'sent' then raise exception 'sólo se rechaza un presupuesto enviado'; end if;
  update public.quotes set status = 'rejected', updated_at = now() where id = p_id;
  perform public.log_audit('quotes', p_id, 'reject_quote', null, null, p_reason);
end $$;
revoke execute on function public.reject_quote(uuid, text) from public, anon;
grant execute on function public.reject_quote(uuid, text) to authenticated;
