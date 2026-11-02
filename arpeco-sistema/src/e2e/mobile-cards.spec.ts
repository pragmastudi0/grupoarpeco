import { expect, test } from '@playwright/test'

/**
 * Valida la vista tipo tarjeta en mobile (<640px) y la tabla en desktop (≥640px)
 * para Clientes y Ventas, sin regresiones ni overflow.
 */

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill('direccion@arpeco.test')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /Hola|Inicio/ })).toBeVisible()
}

/** Asegura que exista al menos una venta aceptando el presupuesto enviado del seed. */
async function ensureSale(page: import('@playwright/test').Page) {
  await page.goto('/presupuestos/d0000000-0000-0000-0000-000000000001')
  await page.getByRole('button', { name: 'PDF' }).waitFor({ timeout: 10000 })
  // Ya confirmada: nada que hacer.
  if (
    await page
      .getByRole('link', { name: /Ver venta/ })
      .isVisible()
      .catch(() => false)
  )
    return
  const accept = page.getByRole('button', { name: 'Aceptar' })
  if (await accept.isVisible().catch(() => false)) await accept.click()
  const confirm = page.getByRole('button', { name: 'Confirmar venta' })
  await confirm.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click()
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar venta' }).click()
    await page.waitForURL('**/ventas/**')
  }
}

test('Clientes: tarjetas en mobile, tabla en desktop', async ({ page }) => {
  await login(page)

  // Mobile 375: tarjetas visibles, tabla oculta.
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/clientes')
  const cards = page.getByTestId('clientes-cards')
  await expect(cards.getByText('Industrias del Centro S.A.')).toBeVisible()
  await expect(page.locator('table')).toBeHidden()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )
  expect(overflow).toBe(false)
  // El tap navega al detalle.
  await cards.getByText('Industrias del Centro S.A.').click()
  await expect(page).toHaveURL(/\/clientes\/[0-9a-f-]+$/)

  // Desktop 1440: tabla visible.
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/clientes')
  await expect(page.locator('table')).toBeVisible()
})

test('Clientes: la búsqueda funciona en mobile', async ({ page }) => {
  await login(page)
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/clientes')
  const cards = page.getByTestId('clientes-cards')
  await page.getByLabel('Buscar clientes').fill('Metal')
  await expect(cards.getByText('Metalúrgica Andina S.A.')).toBeVisible()
  await expect(cards.getByText('Industrias del Centro S.A.')).toHaveCount(0)
})

test('Ventas: tarjetas en mobile, tabla en desktop', async ({ page }) => {
  await login(page)
  await ensureSale(page)

  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/ventas')
  const cards = page.getByTestId('ventas-cards')
  await expect(cards.getByText(/Pendiente/).first()).toBeVisible()
  await expect(page.locator('table')).toBeHidden()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )
  expect(overflow).toBe(false)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/ventas')
  await expect(page.locator('table')).toBeVisible()
})
