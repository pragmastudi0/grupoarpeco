-- pgTAP · Ventas/cobros/facturas: aceptación, idempotencia, sobrecobro (S01–S06)
-- Seed: P-2026-0001 (sent, revisión 1, de 3333, total 12.000.000).
begin;
select plan(16);

set local role authenticated;

-- ── Dirección acepta ─────────────────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ select public.accept_quote('d0000000-0000-0000-0000-000000000001', 1, 'firma adjunta') $$,
  'Dirección acepta el presupuesto enviado'
);
select is(
  (select count(*)::int from public.sales where quote_id = 'd0000000-0000-0000-0000-000000000001'),
  0, 'Aceptar NO crea venta'
);
select is(
  (select status from public.quotes where id = 'd0000000-0000-0000-0000-000000000001'),
  'accepted', 'El presupuesto quedó aceptado'
);
select lives_ok(
  $$ select public.confirm_sale('d0000000-0000-0000-0000-000000000001', 1) $$,
  'Confirmar venta crea venta y proyecto'
);
select is(
  (select count(*)::int from public.sales where quote_id = 'd0000000-0000-0000-0000-000000000001'),
  1, 'Se creó exactamente una venta'
);
select is(
  (select count(*)::int from public.projects p
   join public.sales s on s.id = p.sale_id
   where s.quote_id = 'd0000000-0000-0000-0000-000000000001'),
  1, 'Se creó exactamente un proyecto'
);
select lives_ok(
  $$ select public.confirm_sale('d0000000-0000-0000-0000-000000000001', 1) $$,
  'Reintento de confirmación (idempotente) no duplica'
);
select throws_ok(
  $$ select public.confirm_sale('d0000000-0000-0000-0000-000000000001', 2) $$,
  null, null, 'Confirmar en otra revisión es rechazado'
);

-- ── Cobros ───────────────────────────────────────────────────────────────────
select lives_ok(
  $$ select public.register_payment(
       (select id from public.sales where quote_id='d0000000-0000-0000-0000-000000000001'),
       5000000, '2026-09-01', 'transferencia', 'OP-1', '00000000-0000-0000-0000-0000000000aa') $$,
  'Cobro registrado'
);
select lives_ok(
  $$ select public.register_payment(
       (select id from public.sales where quote_id='d0000000-0000-0000-0000-000000000001'),
       5000000, '2026-09-01', 'transferencia', 'OP-1', '00000000-0000-0000-0000-0000000000aa') $$,
  'Reintento con misma idempotency_key no falla'
);
select is(
  (select count(*)::int from public.payments
   where sale_id = (select id from public.sales where quote_id='d0000000-0000-0000-0000-000000000001')),
  1, 'Un solo cobro pese al reintento (idempotente)'
);
select throws_ok(
  $$ select public.register_payment(
       (select id from public.sales where quote_id='d0000000-0000-0000-0000-000000000001'),
       99000000, '2026-09-02', 'efectivo', 'Y', '00000000-0000-0000-0000-0000000000bb') $$,
  null, null, 'Sobrecobro bloqueado'
);
select is(
  (select pending_collection::text from public.sale_balances
   where sale_id = (select id from public.sales where quote_id='d0000000-0000-0000-0000-000000000001')),
  '7000000.00', 'Saldo pendiente de cobro = 7.000.000,00'
);

-- ── Restricciones del Vendedor ───────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select throws_ok(
  $$ select public.register_payment(
       (select id from public.sales where quote_id='d0000000-0000-0000-0000-000000000001'),
       1, '2026-09-02', 'efectivo', 'Z', '00000000-0000-0000-0000-0000000000cc') $$,
  null, null, 'Vendedor no puede registrar cobros'
);
select throws_ok(
  $$ select method from public.payments limit 1 $$,
  '42501', null, 'Vendedor no puede leer la columna method'
);
select is(
  (select count(*)::int from public.payment_details(
     (select id from public.sales where quote_id='d0000000-0000-0000-0000-000000000001'))),
  0, 'payment_details no devuelve nada al Vendedor'
);

select * from finish();
rollback;
