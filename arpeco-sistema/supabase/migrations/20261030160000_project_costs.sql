-- ============================================================================
-- Etapa 5 · Costos de proyecto, completitud y margen (P01–P05)
-- Fuente: docs/03_MODELO_DATOS.md y docs/04_ROLES_PERMISOS.md
--
--  * Costo pertenece al proyecto (sin FK a venta). posted/void, idempotente.
--  * "Costos completos" (costs_complete_at) es un hecho DISTINTO de "Finalizado".
--  * Si se registra/corrige un costo tras el cierre, se REABRE automáticamente.
--  * Margen definitivo sólo con costos completos; estimado/provisional si no.
--  * Costos y márgenes: Dirección; Ejecución ve costos de asignados (sin ventas).
-- ============================================================================

create table public.project_costs (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects (id) on delete cascade,
  amount          numeric(18, 2) not null check (amount > 0),
  incurred_on     date not null,
  description     text not null,
  category        text,
  idempotency_key uuid not null unique,
  status          text not null default 'posted' check (status in ('posted', 'void')),
  voids_cost_id   uuid references public.project_costs (id),
  reason          text,
  created_by      uuid references auth.users (id) default auth.uid(),
  created_at      timestamptz not null default now()
);
create index project_costs_idx on public.project_costs (project_id, status, incurred_on);

-- Reapertura automática de la completitud si cambia un costo tras el cierre.
create or replace function public.reopen_costs_on_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.projects
    set costs_complete_at = null, costs_complete_by = null, costs_reopened_at = now(), updated_at = now()
  where id = coalesce(new.project_id, old.project_id) and costs_complete_at is not null;
  return null;
end $$;
create trigger project_costs_reopen after insert or update on public.project_costs
  for each row execute function public.reopen_costs_on_change();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.project_costs enable row level security;

-- ¿El usuario es responsable (manager) del proyecto del costo?
create or replace function public.manages_project(p_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects pr
                 where pr.id = p_project and pr.manager_id = (select auth.uid()));
$$;
grant execute on function public.manages_project(uuid) to authenticated;

create policy project_costs_select on public.project_costs for select to authenticated
  using (public.is_direction() or public.manages_project(project_id));

revoke all on public.project_costs from anon, authenticated;
grant select on public.project_costs to authenticated;

-- ─── RPCs ─────────────────────────────────────────────────────────────────────
create or replace function public.register_cost(
  p_project uuid, p_amount numeric, p_incurred date, p_description text,
  p_idempotency uuid, p_category text default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not (public.is_direction() or public.manages_project(p_project)) then
    raise exception 'no autorizado para registrar costos de este proyecto'; end if;
  select id into v_id from public.project_costs where idempotency_key = p_idempotency;
  if found then return v_id; end if;
  if p_amount <= 0 then raise exception 'importe inválido'; end if;

  insert into public.project_costs (project_id, amount, incurred_on, description, category, idempotency_key)
  values (p_project, p_amount, p_incurred, p_description, p_category, p_idempotency)
  returning id into v_id;
  perform public.log_audit('project_costs', v_id, 'register_cost', null,
    jsonb_build_object('project_id', p_project, 'amount', p_amount), null);
  return v_id;
end $$;
revoke execute on function public.register_cost(uuid, numeric, date, text, uuid, text) from public, anon;
grant execute on function public.register_cost(uuid, numeric, date, text, uuid, text) to authenticated;

create or replace function public.void_cost(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_project uuid;
begin
  select project_id into v_project from public.project_costs where id = p_id;
  if not found then raise exception 'costo inexistente'; end if;
  if not (public.is_direction() or public.manages_project(v_project)) then
    raise exception 'no autorizado'; end if;
  update public.project_costs set status = 'void', reason = p_reason
    where id = p_id and status = 'posted';
  perform public.log_audit('project_costs', p_id, 'void_cost', null, null, p_reason);
end $$;
revoke execute on function public.void_cost(uuid, text) from public, anon;
grant execute on function public.void_cost(uuid, text) to authenticated;

-- Confirmar costos completos (SÓLO Dirección; distinto de Finalizado).
create or replace function public.complete_costs(p_project uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_direction() then raise exception 'sólo Dirección confirma costos completos'; end if;
  update public.projects
    set costs_complete_at = now(), costs_complete_by = (select auth.uid()),
        costs_reopened_at = null, updated_at = now()
  where id = p_project;
  perform public.log_audit('projects', p_project, 'complete_costs', null,
    jsonb_build_object('at', now()), p_reason);
end $$;
revoke execute on function public.complete_costs(uuid, text) from public, anon;
grant execute on function public.complete_costs(uuid, text) to authenticated;

-- Margen del proyecto (SÓLO Dirección): estimado y provisional/definitivo.
create or replace function public.project_margin(p_project uuid)
returns table (
  sale_amount numeric, estimated_cost numeric, recorded_cost numeric,
  margin_estimated_pct numeric, margin_recorded_pct numeric, costs_complete boolean
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_direction() then return; end if;
  return query
    select s.amount,
           q.estimated_cost,
           coalesce((select sum(c.amount) from public.project_costs c
                     where c.project_id = p_project and c.status = 'posted'), 0),
           case when q.estimated_cost is null or s.amount = 0 then null
                else round((s.amount - q.estimated_cost) / s.amount * 100, 2) end,
           case when s.amount = 0 then null
                else round((s.amount - coalesce((select sum(c.amount) from public.project_costs c
                     where c.project_id = p_project and c.status = 'posted'), 0)) / s.amount * 100, 2) end,
           (pr.costs_complete_at is not null)
    from public.projects pr
    join public.sales s on s.id = pr.sale_id
    join public.quotes q on q.id = s.quote_id
    where pr.id = p_project;
end $$;
revoke execute on function public.project_margin(uuid) from public, anon;
grant execute on function public.project_margin(uuid) to authenticated;
