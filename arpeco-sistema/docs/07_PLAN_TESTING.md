# Plan de pruebas

Pirámide práctica: Vitest/Testing Library para cálculo de presentación, esquemas y estados; pgTAP + SQL/HTTP local para integridad, RLS, GRANT y RPC (autoridad); Playwright para recorridos por rol. CI ejecuta tipo/lint, tests unitarios, Supabase local + migraciones desde cero y tests DB, E2E con seeds ficticios. En PR de migración, comparar permisos efectivos anteriores/nuevos y probar migración incremental con copia sanitizada. Pruebas manuales de PDF, UX móvil, UAT y recuperación. No se cuenta test de `fuente/` como prueba de aplicación.

| Riesgo | Prueba automática obligatoria | Control manual |
|---|---|---|
| Dos altas del mismo cliente | barrera de concurrencia en dos transacciones; una inserta, otra recibe conflicto y referencia reutilizable; CUIT/name_key únicos | revisar homónimos reales |
| V lee/edita registro ajeno | HTTP con JWT V1/V2: SELECT vacío/403 y UPDATE/DELETE 0; columna interna inaccesible incluso por REST/RPC | revisar navegación y mensajes |
| V lee costo del presupuesto | consulta directa, filtros y PDF; schema no concede SELECT ni función filtra | inspeccionar PDF y respuesta de red |
| Aceptación doble y fallo parcial | llamadas paralelas y reintento con misma revisión: una venta/proyecto; excepción inyectada entre inserts revierte ambos | revisar auditoría |
| Cobro/factura/costo repetidos | mismo idempotency_key produce un hecho; otra clave con referencia sospechosa avisa | conciliación con comprobantes |
| PDF ajeno o desactualizado | JWT ajeno 403; hash/revisión coincide; 1/40 conceptos; regex ausente costo/margen/notas | abrir/imprimir A4 y verificar logo/datos |
| Costos faltantes | `estimated_cost null` → sin estimado; `costs_complete_at null` → provisional; alta posterior reabre | dirección aprueba cierre |
| Prospecto duplicado en feria | dos inserts concurrentes mismo `name_key`, un único registro | revisar casos similares con distinta grafía |
| Anulación económica | evento original permanece, motivo/actor y suma neta correctos; venta anulada no cuenta | reconciliar cierre mensual |
| Gráfico distinto del detalle | mismo filtro/corte, suma filas = KPI; test de contratos de consulta | comparación de muestra UAT |
| Usuario desactivado | sesión JWT anterior no accede a tabla/RPC; invitación/recuperación no reactiva | comprobar logout UI |
| Migración altera permisos | snapshot `information_schema`/`pg_catalog` y pgTAP matriz rol × entidad × operación | revisión SQL humana |

## Cobertura funcional por etapa

0: revisión cruzada de 21 páginas funcionales y acuerdos. 1: Auth/RLS/entornos y accesibilidad base. 2: cliente, CRM, feria, duplicado, relaciones y filtros. 3: cálculo decimal, transiciones, revisiones, PDF público. 4: transacción y concurrencia, saldos y facturación independiente. 5: costos y cierre. 6: fórmulas, cortes temporales, permisos y rendimiento. 7: regresión transversal, seguridad, restauración y UAT. Cada etapa exige prueba de éxito, denegación, dato inválido y estado vacío/carga/error.

## Datos y herramientas

Seeds sólo ficticios, con dos vendedores, dirección, administración, ejecución, cliente duplicable, prospecto sin cliente, presupuesto sin oportunidad/costo, venta con varios cobros/facturas, proyecto incompleto, feria repetida y usuarios inactivos. Crear fixtures por fábrica con IDs estables para pruebas; no usar datos reales en CI. `pgTAP`/SQL confirma checks/FK/políticas; Vitest property tests opcionales para sumas/decimal; Playwright usa roles autenticados separados y red lenta. Corridas de estrés pequeñas para aceptación e idempotencia con barrera sincronizada. Medir P75/P95 según arquitectura con dataset representativo; `EXPLAIN (ANALYZE, BUFFERS)` para reportes y listados. El umbral de cobertura de líneas no reemplaza casos críticos.

Criterio de aprobación: CI verde, pruebas críticas anteriores ejecutadas, revisión de diff SQL y permisos, evidencia de flujo E2E, fórmulas conciliadas, fallos conocidos documentados con severidad y decisión explícita. Defecto de fuga de datos, doble venta o saldo incorrecto bloquea entrega. Pruebas de presentación estática no sustituyen esto.
