import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/useAuth'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Spinner } from '@/shared/ui/states'
import { useClientDedup, useCreateClient } from './queries'
import { clientSchema, toClientInsert, type ClientInput } from './schemas'

export function NuevoClienteDialog() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const createClient = useCreateClient()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClientInput>({ resolver: zodResolver(clientSchema) })

  // Búsqueda de duplicados en vivo mientras se escribe el nombre.
  const nameValue = watch('legal_name') ?? ''
  const dedup = useClientDedup(nameValue)

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await createClient.mutateAsync({
        ...toClientInsert(values),
        owner_id: user!.id,
      })
      reset()
      setOpen(false)
      navigate(`/clientes/${created.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el cliente'
      // Colisión de unicidad (CUIT/nombre) → sugerir reutilizar.
      if (/duplicate key|unique/i.test(message)) {
        setError('legal_name', {
          message: 'Ya existe un cliente activo con ese nombre o CUIT. Revisá la lista.',
        })
      } else {
        setError('root', { message })
      }
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Nuevo cliente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>
            Buscamos duplicados automáticamente para no cargar dos veces la misma empresa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field
            label="Nombre o razón social"
            htmlFor="legal_name"
            error={errors.legal_name?.message}
          >
            <Input
              id="legal_name"
              aria-invalid={Boolean(errors.legal_name)}
              {...register('legal_name')}
            />
          </Field>

          {dedup.data && dedup.data.length > 0 && (
            <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm">
              <p className="mb-1 font-medium text-warning">Posibles duplicados</p>
              <ul className="space-y-0.5">
                {dedup.data.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <span>{c.legal_name}</span>
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={() => {
                        setOpen(false)
                        navigate(`/clientes/${c.id}`)
                      }}
                    >
                      Abrir
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="CUIT" htmlFor="tax_id" error={errors.tax_id?.message}>
              <Input id="tax_id" {...register('tax_id')} />
            </Field>
            <Field label="Teléfono" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" {...register('phone')} />
            </Field>
          </div>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" {...register('email')} />
          </Field>

          {errors.root && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive" role="alert">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              Crear cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
