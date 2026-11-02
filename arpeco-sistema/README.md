# Sistema Grupo Arpeco

Aplicación de **Gestión Comercial y Proyectos** de Grupo Arpeco. Este repositorio
es el sistema real; el diseño y la propuesta viven en `docs/` (copiados de la
carpeta de propuesta) y en `docs/prototipo_mvp_arpeco.html` (referencia visual).

Estado: **Etapa 1 — Base segura** (autenticación por invitación, roles y permisos
con RLS, auditoría, CI/deploy). Los módulos comerciales llegan en etapas 2+ según
`docs/05_ROADMAP.md`.

## Stack

React 19 · Vite 8 · TypeScript · Tailwind 4 · shadcn-style UI · React Router 7 ·
TanStack Query 5 · React Hook Form + Zod · Supabase (Auth/Postgres/RLS) ·
Vitest + Testing Library · Playwright · pgTAP.

## Requisitos

- Node 22.12+ (ver `.nvmrc`), pnpm
- Docker (para Supabase local)
- Supabase CLI

## Puesta en marcha

```bash
pnpm install
cp .env.example .env            # completar con las claves de `supabase start`
pnpm db:start                   # levanta Postgres/Auth/etc. en Docker
pnpm db:reset                   # aplica migraciones + seed de prueba
pnpm db:types                   # regenera src/shared/supabase/database.types.ts
pnpm dev                        # http://localhost:5173
```

Puertos locales de este proyecto (para no chocar con otros Supabase): API `54521`,
DB `54522`, Studio `54523`, Mailpit `54524`.

### Usuarios de prueba (seed local, contraseña `password123`)

| Email                   | Rol                            |
| ----------------------- | ------------------------------ |
| `direccion@arpeco.test` | Dirección                      |
| `admin@arpeco.test`     | Administración                 |
| `vendedor@arpeco.test`  | Vendedor                       |
| `ejecucion@arpeco.test` | Ejecución                      |
| `inactivo@arpeco.test`  | (inactivo — prueba de bloqueo) |

## Scripts

| Comando                                              | Qué hace                                           |
| ---------------------------------------------------- | -------------------------------------------------- |
| `pnpm dev` / `pnpm build`                            | Desarrollo / build de producción                   |
| `pnpm lint` / `pnpm format` / `pnpm typecheck`       | Calidad de código                                  |
| `pnpm test`                                          | Unit tests (Vitest)                                |
| `pnpm test:e2e`                                      | E2E (Playwright, requiere Supabase local + seed)   |
| `pnpm db:start` / `db:stop` / `db:reset` / `db:test` | Supabase local y pgTAP                             |
| `pnpm check:env`                                     | Guardia: ninguna `VITE_*` lleva clave privilegiada |

## Estructura

```
src/app/        shell, rutas, providers, error boundary
src/shared/     UI, utils (dinero/fecha), cliente Supabase, tipos, auth helpers
src/modules/    auth, admin, dashboard, clients, crm, fairs, quotes, sales, projects, reports
api/            funciones de servidor Vercel (invitaciones; el PDF se genera en el cliente)
supabase/       migrations, seed.sql, tests pgTAP
src/e2e/        Playwright
docs/           diseño + OPERACION_GO_LIVE.md
```

## Despliegue online (GitHub · Supabase · Vercel)

Pasos para publicar. Hacen falta cuentas en GitHub, Supabase y Vercel.

### 1) GitHub

```bash
git remote add origin https://github.com/<tu-usuario>/arpeco-sistema.git
git push -u origin main
```

### 2) Supabase (nube)

1. En el dashboard de Supabase, **New project** (anotá la DB password; elegí la
   región más cercana a Argentina, p. ej. `South America (São Paulo)` o `East US`).
2. Vinculá y aplicá las migraciones desde este repo:
   ```bash
   supabase link --project-ref <project-ref>
   supabase db push          # aplica supabase/migrations (NO corre seed.sql)
   ```
   El seed con usuarios de prueba es **sólo local**: producción queda sin datos ficticios.
3. En **Settings → API** copiá el **Project URL** y la **anon public key**.
4. **Primer usuario Dirección** (el sistema no tiene autorregistro):
   - **Authentication → Add user** → email + contraseña, con el email confirmado.
     El trigger crea su perfil **inactivo** automáticamente.
   - En **SQL Editor**, activalo y dale el rol (reemplazá `<UID>` por el id del usuario):
     ```sql
     update public.profiles set active = true where id = '<UID>';
     insert into public.user_roles (user_id, role_code, granted_by)
     values ('<UID>', 'direction', '<UID>');
     ```
   - Desde ese usuario ya podés invitar al resto (función `api/invite`) y asignar roles.

### 3) Vercel

1. **Import Project** desde el repo de GitHub. `vercel.json` ya define build
   (`pnpm build`), salida (`dist`), framework Vite y el rewrite SPA que excluye `/api/`.
2. **Environment Variables** (en Production y Preview) — públicas del cliente:
   | Variable                 | Valor                   |
   | ------------------------ | ----------------------- |
   | `VITE_SUPABASE_URL`      | Project URL de Supabase |
   | `VITE_SUPABASE_ANON_KEY` | anon public key         |
3. Variables de la función de invitaciones `api/invite` (**sin** prefijo `VITE_`,
   nunca en el bundle del cliente):
   | Variable                    | Valor                                                      |
   | --------------------------- | ---------------------------------------------------------- |
   | `SUPABASE_URL`              | Project URL                                                |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (secreta)                                 |
   | `APP_ORIGIN`                | URL pública del sitio (p. ej. `https://arpeco.vercel.app`) |
4. En Supabase, **Authentication → URL Configuration**: agregá la URL de Vercel a
   _Site URL_ y _Redirect URLs_ para que funcionen el login por invitación y la recuperación.

> **Seguridad:** la `service_role` jamás va en una variable `VITE_*` (se empaquetan
> y son públicas). El check `pnpm check:env` falla en CI si eso ocurre. Si usás un
> 2º proyecto Supabase para staging, Preview debe apuntar a staging y Production a
> producción. Las migraciones se aplican sólo con `supabase db push` versionado,
> nunca editando SQL a mano. Ver `docs/OPERACION_GO_LIVE.md`.

## Seguridad (resumen)

La base es la fuente única de autorización: RLS en cada tabla, `REVOKE/GRANT`
explícitos, y mutaciones sensibles sólo por RPC auditadas (`grant_role`,
`revoke_role`, `set_user_active`). `anon` siempre denegado; un usuario inactivo
falla todas las políticas aunque tenga sesión. El `service_role` vive sólo en
funciones de servidor (`api/`), nunca en el cliente. Ver `docs/04_ROLES_PERMISOS.md`.
