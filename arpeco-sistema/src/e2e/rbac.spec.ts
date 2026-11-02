import { expect, test } from '@playwright/test'

/** RBAC UI: Dirección/Superadmin ve las 3 pestañas, el relabel y puede crear un rol. */
test('Usuarios: pestañas, relabel y creación de rol', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('direccion@arpeco.test')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /Hola|Inicio/ })).toBeVisible()

  await page.getByRole('link', { name: 'Usuarios', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Roles y permisos' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Permisos individuales' })).toBeVisible()

  await page.getByRole('button', { name: 'Roles y permisos' }).click()
  // Relabel: el rol seller se muestra como "Comercial".
  await expect(page.getByText('Comercial', { exact: true }).first()).toBeVisible()

  // Crear un rol personalizado (código único para re-ejecución).
  const code = `e2e_${Date.now()}`
  await page.getByRole('button', { name: 'Nuevo rol' }).click()
  await page.getByLabel('Código').fill(code)
  await page.getByLabel('Nombre').fill('Rol E2E')
  await page.getByRole('button', { name: 'Crear' }).click()
  await expect(page.getByText('Rol E2E').first()).toBeVisible()
})
