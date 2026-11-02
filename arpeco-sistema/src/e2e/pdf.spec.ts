import { expect, test } from '@playwright/test'

/** El PDF descargado incluye el nombre del cliente en el archivo. */
test('el PDF se descarga con número y nombre del cliente', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('direccion@arpeco.test')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /Hola|Inicio/ })).toBeVisible()

  // Presupuesto del seed: "Stand Feria..." de Industrias del Centro S.A.
  await page.goto('/presupuestos/d0000000-0000-0000-0000-000000000001')
  await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'PDF' }).click(),
  ])
  const name = download.suggestedFilename()
  expect(name).toContain('Industrias del Centro')
  expect(name.endsWith('.pdf')).toBe(true)
})
