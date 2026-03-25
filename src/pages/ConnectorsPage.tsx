import { EmptyState } from '@/components/composed/empty-state'
import { PageHeader } from '@/components/composed/page-header'
import { PlugIcon } from 'lucide-react'

export function ConnectorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Connectors"
        description="Connect Shopify, Mercado Libre, and other channels."
      />
      <EmptyState
        icon={<PlugIcon className="size-6 text-text-secondary" />}
        title="No connectors yet"
        description="OAuth and sync status will appear here in a later phase."
        action={{
          label: 'Coming soon',
          onClick: () => {},
        }}
      />
    </div>
  )
}
