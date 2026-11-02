# Grupo Arpeco — Monorepo

Dos proyectos en un solo repositorio:

| Carpeta | Qué es | Stack | Deploy |
|---|---|---|---|
| [`arpeco-web/`](arpeco-web/) | Sitio público de Grupo Arpeco | HTML estático (generado con `scripts/build_site.py`) | Vercel (static) |
| [`arpeco-sistema/`](arpeco-sistema/) | CRM interno (clientes, oportunidades, ferias) | React + Vite + Supabase | Vercel (Vite + funciones `/api`) |

## Integración web → CRM

El formulario de presupuestos del sitio (`arpeco-web/site/contacto.html`) envía la
consulta al endpoint `arpeco-sistema/api/lead-web.ts`, que la registra en el CRM como
una **Oportunidad "Nueva"** marcada `source='web'` (pendiente de contactar). Ver el
plan de integración y las variables de entorno en `arpeco-sistema/.env.example`.

## Deploy en Vercel (dos proyectos, un repo)

Vercel soporta varios proyectos sobre el mismo repo; cada uno apunta a una subcarpeta
con su **Root Directory**. Hay que crear/ajustar **dos** proyectos:

### 1. Sitio web
- **Root Directory:** `arpeco-web`
- Framework Preset: **Other** (estático). Lo define `arpeco-web/vercel.json`
  (`framework: null`, `outputDirectory: "site"`, sin build).
- Sin variables de entorno.

### 2. CRM (sistema)
- **Root Directory:** `arpeco-sistema`
- Framework: **Vite**. Lo define `arpeco-sistema/vercel.json`
  (`buildCommand: "pnpm build"`, `outputDirectory: "dist"`, rewrites que excluyen `/api`).
- Variables de entorno (ver `arpeco-sistema/.env.example`):
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `APP_ORIGIN`, `INBOUND_OWNER_ID`, `WEB_ORIGIN`.

> Importante: antes había un solo proyecto Vercel sirviendo la web desde la raíz.
> Al pasar a monorepo, ese proyecto debe cambiar su **Root Directory a `arpeco-web`**,
> o el deploy de la web se rompe.

Tras desplegar el CRM, reemplazar en `arpeco-web/site/js/main.js` el placeholder
`https://TU-CRM.vercel.app/api/lead-web` por la URL pública real del CRM.
