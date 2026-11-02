import { useAuth } from '../useAuth'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

export function InactiveAccount() {
  const { signOut, profile } = useAuth()
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Cuenta sin acceso</CardTitle>
          <CardDescription>
            {profile?.email ? `${profile.email}: ` : ''}tu cuenta está inactiva. Pedí a Dirección
            que la active para poder operar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void signOut()}>
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
