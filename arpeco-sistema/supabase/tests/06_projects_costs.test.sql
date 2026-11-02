-- pgTAP · Proyectos y costos: margen, completitud reabrible y permisos (P01–P05)
begin;
select plan(12);

set local role authenticated;

-- Dirección prepara: acepta presupuesto (crea venta+proyecto) y asigna responsable.
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ select public.accept_quote('d0000000-0000-0000-0000-000000000001', 1, 'ok') $$,
  'Dirección acepta → crea venta y proyecto'
);
select lives_ok(
  $$ select public.confirm_sale('d0000000-0000-0000-0000-000000000001', 1) $$,
  'Dirección confirma la venta (crea venta y proyecto)'
);
select lives_ok(
  $$ select public.assign_project_manager(
       (select pr.id from public.projects pr join public.sales s on s.id = pr.sale_id
        where s.quote_id = 'd0000000-0000-0000-0000-000000000001'),
       '44444444-4444-4444-4444-444444444444') $$,
  'Asigna responsable (Ejecución)'
);
select lives_ok(
  $$ select public.register_cost(
       (select pr.id from public.projects pr join public.sales s on s.id = pr.sale_id
        where s.quote_id = 'd0000000-0000-0000-0000-000000000001'),
       4000000, '2026-09-10', 'Materiales', '00000000-0000-0000-0000-0000000000d1', 'materiales') $$,
  'Dirección registra un costo'
);
select is(
  (select margin_estimated_pct::text from public.project_margin(
     (select pr.id from public.projects pr join public.sales s on s.id = pr.sale_id
      where s.quote_id = 'd0000000-0000-0000-0000-000000000001'))),
  '35.00', 'Margen estimado = 35,00% (12M vs 7,8M)'
);
select is(
  (select margin_recorded_pct::text from public.project_margin(
     (select pr.id from public.projects pr join public.sales s on s.id = pr.sale_id
      where s.quote_id = 'd0000000-0000-0000-0000-000000000001'))),
  '66.67', 'Margen con costos registrados = 66,67% (12M vs 4M)'
);
select lives_ok(
  $$ select public.complete_costs(
       (select pr.id from public.projects pr join public.sales s on s.id = pr.sale_id
        where s.quote_id = 'd0000000-0000-0000-0000-000000000001'), 'cierre') $$,
  'Dirección confirma costos completos'
);
-- Un nuevo costo tras el cierre debe REABRIR la completitud.
select lives_ok(
  $$ select public.register_cost(
       (select pr.id from public.projects pr join public.sales s on s.id = pr.sale_id
        where s.quote_id = 'd0000000-0000-0000-0000-000000000001'),
       420000, '2026-09-20', 'Ajuste', '00000000-0000-0000-0000-0000000000d2', 'otros') $$,
  'Registra un costo posterior al cierre'
);
select is(
  (select costs_complete::text from public.project_margin(
     (select pr.id from public.projects pr join public.sales s on s.id = pr.sale_id
      where s.quote_id = 'd0000000-0000-0000-0000-000000000001'))),
  'false', 'La completitud se reabrió automáticamente'
);

-- Ejecución (responsable) puede registrar costos de su proyecto.
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';
select lives_ok(
  $$ select public.register_cost(
       (select pr.id from public.projects pr join public.sales s on s.id = pr.sale_id
        where s.quote_id = 'd0000000-0000-0000-0000-000000000001'),
       100000, '2026-09-21', 'Flete', '00000000-0000-0000-0000-0000000000d3', 'logistica') $$,
  'Ejecución asignada registra costo'
);

-- Administración NO puede registrar costos (ni es responsable).
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ select public.register_cost(
       (select pr.id from public.projects pr join public.sales s on s.id = pr.sale_id
        where s.quote_id = 'd0000000-0000-0000-0000-000000000001'),
       1, '2026-09-22', 'x', '00000000-0000-0000-0000-0000000000d4', 'y') $$,
  null, null, 'Administración no registra costos'
);

-- Vendedor no ve los costos.
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is(
  (select count(*)::int from public.project_costs),
  0, 'Vendedor no ve costos de proyecto'
);

select * from finish();
rollback;
