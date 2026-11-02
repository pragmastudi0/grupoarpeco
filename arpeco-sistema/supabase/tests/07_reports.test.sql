-- pgTAP · Reportes: conciliación de KPIs y permisos por rol (R01–R06)
begin;
select plan(9);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- Preparar operación: aceptar presupuesto (vendido 12M) y cobrar 5M.
select lives_ok(
  $$ select public.accept_quote('d0000000-0000-0000-0000-000000000001', 1, 'ok') $$,
  'Dirección acepta (vendido 12M)'
);
select lives_ok(
  $$ select public.confirm_sale('d0000000-0000-0000-0000-000000000001', 1) $$,
  'Dirección confirma la venta (crea venta y proyecto)'
);
select lives_ok(
  $$ select public.register_payment(
       (select id from public.sales where quote_id='d0000000-0000-0000-0000-000000000001'),
       5000000, '2026-09-15', 'transferencia', 'OP', '00000000-0000-0000-0000-0000000000e1') $$,
  'Cobro de 5M registrado'
);

-- report_business concilia
select is(
  (select sold::text from public.report_business('2026-01-01', '2026-12-31')),
  '12000000.00', 'Vendido del período = 12.000.000'
);
select is(
  (select collected::text from public.report_business('2026-01-01', '2026-12-31')),
  '5000000.00', 'Cobrado del período = 5.000.000'
);
select is(
  (select pending_collection::text from public.report_business('2026-01-01', '2026-12-31')),
  '7000000.00', 'Pendiente de cobro (cohorte) = 7.000.000'
);
select is(
  (select sales_count from public.report_business('2026-01-01', '2026-12-31')),
  1, 'Una venta en el período'
);

-- Vendedor: ve su propia fila en report_sellers, no el reporte de negocio.
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is(
  (select sold::text from public.report_sellers('2026-01-01', '2026-12-31')
   where owner_id = '33333333-3333-3333-3333-333333333333'),
  '12000000.00', 'Vendedor ve su vendido individual'
);
select is(
  (select count(*)::int from public.report_business('2026-01-01', '2026-12-31')),
  0, 'report_business no devuelve nada al Vendedor'
);

select * from finish();
rollback;
