# Checklist obligatorio para producción

Responsables: Tech Lead verifica evidencia técnica; Dirección de Arpeco valida proceso/datos; Administración y Ventas firman UAT de sus flujos. Marcar fecha, responsable y enlace a evidencia por ítem antes de liberar.

- [ ] Alcance de v3, decisiones D01–D16 que afectan salida y criterios de aceptación aprobados; web comercial fuera del despliegue.
- [ ] Identidad Arpeco y texto de PDF validados; documento de 1 y 40 conceptos inspeccionado, sin información interna.
- [ ] Usuarios reales invitados, roles mínimos asignados, autorregistro deshabilitado, recuperación probada y bajas probadas con sesión activa.
- [ ] Matriz CRUD/RLS/GRANT verificada con D/A/V1/V2/E/S; soporte excepcional tiene aprobación y caducidad.
- [ ] Migraciones completas, reproducibles desde cero e incrementalmente; checks/FK/índices/RPC/auditoría probados; sin cambios remotos fuera de Git.
- [ ] Aceptación concurrente crea una sola venta/proyecto y fallo parcial revierte; reintentos de cobro/factura/costo idempotentes.
- [ ] Saldos, facturado, costos, márgenes y reportes conciliados contra detalle con ejemplos de cierre, anulación y datos faltantes.
- [ ] Todas las páginas funcionales 5–25 trazadas a implementación real; estados vacío, carga, error y responsive inspeccionados.
- [ ] CI verde: tipo, lint, unit, DB, seguridad, E2E y build; regresión relevante y revisión humana del diff.
- [ ] Objetivos de rendimiento medidos con volumen representativo, índices revisados, PDF dentro del límite definido.
- [ ] Staging aislado de producción; Preview usa sólo staging; secretos fuera del navegador; Auth redirects/domino correctos.
- [ ] Backup reciente verificado y restore ensayado en entorno aislado; RPO/RTO acordados, Storage respaldado si se usa.
- [ ] Manual breve por rol, capacitación y canal de incidencias listos; responsable de operación y mantenimiento designado.
- [ ] UAT firmado por Dirección, Administración, vendedor y Ejecución; defectos bloqueantes resueltos.
- [ ] Plan de migración/deploy compatible, rollback de app y recuperación DB documentados; ventana y responsables confirmados.
- [ ] Release/tag, commit, migraciones, comprobaciones posteriores y monitoreo inicial registrados.

Una casilla de seguridad o integridad económica sin evidencia bloquea go live. Si se libera con deuda menor aceptada, registrar alcance, impacto, responsable y fecha de corrección.
