-- pgTAP · RLS de Clientes/CRM/Ferias (C01–C08)
-- Seed: 3333 (Vendedor) posee clientes 1 y 2; 2222 (Administración) posee el 3.
begin;
select plan(10);

set local role authenticated;

-- ── Vendedor: sólo su cartera ────────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select is((select count(*)::int from public.clients), 2, 'Vendedor ve sólo sus 2 clientes');
select is((select count(*)::int from public.opportunities), 2, 'Vendedor ve sus 2 oportunidades');

-- No puede crear un cliente a nombre de otro (WITH CHECK protege owner_id)
select throws_ok(
  $$ insert into public.clients (legal_name, owner_id)
     values ('Trucho SA', '22222222-2222-2222-2222-222222222222') $$,
  null, null,
  'Vendedor no puede crear cliente con owner ajeno'
);
-- Sí puede crear uno propio
select lives_ok(
  $$ insert into public.clients (legal_name, owner_id)
     values ('Cliente Propio Test', '33333333-3333-3333-3333-333333333333') $$,
  'Vendedor crea cliente propio'
);
-- No puede reasignar su cliente a otro por UPDATE directo
select throws_ok(
  $$ update public.clients set owner_id = '22222222-2222-2222-2222-222222222222'
     where id = 'a0000000-0000-0000-0000-000000000001' $$,
  null, null,
  'Vendedor no puede cambiar el owner de su cliente'
);
-- No puede fusionar clientes (sólo D/A)
select throws_ok(
  $$ select public.merge_clients('a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','x') $$,
  null, null,
  'Vendedor no autorizado a merge_clients'
);
-- Dedup global: encuentra el cliente de Administración aunque no sea su cartera
select ok(
  (select count(*) from public.search_clients_min('Metalúrgica')) >= 1,
  'Dedup global encuentra clientes de otra cartera (datos mínimos)'
);
-- No puede crear oportunidad a nombre de otro
select throws_ok(
  $$ insert into public.opportunities (client_id, title, owner_id)
     values ('a0000000-0000-0000-0000-000000000001','Trucho','22222222-2222-2222-2222-222222222222') $$,
  null, null,
  'Vendedor no puede crear oportunidad con owner ajeno'
);
-- Sí crea oportunidad propia sobre su cliente
select lives_ok(
  $$ insert into public.opportunities (client_id, title, owner_id)
     values ('a0000000-0000-0000-0000-000000000001','Nueva oportunidad','33333333-3333-3333-3333-333333333333') $$,
  'Vendedor crea oportunidad propia'
);

-- ── Administración: visibilidad global ───────────────────────────────────────
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok(
  (select count(*) from public.clients) >= 3,
  'Administración ve todos los clientes (global)'
);

select * from finish();
rollback;
