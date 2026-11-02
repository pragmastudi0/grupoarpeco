import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '@/shared/supabase/client'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Spinner } from '@/shared/ui/states'
import { useAuth } from '../useAuth'
import { loginSchema, type LoginInput } from '../schemas'

export function LoginPage() {
  const { signIn, isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)
  const [recoveryMsg, setRecoveryMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (!loading && isAuthenticated) {
    const to = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={to} replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await signIn(values.email, values.password)
    } catch {
      // Mensaje genérico: no revelar si el email existe.
      setFormError('No pudimos iniciar sesión. Revisá tus credenciales.')
    }
  })

  const onForgot = async (email: string) => {
    setRecoveryMsg(null)
    if (!email) {
      setFormError('Ingresá tu email para recuperar la contraseña.')
      return
    }
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar`,
    })
    // Mensaje neutro: no revela si el email existe.
    setRecoveryMsg('Si el email existe, te enviamos un enlace para restablecerla.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 text-2xl font-bold tracking-[0.08em] text-primary">GRUPO ARPECO</div>
          <CardTitle>Gestión Comercial y Proyectos</CardTitle>
          <CardDescription>Ingresá con tu cuenta de empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {formError && (
              <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}
            {recoveryMsg && (
              <p className="rounded-md bg-success/10 p-2 text-sm text-success" role="status">
                {recoveryMsg}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting} className="mt-1">
              {isSubmitting && <Spinner />}
              Ingresar
            </Button>
            <button
              type="button"
              className="text-center text-xs text-muted-foreground underline"
              onClick={() => onForgot(getValues('email'))}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>

          {import.meta.env.DEV && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Demo local: <code>direccion@arpeco.test</code> · <code>password123</code>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
