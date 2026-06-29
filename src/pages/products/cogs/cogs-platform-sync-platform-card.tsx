import type { ReactNode } from 'react'

import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { shellT } from '@/lib/i18n/shell-strings'
import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'
import { Badge } from '@/ui/badge'
import { cn } from '@/lib/utils'

export type CogsSyncPlatformSlug = 'shopify' | 'mercadolibre'

type CogsPlatformSyncPlatformCardProps = {
  lang: string
  platform: CogsSyncPlatformSlug
  available: boolean
  selected: boolean
  comingSoon?: boolean
  footer?: ReactNode
  onSelect: () => void
}

export function CogsPlatformSyncPlatformCard({
  lang,
  platform,
  available,
  selected,
  comingSoon = false,
  footer,
  onSelect,
}: CogsPlatformSyncPlatformCardProps) {
  const ui = INTEGRATION_UI[platform]
  const name = ui ? shellT(lang, ui.nameKey) : platform

  return (
    <button
      type="button"
      disabled={!available}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex w-full flex-col rounded-md border bg-white p-5 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2',
        available && 'hover:border-border-strong',
        selected && available ? 'border-primary ring-1 ring-primary/30' : 'border-border-default',
        !available && 'cursor-not-allowed opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        <IntegrationLogo
          src={ui?.logoSrc}
          alt={name}
          size="md"
          className="size-10 shrink-0 rounded-md border border-border-subtle bg-muted/20 p-1.5"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary">{name}</h2>
            {comingSoon ? (
              <Badge variant="default">{shellT(lang, 'integrationsComingSoonBadge')}</Badge>
            ) : null}
          </div>

          {footer ? <div className="mt-1 min-w-0">{footer}</div> : null}
        </div>
      </div>
    </button>
  )
}
