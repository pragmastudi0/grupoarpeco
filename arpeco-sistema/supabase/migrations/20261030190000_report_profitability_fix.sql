-- ============================================================================
-- FIX rentabilidad: calcular margen SÓLO sobre trabajos con costos completos.
--
-- El cálculo anterior hacía gain = vendido - coalesce(costos,0) sobre TODAS las
-- ventas, tratando el costo NO registrado como 0 → margen inflado (p. ej. 12M
-- vendidos, 0 costo → 100%). La base correcta son los proyectos con
-- costs_complete_at not null (confirmados por Dirección vía complete_costs):
--  * costo cero legítimo (completos con 0 costos) SÍ entra en la base;
--  * costo no registrado (costs_complete_at null) queda FUERA y suma a pendientes.
-- Si no hay base completa, gain/margin = NULL (la UI muestra "—").
-- ============================================================================

-- Cambia la forma devuelta → hay que recrear la función.
drop function if exists public.report_profitability(date, date);

create or replace function public.report_profitability(p_from date, p_to date)
returns table (
  sold_total    numeric,
  cost_complete numeric,
  gain          numeric,
  margin_pct    numeric,
  jobs_total    int,
  jobs_complete int,
  jobs_pending  int
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_role('direction') then return; end if;
  return query
  with period_sales as (
    select s.id, s.amount, (pr.costs_complete_at is not null) as complete
    from public.sales s
    join public.projects pr on pr.sale_id = s.id
    where s.status = 'active' and s.accepted_on between p_from and p_to
  ),
  costs as (
    select pr.sale_id, sum(c.amount) amt
    from public.project_costs c
    join public.projects pr on pr.id = c.project_id
    where c.status = 'posted'
    group by pr.sale_id
  ),
  joined as (
    select ps.amount, ps.complete, coalesce(co.amt, 0) as cost
    from period_sales ps
    left join costs co on co.sale_id = ps.id
  ),
  base as (
    select
      coalesce(sum(amount) filter (where complete), 0) as sold_c,
      coalesce(sum(cost) filter (where complete), 0)   as cost_c
    from joined
  )
  select
    coalesce((select sum(amount) from joined), 0),
    b.cost_c,
    case when b.sold_c > 0 then b.sold_c - b.cost_c else null end,
    case when b.sold_c > 0 then round((b.sold_c - b.cost_c) / b.sold_c * 100, 2) else null end,
    (select count(*)::int from joined),
    (select count(*) filter (where complete)::int from joined),
    (select count(*) filter (where not complete)::int from joined)
  from base b;
end $$;
revoke execute on function public.report_profitability(date, date) from public, anon;
grant execute on function public.report_profitability(date, date) to authenticated;
