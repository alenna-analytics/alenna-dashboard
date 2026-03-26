import { EmptyState } from '@/components/composed/empty-state'
import { usePageChrome } from '@/components/providers/page-chrome-context'
import { PlugIcon } from 'lucide-react'
import { useEffect } from 'react'

export function ConnectorsPage() {
  const { setPageMeta } = usePageChrome()

  useEffect(() => {
    setPageMeta({ title: 'Connectors' })
    return () => setPageMeta({ title: '' })
  }, [setPageMeta])

  return (
    <div className="space-y-6">
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
