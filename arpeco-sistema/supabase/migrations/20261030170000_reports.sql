-- ============================================================================
-- Etapa 6 · Reportes y dashboard (R01–R06)
-- Fuente: docs/01_PLAN_MAESTRO.md (definiciones de indicadores) y docs/04.
--
--  * Funciones SECURITY DEFINER con autorización por rol; detalle y KPI comparten
--    la misma lógica. Subconsultas preagregadas de pagos/facturas/costos antes de
--    unir, para NO multiplicar filas por venta.
--  * Fechas: quotes.issued_on (presupuestado), sales.accepted_on (vendido),
--    payments.received_on (cobrado), invoices.issued_on (facturado).
--  * Conversión v3 = ventas aceptadas / presupuestos emitidos DEL MISMO PERÍODO.
-- ============================================================================

-- Negocio (Dirección/Administración).
create or replace function public.report_business(p_from date, p_to date)
returns table (
  quoted numeric, sold numeric, collected numeric, invoiced numeric,
  pending_collection numeric, sales_count int
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin_or_direction() then return; end if;
  return query
  with period_sales as (
    select s.id, s.amount from public.sales s
    where s.status = 'active' and s.accepted_on between p_from and p_to
  ),
  paid as (
    select sale_id, sum(amount) amt from public.payments
    where status = 'posted' group by sale_id
  )
  select
    coalesce((select sum(total) from public.quotes
              where issued_on between p_from and p_to
                and status in ('sent', 'accepted', 'rejected')), 0),
    coalesce((select sum(amount) from period_sales), 0),
    coalesce((select sum(amount) from public.payments
              where status = 'posted' and received_on between p_from and p_to), 0),
    coalesce((select sum(amount) from public.invoices
              where status = 'posted' and issued_on between p_from and p_to), 0),
    coalesce((select sum(greatest(0, ps.amount - coalesce(pd.amt, 0)))
              from period_sales ps left join paid pd on pd.sale_id = ps.id), 0),
    (select count(*)::int from period_sales);
end $$;
revoke execute on function public.report_business(date, date) from public, anon;
grant execute on function public.report_business(date, date) to authenticated;

-- Rentabilidad (sólo Dirección).
create or replace function public.report_profitability(p_from date, p_to date)
returns table (
  sold numeric, recorded_cost numeric, gain numeric, margin_pct numeric,
  jobs_total int, jobs_without_cost int
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_role('direction') then return; end if;
  return query
  with period_sales as (
    select s.id, s.amount from public.sales s
    where s.status = 'active' and s.accepted_on between p_from and p_to
  ),
  costs as (
    select pr.sale_id, sum(c.amount) amt
    from public.project_costs c join public.projects pr on pr.id = c.project_id
    where c.status = 'posted' group by pr.sale_id
  )
  select
    coalesce(sum(ps.amount), 0),
    coalesce(sum(co.amt), 0),
    coalesce(sum(ps.amount), 0) - coalesce(sum(co.amt), 0),
    case when coalesce(sum(ps.amount), 0) = 0 then null
         else round((sum(ps.amount) - coalesce(sum(co.amt), 0)) / sum(ps.amount) * 100, 2) end,
    count(*)::int,
    count(*) filter (where co.amt is null)::int
  from period_sales ps left join costs co on co.sale_id = ps.id;
end $$;
revoke execute on function public.report_profitability(date, date) from public, anon;
grant execute on function public.report_profitability(date, date) to authenticated;

-- Equipo / individual (D/A ven todos; V ve su propia fila).
create or replace function public.report_sellers(p_from date, p_to date)
returns table (
  owner_id uuid, display_name text, opps_created int, quotes_sent int,
  sales_count int, sold numeric, conversion_pct numeric
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_active() then return; end if;
  return query
  with opps as (
    select o.owner_id as uid, count(*) c from public.opportunities o
    where o.created_at::date between p_from and p_to group by o.owner_id
  ),
  qs as (
    select q.owner_id as uid, count(*) c from public.quotes q
    where q.issued_on between p_from and p_to and q.status in ('sent', 'accepted', 'rejected')
    group by q.owner_id
  ),
  sl as (
    select s.owner_id as uid, count(*) c, sum(s.amount) amt from public.sales s
    where s.status = 'active' and s.accepted_on between p_from and p_to group by s.owner_id
  )
  select p.id, p.display_name, coalesce(o.c, 0)::int, coalesce(qu.c, 0)::int,
         coalesce(sl.c, 0)::int, coalesce(sl.amt, 0),
         case when coalesce(qu.c, 0) = 0 then null
              else round(coalesce(sl.c, 0)::numeric / qu.c * 100, 2) end
  from public.profiles p
  left join opps o on o.uid = p.id
  left join qs qu on qu.uid = p.id
  left join sl on sl.uid = p.id
  where p.active
    and (public.is_admin_or_direction() or p.id = (select auth.uid()));
end $$;
revoke execute on function public.report_sellers(date, date) from public, anon;
grant execute on function public.report_sellers(date, date) to authenticated;

-- Ferias (D/A). Prospectos únicos por feria vs. empresas compradoras atribuidas.
create or replace function public.report_fairs(p_from date, p_to date)
returns table (
  fair_id uuid, name text, prospects int, buyers int, conversion_pct numeric
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin_or_direction() then return; end if;
  return query
  with fp as (
    select fair_id, count(*) c from public.fair_prospects where status = 'active' group by fair_id
  ),
  fs as (
    select origin_fair_id, count(distinct client_id) b from public.sales
    where status = 'active' and origin_fair_id is not null group by origin_fair_id
  )
  select f.id, f.name, coalesce(fp.c, 0)::int, coalesce(fs.b, 0)::int,
         case when coalesce(fp.c, 0) = 0 then null
              else round(coalesce(fs.b, 0)::numeric / fp.c * 100, 2) end
  from public.fairs f
  left join fp on fp.fair_id = f.id
  left join fs on fs.origin_fair_id = f.id
  where f.starts_on between p_from and p_to or fs.b is not null;
end $$;
revoke execute on function public.report_fairs(date, date) from public, anon;
grant execute on function public.report_fairs(date, date) to authenticated;
