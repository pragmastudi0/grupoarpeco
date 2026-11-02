-- ============================================================================
-- Seed SÓLO para desarrollo local (docs/08_DEPLOY_DEVOPS.md: seeds ficticios
-- locales; prohibido en producción). Usuarios y datos de prueba.
-- Contraseña de todos: password123
-- ============================================================================

-- Permite que las actualizaciones de profiles.active pasen la guardia de columnas.
select set_config('app.admin_action', 'on', false);

-- ─── Usuarios de Auth (4 roles) ─────────────────────────────────────────────
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'direccion@arpeco.test',
   extensions.crypt('password123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Dirección Demo"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'admin@arpeco.test',
   extensions.crypt('password123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Administración Demo"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'vendedor@arpeco.test',
   extensions.crypt('password123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Vendedor Demo"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444',
   'authenticated', 'authenticated', 'ejecucion@arpeco.test',
   extensions.crypt('password123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Ejecución Demo"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555',
   'authenticated', 'authenticated', 'inactivo@arpeco.test',
   extensions.crypt('password123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"display_name":"Usuario Inactivo"}',
   now(), now(), '', '', '', '');

-- ─── Identidades email (requerido por GoTrue para login por contraseña) ──────
insert into auth.identities
  (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   '{"sub":"11111111-1111-1111-1111-111111111111","email":"direccion@arpeco.test"}',
   'email', '11111111-1111-1111-1111-111111111111', now(), now(), now()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222',
   '{"sub":"22222222-2222-2222-2222-222222222222","email":"admin@arpeco.test"}',
   'email', '22222222-2222-2222-2222-222222222222', now(), now(), now()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333',
   '{"sub":"33333333-3333-3333-3333-333333333333","email":"vendedor@arpeco.test"}',
   'email', '33333333-3333-3333-3333-333333333333', now(), now(), now()),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444',
   '{"sub":"44444444-4444-4444-4444-444444444444","email":"ejecucion@arpeco.test"}',
   'email', '44444444-4444-4444-4444-444444444444', now(), now(), now()),
  (gen_random_uuid(), '55555555-5555-5555-5555-555555555555',
   '{"sub":"55555555-5555-5555-5555-555555555555","email":"inactivo@arpeco.test"}',
   'email', '55555555-5555-5555-5555-555555555555', now(), now(), now());

-- ─── Activación de perfiles (el trigger ya creó las filas inactivas) ─────────
update public.profiles set active = true, activated_at = now()
where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);
-- El usuario 5555 queda inactivo a propósito (prueba de bloqueo con sesión viva).

-- ─── Asignación de roles ────────────────────────────────────────────────────
insert into public.user_roles (user_id, role_code, granted_by) values
  ('11111111-1111-1111-1111-111111111111', 'direction',      '11111111-1111-1111-1111-111111111111'),
  ('11111111-1111-1111-1111-111111111111', 'superadmin',     '11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222', 'administration', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', 'seller',         '11111111-1111-1111-1111-111111111111'),
  ('44444444-4444-4444-4444-444444444444', 'execution',      '11111111-1111-1111-1111-111111111111');

-- ─── Configuración pública inicial (identidad del PDF, D08 — a validar) ──────
insert into public.app_settings (key, value) values
  ('pdf_identity', '{"business_name":"Grupo Arpeco","note":"Datos a validar con Arpeco (D08)"}')
on conflict (key) do nothing;

select set_config('app.admin_action', 'off', false);

-- ─── Datos comerciales de ejemplo (Etapa 2) ─────────────────────────────────
-- Clientes del vendedor (3333) y uno de administración (2222).
insert into public.clients (id, legal_name, tax_id, phone, email, owner_id) values
  ('a0000000-0000-0000-0000-000000000001', 'Industrias del Centro S.A.', '30-71234567-8',
   '+54 351 555-0100', 'compras@industriasdelcentro.test', '33333333-3333-3333-3333-333333333333'),
  ('a0000000-0000-0000-0000-000000000002', 'Constructora Sur SRL', '30-70987654-3',
   '+54 351 555-0200', 'info@constructorasur.test', '33333333-3333-3333-3333-333333333333'),
  ('a0000000-0000-0000-0000-000000000003', 'Metalúrgica Andina S.A.', '30-65432109-1',
   '+54 351 555-0300', 'ventas@metalurgicaandina.test', '22222222-2222-2222-2222-222222222222');

insert into public.client_contacts (client_id, name, phone, email, is_primary) values
  ('a0000000-0000-0000-0000-000000000001', 'Laura Gómez', '+54 351 555-0101', 'laura@industriasdelcentro.test', true);

insert into public.fairs (id, name, place, starts_on, ends_on) values
  ('f0000000-0000-0000-0000-000000000001', 'Feria de la Construcción 2026', 'Córdoba Capital',
   '2026-08-12', '2026-08-15');

insert into public.fair_staff (fair_id, user_id) values
  ('f0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333');

insert into public.fair_prospects (id, fair_id, client_id, company_name, contact_name, owner_id) values
  ('b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001', 'Industrias del Centro S.A.', 'Laura Gómez',
   '33333333-3333-3333-3333-333333333333'),
  ('b0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001',
   null, 'Prefabricados del Norte', 'Juan Pérez', '33333333-3333-3333-3333-333333333333');

insert into public.opportunities (id, client_id, origin_fair_id, title, owner_id, stage, estimated_amount) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000001', 'Stand Feria de la Construcción 2026',
   '33333333-3333-3333-3333-333333333333', 'negotiation', 12000000.00),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
   null, 'Cartelería obra Nueva Córdoba', '33333333-3333-3333-3333-333333333333', 'new', 3500000.00);

insert into public.followups (opportunity_id, kind, summary, next_on, owner_id) values
  ('c0000000-0000-0000-0000-000000000001', 'llamada', 'Repasamos alcance del stand; esperan maqueta.',
   '2026-11-05', '33333333-3333-3333-3333-333333333333');

-- ─── Presupuestos de ejemplo (Etapa 3) ──────────────────────────────────────
insert into public.quotes
  (id, client_id, opportunity_id, origin_fair_id, owner_id, title, status, estimated_cost, issued_on, sent_at, public_notes)
values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
   '33333333-3333-3333-3333-333333333333', 'Stand Feria de la Construcción 2026', 'sent',
   7800000.00, '2026-08-20', now(), 'Validez 30 días. No incluye traslados fuera de Córdoba Capital.'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
   null, null, '33333333-3333-3333-3333-333333333333', 'Cartelería obra Nueva Córdoba', 'draft',
   null, null, null, null);

