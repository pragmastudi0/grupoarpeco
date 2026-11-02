import { expect, test } from '@playwright/test'

/**
 * Valida la sección Rentabilidad: sin costos completos el margen es "—" (no 100%
 * ficticio), sin overflow en mobile ni desktop. El cálculo con base completa se
 * cubre en pgTAP 09. Asume DB recién reseteada (venta del seed sin costos).
 */

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill('direccion@arpeco.test')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /Hola|Inicio/ })).toBeVisible()
}

test('Rentabilidad sin costos completos muestra "—", no 100%', async ({ page }) => {
  await login(page)
  // Asegura una venta grande (12M) SIN costos: aceptar + confirmar venta.
  await page.goto('/presupuestos/d0000000-0000-0000-0000-000000000001')
  await page.getByRole('button', { name: 'PDF' }).waitFor({ timeout: 10000 })
  if (
    !(await page
      .getByRole('link', { name: /Ver venta/ })
      .isVisible()
      .catch(() => false))
  ) {
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

  await page.goto('/reportes')
  const renta = page.getByTestId('rentabilidad')
  await expect(renta).toBeVisible()
  // Monto grande en formato compacto (sin desbordar): "$<n> M".
  await expect(renta.getByText(/\$[\d.,]+\s*M/).first()).toBeVisible()
  // No debe haber un margen 100% ficticio: con 12M vendidos y 0 costos cerrados,
  // la ganancia/margen deben ser "—".
  await expect(renta.getByText('100%')).toHaveCount(0)
  await expect(page.getByText(/rentabilidad no está disponible/i)).toBeVisible()

  // Sin overflow en mobile y desktop.
  for (const w of [320, 375, 1440]) {
    await page.setViewportSize({ width: w, height: 900 })
    await page.waitForTimeout(150)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    )
    expect(overflow, `overflow @ ${w}px`).toBe(false)
  }

  await page.setViewportSize({ width: 375, height: 900 })
  await renta.screenshot({ path: 'test-results/responsive/rentabilidad-375.png' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await renta.screenshot({ path: 'test-results/responsive/rentabilidad-1440.png' })
})
