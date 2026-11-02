import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/shared/ui/button'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Límite de error de React: evita pantalla en blanco ante un fallo de render. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log estructurado sin datos sensibles.
    console.error('[ErrorBoundary]', error.message, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <div>
            <h1 className="text-lg font-semibold">Algo salió mal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ocurrió un error inesperado. Podés recargar la página.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Recargar</Button>
        </div>
      )
    }
    return this.props.children
  }
}
