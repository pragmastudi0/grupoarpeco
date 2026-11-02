import { expect, test } from '@playwright/test'

/**
 * Plantillas de presupuestos + duplicar presupuesto (feat/presupuestos-plantillas).
 * Dirección tiene presupuestos.create y presupuestos.manage_templates, así que
 * puede crear plantillas, usarlas y duplicar presupuestos.
 */

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill('direccion@arpeco.test')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /Hola|Inicio/ })).toBeVisible()
}

test('crear plantilla con 2 conceptos y verla en la biblioteca', async ({ page }) => {
  await login(page)
  await page.getByRole('link', { name: 'Plantillas', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Plantillas de presupuestos/ })).toBeVisible()

  await page.getByRole('button', { name: 'Nueva plantilla' }).click()

  // Nombre único por corrida (el DB local es compartido entre specs).
  const nombre = `Plantilla E2E ${Date.now()}`
  await page.getByLabel('Nombre').fill(nombre)

  const editor = page.locator('table tbody')
  await page.getByRole('button', { name: 'Agregar concepto' }).click()
  await page.getByRole('button', { name: 'Agregar concepto' }).click()
  await expect(editor.locator('tr')).toHaveCount(2)

  const row0 = editor.locator('tr').nth(0).locator('input')
  await row0.nth(0).fill('Montaje de estructura')
  await row0.nth(1).fill('2')
  await row0.nth(2).fill('500000')

  const row1 = editor.locator('tr').nth(1).locator('input')
  await row1.nth(0).fill('Gráfica e impresión')
  await row1.nth(1).fill('1')
  await row1.nth(2).fill('300000')

  await page.getByRole('button', { name: 'Guardar plantilla' }).click()

  // Vuelve a la biblioteca y aparece con 2 conceptos.
  const item = page.getByRole('button', { name: new RegExp(nombre) })
  await expect(item).toBeVisible()
  await expect(item).toContainText('2')
})

test('nuevo presupuesto desde una plantilla copia los conceptos al editor', async ({ page }) => {
  await login(page)
  await page.getByRole('link', { name: 'Presupuestos', exact: true }).click()
  await page.getByRole('button', { name: 'Nuevo presupuesto' }).click()

  const dialog = page.getByRole('dialog')

  // Cliente (primer combobox del diálogo).
  await dialog.getByRole('combobox').first().click()
  await page.getByRole('option').first().click()

  // Único textbox del diálogo (cliente y plantilla son comboboxes).
  await dialog.getByRole('textbox').fill(`Desde plantilla ${Date.now()}`)

  // Plantilla del seed "Stand feria estándar".
  await dialog.getByRole('combobox').nth(1).click()
  await page.getByRole('option', { name: /Stand feria estándar/ }).click()

  await dialog.getByRole('button', { name: 'Crear y editar' }).click()

  // En el editor del presupuesto (borrador) los conceptos son inputs editables.
  await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible()
  const rows = page.locator('table tbody tr')
  await expect(rows.nth(0).locator('input').first()).toHaveValue('Estructura y montaje de stand')
  await expect(rows.nth(1).locator('input').first()).toHaveValue('Gráfica, impresión y vinilos')
})

test('duplicar un presupuesto crea un borrador con los mismos conceptos', async ({ page }) => {
  await login(page)

  // Presupuesto del seed con 3 conceptos.
  await page.goto('/presupuestos/d0000000-0000-0000-0000-000000000001')
  await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible()

  await page.getByRole('button', { name: 'Duplicar' }).click()

  // Navega a un presupuesto nuevo (otra URL) en estado Borrador, con los conceptos.
  await expect(page).not.toHaveURL(/d0000000-0000-0000-0000-000000000001$/)
  await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible()
  await expect(page.getByText('Borrador').first()).toBeVisible()
  const rows = page.locator('table tbody tr')
  await expect(rows.nth(0).locator('input').first()).toHaveValue('Estructura y montaje de stand')
})
