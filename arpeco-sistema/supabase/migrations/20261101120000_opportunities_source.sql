-- ============================================================================
-- Origen de las oportunidades/prospectos (canal de entrada)
--
-- Permite marcar y filtrar los registros que entran por canales automáticos,
-- en particular el formulario de presupuestos de la web pública
-- (source = 'web'). No se toca el CHECK de `stage` ni la constraint
-- `opp_one_ref`: las consultas web entran como stage='new' ("Nueva") y
-- cuelgan de un prospecto (fair_prospects) de la feria centinela "Consultas Web".
-- ============================================================================

alter table public.opportunities add column if not exists source text;
alter table public.fair_prospects add column if not exists source text;

comment on column public.opportunities.source is
  'Canal de origen de la oportunidad. NULL = carga manual; ''web'' = formulario de presupuestos del sitio público.';
comment on column public.fair_prospects.source is
  'Canal de origen del prospecto. NULL = carga manual; ''web'' = formulario de presupuestos del sitio público.';

-- Índice parcial para listar rápido las consultas web pendientes de contactar.
create index if not exists opportunities_source_idx
  on public.opportunities (source, stage)
  where source is not null;
