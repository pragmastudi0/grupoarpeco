import { expect, test } from '@playwright/test'

/**
 * Humo/regresión (G01): Dirección recorre todos los módulos y cada uno carga
 * sin error. Verifica que las rutas, RLS y consultas funcionan de punta a punta.
 */

test('Dirección recorre todos los módulos', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('direccion@arpeco.test')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /Hola|Inicio/ })).toBeVisible()

  const sections: [string, RegExp][] = [
    ['Clientes', /Clientes/],
    ['Oportunidades', /Oportunidades/],
    ['Ferias', /Ferias/],
    ['Presupuestos', /Presupuestos/],
    ['Ventas y cobros', /Ventas y cobros/],
    ['Proyectos', /Proyectos/],
    ['Reportes', /Reportes/],
    ['Usuarios', /Usuarios/],
    ['Auditoría', /Auditoría/],
    ['Configuración', /Configuración/],
  ]

  for (const [link, heading] of sections) {
    await page.getByRole('link', { name: link, exact: true }).click()
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible()
  }
})

test('El reporte de negocio muestra KPIs para Dirección', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('direccion@arpeco.test')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await page.getByRole('link', { name: 'Reportes', exact: true }).click()
  await expect(page.getByText('Negocio')).toBeVisible()
  await expect(page.getByText('Presupuestado')).toBeVisible()
})
