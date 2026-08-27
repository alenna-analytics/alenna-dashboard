import type { ReactNode } from 'react'

import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'
import { IntegrationOverviewPanel } from '@/pages/integrations/dashboard/integration-overview-panel'
import { pageTitleClassName } from '@/shell/layout/dashboard-page'

type IntegrationDetailLayoutProps = {
  definition: ManagedIntegration
  title: string
  description?: string
  titleBadges?: ReactNode
  lang: string
  connected: boolean
  settings: ReactNode
}

export function IntegrationDetailLayout({
  definition,
  title,
  description,
  titleBadges,
  lang,
  connected,
  settings,
}: IntegrationDetailLayoutProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-4 pb-6">
        <IntegrationLogo src={definition.logoSrc} alt={title} size="xl" className="size-14 bg-white p-0" />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={pageTitleClassName}>{title}</h1>
            {titleBadges}
          </div>
          {description ? (
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-text-secondary">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_15.5rem] lg:items-start">
        <div className="min-w-0">{settings}</div>
        <IntegrationOverviewPanel integration={definition} lang={lang} connected={connected} />
      </div>
    </div>
  )
}
