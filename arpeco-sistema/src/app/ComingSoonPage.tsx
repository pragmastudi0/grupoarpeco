import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState } from '@/shared/ui/states'

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <EmptyState
        title="Módulo en preparación"
        description="Esta sección se habilita en las próximas etapas del roadmap."
      />
    </div>
  )
}
