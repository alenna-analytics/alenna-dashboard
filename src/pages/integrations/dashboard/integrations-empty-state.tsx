import { Plug } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import { EmptyState } from '@/ui/empty-state'

type IntegrationsEmptyStateProps = {
  lang: string
}

export function IntegrationsEmptyState({ lang }: IntegrationsEmptyStateProps) {
  const navigate = useNavigate()

  return (
    <EmptyState
      size="md"
      icon={Plug}
      title={shellT(lang, 'integrationsEmptyTitle')}
      description={shellT(lang, 'integrationsEmptyDescription')}
      className="rounded-md border border-border-subtle bg-muted/30"
      action={
        <Button
          size="lg"
          className="gap-2"
          onClick={() => navigate('/dashboard/integrations/shopify')}
        >
          <Plug className="size-4" aria-hidden />
          {shellT(lang, 'integrationsExploreCta')}
        </Button>
      }
    />
  )
}
