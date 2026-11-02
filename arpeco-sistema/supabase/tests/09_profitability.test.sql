-- pgTAP · Rentabilidad: sólo sobre trabajos con costos completos (no costo=0 ficticio)
begin;
select plan(8);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- Aceptar crea venta (12M) y proyecto SIN costos completos.
select lives_ok(
  $$ select public.accept_quote('d0000000-0000-0000-0000-000000000001', 1, 'ok') $$,
  'Dirección acepta el presupuesto (12M, sin costos)'
);
select lives_ok(
  $$ select public.confirm_sale('d0000000-0000-0000-0000-000000000001', 1) $$,
  'Dirección confirma la venta (crea venta y proyecto)'
);

-- Sin costos completos: margen NO disponible (null), no 100% ficticio.
select is(
  (select margin_pct from public.report_profitability('2026-01-01', '2026-12-31')),
  null,
  'Sin costos completos: margen no disponible'
);
select is(
  (select jobs_pending from public.report_profitability('2026-01-01', '2026-12-31')),
  1,
  'Un trabajo con costos pendientes'
);
select is(
  (select jobs_complete from public.report_profitability('2026-01-01', '2026-12-31')),
  0,
  'Ningún trabajo con costos completos aún'
);

-- Registrar costo y cerrar costos → entra a la base de rentabilidad.
select lives_ok(
  $$ select public.register_cost(
       (select pr.id from public.projects pr join public.sales s on s.id = pr.sale_id
        where s.quote_id = 'd0000000-0000-0000-0000-000000000001'),
       8000000, '2026-09-10', 'Materiales', '00000000-0000-0000-0000-0000000000f1', 'materiales') $$,
  'Registra un costo de 8M'
);
select lives_ok(
  $$ select public.complete_costs(
       (select pr.id from public.projects pr join public.sales s on s.id = pr.sale_id
        where s.quote_id = 'd0000000-0000-0000-0000-000000000001'), 'cierre') $$,
  'Dirección cierra los costos'
);
select is(
  (select margin_pct::text from public.report_profitability('2026-01-01', '2026-12-31')),
  '33.33',
  'Margen real sobre base completa = (12M-8M)/12M = 33,33%'
);

select * from finish();
rollback;
