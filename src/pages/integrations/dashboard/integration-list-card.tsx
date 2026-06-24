import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'
import {
  integrationCategory,
  integrationDescription,
  integrationTitle,
} from '@/pages/integrations/dashboard/integration-display'
import { shellT } from '@/lib/i18n/shell-strings'
import { Badge } from '@/ui/badge'
import { cn } from '@/lib/utils'

type IntegrationListCardProps = {
  integration: ManagedIntegration
  lang: string
  connected: boolean
}

export function IntegrationListCard({ integration, lang, connected }: IntegrationListCardProps) {
  const name = integrationTitle(lang, integration)
  const desc = integrationDescription(lang, integration)
  const category = integrationCategory(lang, integration)

  return (
    <li>
      <Link
        to={`/dashboard/integrations/${integration.slug}`}
        className={cn(
          'group flex h-full flex-col rounded-md border border-border-default bg-white p-5',
          'transition-colors hover:border-border-strong',
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <IntegrationLogo src={integration.logoSrc} alt={name} size="lg" />
          {connected ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
              {shellT(lang, 'integrationDetailInstalledBadge')}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-text-primary">{name}</h2>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">{desc}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!integration.available ? (
            <Badge variant="default">{shellT(lang, 'integrationsComingSoonBadge')}</Badge>
          ) : category ? (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              {category}
            </Badge>
          ) : null}
        </div>
      </Link>
    </li>
  )
}
