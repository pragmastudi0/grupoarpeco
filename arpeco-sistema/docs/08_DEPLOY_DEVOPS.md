# GitHub, Supabase y Vercel

## GitHub y flujo

Para equipo pequeño: `main` protegida como producción, `feat/*` y `fix/*` cortas con PR; **no mantener `develop` permanente al inicio**, pues duplica merges y puede divergir sin un equipo de integración dedicado. Staging se despliega desde `main` o rama de release temporal con base aislada y se promociona el mismo commit a producción. Si el equipo crece y necesita integrar varias funciones antes de liberar, introducir `develop` con reglas claras. Un PR por tarea/contrato, al menos una revisión técnica (dos para RLS/economía), checks obligatorios de tipos, lint, unit, DB, E2E crítico, build y secret scan. Commits `feat:`, `fix:`, `docs:`, `db:`; tags `vMAJOR.MINOR.PATCH` y changelog con migraciones. Hotfix desde tag de producción, probar staging, PR a main, tag patch.

## Supabase

Tres entornos aislados: CLI local, proyecto staging, proyecto producción. Branching si costo disponible; si no, proyectos distintos con mismo historial de migraciones. Nunca restaurar datos de producción sin anonimizar a staging. `supabase/migrations/YYYYMMDDHHMMSS_name.sql`: esquema, checks, índices, RLS, políticas, `REVOKE/GRANT`, funciones y pruebas en PR. `supabase db reset` sólo local; prohibido sobre producción. Remoto cambia exclusivamente mediante migraciones versionadas, sin SQL Editor manual. Un ejecutor serial aplica migraciones; registrar versión aplicada y resultado. Usar cambios expand/contract para renombrar/eliminar columnas: añadir nuevo campo compatible, desplegar app que lee/escribe transición, migrar datos con respaldo, retirar después. Migración destructiva requiere copia, script reversible cuando sea posible y plan de restauración.

Backups: confirmar plan contratado. Supabase documenta backups diarios en planes pagos y `db dump` para backup lógico; objetos Storage no están incluidos en backup de DB, por lo que adjuntos necesitan respaldo propio. Definir RPO/RTO con Arpeco; propuesta inicial RPO ≤24 h y RTO ≤8 h, **sujeta a plan/costo y ensayo**. Probar restauración en proyecto aislado antes de go live y periódicamente. PITR si la pérdida potencial de un día es inaceptable. Referencias: [migraciones](https://supabase.com/docs/guides/deployment/database-migrations), [backups](https://supabase.com/docs/guides/platform/backups).

## Vercel

Proyecto Vercel con Production conectado a `main` y Preview a ramas; Preview siempre con URL/anon key de staging. Definir `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` por entorno (son públicas y sujetas a RLS); secretos de invitación/PDF sólo en variables de función sin prefijo `VITE_`. Si se requiere `service_role`, sólo en función de invitación, con validación del actor y permisos mínimos de operación; evitar para PDF ordinario. CI comprueba que referencias Supabase Preview/Production son diferentes y que ningún `VITE_*` contiene clave privilegiada. Dominios, URL de Auth y redirects restringidos a orígenes autorizados; protección de previews con acceso equipo si contienen datos staging. Build en Vercel después de checks; logs sin tokens. Referencia: [entornos Vercel](https://vercel.com/docs/deployments/environments), [variables](https://vercel.com/docs/environment-variables).

## Publicación y recuperación

1. Seleccionar tag/commit y revisar diff de aplicación/migración, decisiones pendientes, backups recientes y estado staging.
2. Ejecutar migraciones compatibles en staging; correr permisos/integridad/E2E/smoke y probar datos representativos.
3. Capturar backup producción y confirmar restaurabilidad; anunciar ventana si el cambio lo requiere.
4. Aplicar migración expand compatible a producción por un ejecutor, verificar versión, grants/RLS y consultas básicas.
5. Promover el mismo commit probado a Vercel Production; smoke por D/A/V/E, PDF, aceptación en entorno de prueba **sin crear operación real ficticia en producción**; monitorear errores/latencia.
6. Registrar release/tag, hora, migraciones, responsable, evidencias y enlaces a logs.

Rollback de app: redeploy del commit anterior sólo si migración es compatible. Si la base cambió de manera no reversible, usar procedimiento de recuperación ensayado y reconciliar hechos creados después del backup; nunca ejecutar reset. Fallo de migración: detener deploy, diagnosticar, aplicar migración correctiva versionada o restaurar con ventana y comunicación. No editar producción a mano para “arreglar rápido”.
