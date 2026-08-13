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
      icon="integrations"
      title={shellT(lang, 'integrationsEmptyTitle')}
      description={shellT(lang, 'integrationsEmptyDescription')}
      className="rounded-md border border-border-subtle bg-muted/30"
      action={
        <Button
          variant="inverse"
          size="default"
          onClick={() => navigate('/dashboard/integrations/shopify')}
        >
          {shellT(lang, 'integrationsExploreCta')}
        </Button>
      }
    />
  )
}
