import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copiá .env.example a .env y completá con las claves de `supabase start`.',
  )
}

/**
 * Cliente del navegador. Usa la clave ANÓNIMA (pública, sujeta a RLS).
 * La autorización real vive en la base (RLS/GRANT/RPC), no en este cliente.
 * Nunca usar aquí la service_role.
 */
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
