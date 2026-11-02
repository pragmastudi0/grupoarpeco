import { expect, test } from '@playwright/test'

/**
 * Validación responsive: recorre las rutas en varios viewports, detecta overflow
 * horizontal a nivel documento y errores de consola, y saca capturas.
 * Requiere Supabase local + seed y el dev server (lo levanta playwright.config).
 */

const VIEWPORTS = [
  { name: '320', width: 320, height: 720 },
  { name: '375', width: 375, height: 812 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1920', width: 1920, height: 1080 },
]

const ROUTES = [
  '/',
  '/clientes',
  '/oportunidades',
  '/ferias',
  '/presupuestos',
  '/ventas',
  '/proyectos',
  '/reportes',
  '/usuarios',
  '/auditoria',
  '/configuracion',
]

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill('direccion@arpeco.test')
  await page.getByLabel('Contraseña').fill('password123')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('heading', { name: /Hola|Inicio/ })).toBeVisible()
}

for (const vp of VIEWPORTS) {
  test(`sin overflow horizontal @ ${vp.name}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    const consoleErrors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text())
    })
    await login(page)

    const offenders: string[] = []
    for (const route of ROUTES) {
      await page.goto(route)
      await page.waitForTimeout(250)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      )
      if (overflow) {
        const sw = await page.evaluate(() => document.documentElement.scrollWidth)
        offenders.push(`${route} (scrollW=${sw} > ${window ? '' : ''}${vp.width})`)
      }
    }

    // Capturas de inicio y de una tabla ancha (presupuestos).
    await page.goto('/')
    await page.screenshot({ path: `test-results/responsive/home-${vp.name}.png`, fullPage: true })
    await page.goto('/presupuestos')
    await page.waitForTimeout(250)
    await page.screenshot({
      path: `test-results/responsive/presupuestos-${vp.name}.png`,
      fullPage: true,
    })

    expect(offenders, `overflow en: ${offenders.join(', ')}`).toEqual([])
    // Errores de consola de red del entorno local no deben incluir errores de React.
    const reactErrors = consoleErrors.filter((e) => /React|is not|undefined|TypeError/.test(e))
    expect(reactErrors, `errores consola: ${reactErrors.join(' | ')}`).toEqual([])
  })
}

test('modales no exceden el viewport en 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await login(page)
  await page.goto('/clientes')
  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const box = await dialog.boundingBox()
  expect(box!.width).toBeLessThanOrEqual(320)
  expect(box!.height).toBeLessThanOrEqual(640)
})
