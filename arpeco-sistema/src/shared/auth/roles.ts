/**
 * Catálogo de roles (seed fijo en la base, ver docs/03_MODELO_DATOS.md y
 * docs/04_ROLES_PERMISOS.md). Roles combinables; soporte nunca amplía por sí
 * solo la visibilidad comercial.
 */
export const ROLES = {
  direction: 'direction',
  administration: 'administration',
  seller: 'seller',
  execution: 'execution',
  support: 'support',
  superadmin: 'superadmin',
} as const

export type RoleCode = (typeof ROLES)[keyof typeof ROLES]

// Etiquetas de los roles de sistema (relabel: Comercial/Proyectos). Los roles
// personalizados traen su label desde la base.
export const ROLE_LABELS: Record<RoleCode, string> = {
  direction: 'Dirección',
  administration: 'Administración',
  seller: 'Comercial',
  execution: 'Proyectos',
  support: 'Soporte',
  superadmin: 'Superadministrador',
}
