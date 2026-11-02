import { expect, test } from '@playwright/test'

/**
 * Flujo separado: Aceptar deja el presupuesto en "Aceptado" (sin venta) y muestra
 * "Confirmar venta"; confirmar crea la venta y navega. Usa el borrador del seed
 * (P-2026-0002) para no depender de otros specs. Asume DB reseteada.
 */
test('Aceptar no crea venta; Confirmar venta sí', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('direccion@arpeco.test')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /Hola|Inicio/ })).toBeVisible()

  await page.goto('/presupuestos/d0000000-0000-0000-0000-000000000002')
  await page.getByRole('button', { name: 'PDF' }).waitFor({ timeout: 10000 }) // ficha cargada

  // Borrador → enviar (el botón se habilita cuando cargan los ítems).
  const enviar = page.getByRole('button', { name: 'Enviar' })
  if (await enviar.isVisible().catch(() => false)) {
    await expect(enviar).toBeEnabled()
    await enviar.click()
  }

  // Enviado → aceptar.
  const aceptar = page.getByRole('button', { name: 'Aceptar' })
  await aceptar.waitFor({ state: 'visible', timeout: 12000 })
  await aceptar.click()

  // Aceptado: aparece "Confirmar venta" (todavía NO hay venta → no "Ver venta").
  await expect(page.getByRole('button', { name: 'Confirmar venta' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver venta/ })).toHaveCount(0)

  // Confirmar venta → modal → navega a la venta.
  await page.getByRole('button', { name: 'Confirmar venta' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar venta' }).click()
  await page.waitForURL('**/ventas/**')
  await expect(page.getByRole('heading', { name: /Venta/ })).toBeVisible()
})
