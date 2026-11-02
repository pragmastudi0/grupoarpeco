# Roles, permisos y seguridad

Roles combinables: Dirección (D), Administración (A), Vendedor (V), Ejecución (E), Soporte (S). La unión de roles se permite, pero una concesión de soporte nunca amplía por sí sola visibilidad comercial. Un usuario inactivo falla todas las políticas. “Propio” = `owner_id = auth.uid()`; “asignado” = responsable de proyecto/feria; global = empresa. D puede operar o delegar según matriz. Borrado económico significa **anular con motivo**, nunca `DELETE`. Administración ve importes de venta/cobro/factura, pero no costos ni márgenes por defecto; decisión pendiente. V ve importes de sus presupuestos/ventas, no costos ni margen. E ve fechas, cliente y alcance operativo de proyectos asignados; importe de venta oculto por defecto.

## Matriz CRUD inicial

Leyenda: `C/R/U/X` crear/leer/editar/anular o archivar. `p` propio, `a` asignado, `g` global; `—` denegado. `X` requiere motivo y auditoría. La misma fila puede requerir operación RPC, no UPDATE directo.

| Entidad | D | A | V | E | S | Campos restringidos |
|---|---|---|---|---|---|---|
| Perfil propio | R/U nombre | R/U nombre | R/U nombre | R/U nombre | R/U nombre | roles/active sólo gestión |
| Usuarios, roles | C/R/U/X g | R g, C/U por delegación expresa | — | — | R técnico mínimo | invitación/desactivación en servidor auditado |
| Clientes/contacto principal | C/R/U/X g | C/R/U/X g | C/R/U p; R mínimo para deduplicar global | R a operativo | — | notas privadas administrativas fuera de proyección V/E |
| Ferias/participantes | C/R/U/X g | R g | C/R/U p o feria participante; X propia pendiente | R a fechas | — | edición global sólo D |
| Prospectos feria | C/R/U/X g | R g/U vínculo | C/R/U/X p | — | — | búsqueda duplicados global sólo datos mínimos |
| Oportunidades | C/R/U/X g | R g | C/R/U/X p | R a sólo título/fecha si proyecto vinculado | — | estimado comercial no E |
| Seguimientos | C/R/U/X g | R g | C/R/U/X p | — | — | historial append only, X anula |
| Presupuestos/ítems | C/R/U/X g | R g; U/X sólo autorización | C/R/U p borrador, enviar p, X borrador p | R a proyección operativa si aceptado | — | costo estimado, notas internas, margen sólo D y rol explícito adicional |
| PDF público | R g | R g | R p | — | — | lista blanca sin costo, margen ni notas internas |
| Ventas | R/X g | R g, X con autorización | R p | R a proyección operativa | — | A/V sin margen; E sin importe |
| Cobros | R g | C/R/X g | R p resumen de saldo, sin datos bancarios ajenos | — | — | V no ve medios/referencias sensibles |
| Facturas registradas | R g | C/R/X g | R p estado/total resumido si aprobado | — | — | adjuntos privados A/D |
| Proyectos | C vía venta/R/U/X g | R g | R p estado/fecha | R/U a estado y fecha | — | E sin monto/margen salvo permiso explícito |
| Costos reales | C/R/X g | — | — | C/R a sólo si autorización explícita | — | D ve margen; E ve costos de asignados sin ventas |
| Reporte negocio/rentabilidad | R g | R administrativo sin rentabilidad | — | — | — | vista separada por proyección |
| Reporte vendedores | R g | R g sólo actividad/ventas | R p individual | — | — | sin costo ni margen |
| Reporte ferias | R g | R g comercial | R p/ferias participantes | — | — | sin información de otros vendedores a V |
| Auditoría | R g | R de registros administrativos | — | — | R sólo con `support_access` vigente | before/after sensibles sólo D |
| Configuración operativa | R/U g | R/U identidad PDF si delegada | R pública | — | R técnica | secretos fuera DB |

No exponer tablas base con columnas sensibles a V/E: `REVOKE ALL ON ... FROM anon,authenticated`, luego `GRANT` por objeto/columna o exponer vistas `security_invoker` sin costo, margen, notas ni referencias. RLS filtra filas en tablas base y vistas; vistas de reportes con `security_invoker=true` o funciones invocadoras. Para mutaciones complejas, sólo `GRANT EXECUTE` de RPC precisa a `authenticated`, `REVOKE` para `PUBLIC/anon`; validar `auth.uid()`, `profiles.active` y rol dentro. `SECURITY DEFINER` únicamente en funciones mínimas, `search_path` fijo, referencias calificadas y pruebas de bypass. El service role sólo en servidor y nunca se usa para consultas ordinarias de usuarios.

