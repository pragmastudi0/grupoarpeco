import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-4xl font-bold text-muted-foreground">404</p>
      <p className="text-muted-foreground">La página que buscás no existe.</p>
      <Button asChild variant="outline">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </div>
  )
}