insert into public.quote_items (quote_id, position, description, quantity, unit_price) values
  ('d0000000-0000-0000-0000-000000000001', 1, 'Estructura y montaje de stand', 1, 7000000),
  ('d0000000-0000-0000-0000-000000000001', 2, 'Gráfica, impresión y vinilos', 1, 3000000),
  ('d0000000-0000-0000-0000-000000000001', 3, 'Iluminación y mobiliario', 1, 2000000),
  ('d0000000-0000-0000-0000-000000000002', 1, 'Cartel frontal iluminado', 2, 750000),
  ('d0000000-0000-0000-0000-000000000002', 2, 'Señalética interior', 4, 500000);

-- ─── Plantilla de presupuesto de ejemplo ─────────────────────────────────────
insert into public.quote_templates (id, name, description) values
  ('e1000000-0000-0000-0000-000000000001', 'Stand feria estándar', 'Base para stands de feria');
insert into public.quote_template_items (template_id, position, description, quantity, unit_price) values
  ('e1000000-0000-0000-0000-000000000001', 1, 'Estructura y montaje de stand', 1, 7000000),
  ('e1000000-0000-0000-0000-000000000001', 2, 'Gráfica, impresión y vinilos', 1, 3000000),
  ('e1000000-0000-0000-0000-000000000001', 3, 'Iluminación y mobiliario', 1, 2000000);