## Política por patrón

- `profiles`: lectura de sí mismo y D; cambios de `active`/roles exclusivamente función privilegiada; impedir editar su propio rol o reactivarse.
- `clients`: D/A global, V propios; búsqueda de duplicado por RPC que devuelve coincidencias mínimas globales sin revelar cartera completa. Inserción atómica bajo índices únicos. Reasignación del propietario sólo D/A delegado mediante función auditada.
- `fair_prospects`, `opportunities`, `quotes`: D global, V propietario; A lectura de información necesaria. `WITH CHECK` protege `owner_id` para que V no se autoasigne un registro ajeno. Vinculaciones entre entidades se verifican en función/trigger.
- `sales`, `projects`: escritura de creación sólo RPC de aceptación; E ve asignados, V propios mediante proyecciones. Pagos/facturas sólo RPC A/D; costos RPC D o E habilitado.
- `audit_events`, `quote_revisions`: sin UPDATE/DELETE desde `authenticated`; inserción sólo trigger/función confiable. Protección de logs y retención por política documentada.

Invitación: sin autorregistro público; función de servidor identifica a D autorizado, crea invitación Supabase Auth, perfil inactivo/rol aprobado en una operación controlada y registra auditoría. Activación después de aceptar invitación. Recuperación mediante flujo Auth con URL permitida y rate limit. Cambio de rol exige D, razón y auditoría; cambios de alto privilegio requieren segunda aprobación humana definida en etapa 1. Baja: `active=false` primero, revocar refresh tokens/sesiones en Auth cuando sea posible, RLS bloquea tokens aún vigentes, reasignar cartera/proyectos con transacción y reporte de objetos pendientes. Soporte: cuenta técnica sin permisos comerciales normales; acceso excepcional temporal aprobado por D, motivo, caducidad, alcance y evento de cada lectura/escritura sensible. Alternativa preferida para incidentes: datos anonimizados de staging.

Pruebas pgTAP y cliente HTTP por cada rol: SELECT/INSERT/UPDATE/DELETE, columnas sensibles, RPC, cambio de `owner_id`, usuario inactivo, rol múltiple y revocación. Comparar GRANTs efectivos y políticas tras cada migración. Referencia oficial: [RLS y GRANTs Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [funciones seguras](https://supabase.com/docs/guides/database/functions).

## Entidades auxiliares y objetos de sistema

| Entidad | D | A | V | E | S | Regla |
|---|---|---|---|---|---|---|
| `roles` | R g | R g | R catálogo propio | R catálogo propio | R catálogo | seed técnico; sin C/U/X por UI |
| `user_roles` | C/R/U/X g mediante RPC | R g si delegada | R propio | R propio | R propio | cambios sólo función, sin autoasignación |
| `fair_staff` | C/R/U/X g | R g | R de ferias propias | R a calendario | — | participante no puede agregar roles a otro |
| `client_contacts` | C/R/U/X g | C/R/U/X g | C/R/U p | R a contacto operativo | — | principal único, cambios auditados |
| `quote_items` | C/R/U/X g sólo borrador/revisión | R g | C/R/U/X p sólo borrador/revisión | R a descripción aceptada | — | nunca se edita fila aceptada |
| `quote_revisions` | R g | R pública g | R pública p | — | — | C por función al enviar/revisar; sin U/X |
| `support_access` | C/R/X g con segunda aprobación | — | — | — | R propio | caducidad obligatoria, sin autoaprobación |
| `app_settings` | R/U g | R/U sólo claves delegadas | R pública | — | R técnica | C/X sólo migración; secretos fuera |
| `audit_events` | R g | R acotada | — | — | R temporal acotada | C por triggers/RPC; sin U/X |
| `document_sequences` | — | — | — | — | — | sólo función transaccional; no API pública |

`X` de `user_roles` revoca concesión, de `support_access` termina acceso; ninguna tabla auxiliar concede `DELETE` físico desde el navegador. Toda nueva tabla debe añadirse a esta matriz antes de migrarse. Los derechos de lectura de `roles` por usuarios ordinarios son únicamente etiquetas sin permisos efectivos detallados.
