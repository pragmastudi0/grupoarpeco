#!/usr/bin/env node
/**
 * Guardia de variables de entorno (B06, docs/08_DEPLOY_DEVOPS.md).
 *
 * Falla (exit 1) si:
 *  - Alguna variable VITE_* contiene una clave privilegiada (service_role):
 *    las VITE_* se empaquetan y son PÚBLICAS; jamás deben llevar secretos.
 *  - Las referencias Supabase de Preview y Production son iguales
 *    (Preview debe apuntar a staging, nunca a producción).
 *
 * Pensado para correr en CI. No imprime valores de secretos.
 */

let failed = false
const fail = (msg) => {
  console.error(`✖ ${msg}`)
  failed = true
}

/** ¿El string parece una clave privilegiada de Supabase? */
function looksPrivileged(value) {
  if (typeof value !== 'string' || value.length === 0) return false
  if (value.startsWith('sb_secret_')) return true
  // JWT con claim role=service_role
  const parts = value.split('.')
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
      if (payload?.role === 'service_role') return true
    } catch {
      /* no es JWT legible: se ignora */
    }
  }
  return false
}

for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith('VITE_') && looksPrivileged(value)) {
    fail(`La variable pública ${key} contiene una clave privilegiada (service_role).`)
  }
}

const previewRef = process.env.SUPABASE_PREVIEW_REF
const prodRef = process.env.SUPABASE_PROD_REF
if (previewRef && prodRef && previewRef === prodRef) {
  fail('SUPABASE_PREVIEW_REF es igual a SUPABASE_PROD_REF: Preview debe usar staging.')
}

if (failed) {
  console.error('\nGuardia de entorno: FALLÓ.')
  process.exit(1)
}
console.log('✓ Guardia de entorno: OK')
