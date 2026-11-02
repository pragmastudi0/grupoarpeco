-- pgTAP · merge_clients repunta quotes/sales (fix) y marca el origen fusionado
begin;
select plan(3);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- El presupuesto P-2026-0001 pertenece al cliente a0…01.
select lives_ok(
  $$ select public.merge_clients(
       'a0000000-0000-0000-0000-000000000001',
       'a0000000-0000-0000-0000-000000000002', 'fusión de prueba') $$,
  'Dirección fusiona el cliente 1 en el 2'
);
select is(
  (select client_id::text from public.quotes where id = 'd0000000-0000-0000-0000-000000000001'),
  'a0000000-0000-0000-0000-000000000002',
  'El presupuesto quedó repuntado al cliente destino'
);
select is(
  (select status from public.clients where id = 'a0000000-0000-0000-0000-000000000001'),
  'merged',
  'El cliente origen quedó marcado como merged'
);

select * from finish();
rollback;
