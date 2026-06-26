import type { ReactNode } from 'react'

import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'

type IntegrationDetailLayoutProps = {
  definition: ManagedIntegration
  title: string
  description?: string
  titleBadges?: ReactNode
  overview: ReactNode
  settings: ReactNode
}

export function IntegrationDetailLayout({
  definition,
  title,
  description,
  titleBadges,
  overview,
  settings,
}: IntegrationDetailLayoutProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-4">
        <IntegrationLogo src={definition.logoSrc} alt={title} size="xl" />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">{title}</h1>
            {titleBadges}
          </div>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-text-secondary">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-8 border-t border-border-default pt-8">
        {overview}
        <div className="border-t border-border-default pt-8">{settings}</div>
      </div>
    </div>
  )
}
