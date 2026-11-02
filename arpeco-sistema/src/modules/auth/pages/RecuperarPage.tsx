import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/supabase/client'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Spinner } from '@/shared/ui/states'

/**
 * Página de retorno del link de recuperación de Supabase Auth. Al llegar por el
 * email, el cliente ya tiene una sesión de recuperación; aquí se fija la nueva
 * contraseña con updateUser. Ruta pública.
 */
export function RecuperarPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) {
      setError('No se pudo actualizar. Pedí un nuevo enlace de recuperación.')
      return
    }
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Nueva contraseña</CardTitle>
          <CardDescription>Ingresá tu nueva contraseña para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Nueva contraseña" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && (
              <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={saving}>
              {saving && <Spinner />}
              Guardar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
