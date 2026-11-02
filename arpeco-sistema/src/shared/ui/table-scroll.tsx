import type * as React from 'react'
import { cn } from '@/shared/lib/utils'

/**
 * Contenedor de scroll horizontal controlado para tablas de datos.
 * En pantallas angostas la tabla no se recorta ni rompe el layout: scrollea
 * dentro de su tarjeta conservando todas las columnas (no se elimina info).
 * Pasá a la <table> un `min-w-[...]` acorde a la cantidad de columnas.
 */
export function TableScroll({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn('w-full overflow-x-auto', className)}>{children}</div>
}
