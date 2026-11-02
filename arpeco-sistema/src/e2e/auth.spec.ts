import { expect, test } from '@playwright/test'

/**
 * Verifica el flujo de acceso por rol (C09): Dirección ve "Usuarios",
 * el Vendedor no, y el usuario inactivo queda bloqueado aunque autentique.
 * Usa los usuarios del seed local (contraseña: password123).
 */

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Ingresar' }).click()
}

test('Dirección ve el módulo Usuarios', async ({ page }) => {
  await login(page, 'direccion@arpeco.test')
  await expect(page.getByRole('heading', { name: /Hola|Inicio/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Usuarios' })).toBeVisible()
})

test('Vendedor no ve el módulo Usuarios', async ({ page }) => {
  await login(page, 'vendedor@arpeco.test')
  await expect(page.getByRole('heading', { name: /Hola|Inicio/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Usuarios' })).toHaveCount(0)
})

test('Usuario inactivo queda bloqueado', async ({ page }) => {
  await login(page, 'inactivo@arpeco.test')
  await expect(page.getByText('Cuenta sin acceso')).toBeVisible()
})
