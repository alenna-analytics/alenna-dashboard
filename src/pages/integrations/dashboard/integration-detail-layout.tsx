import type { ReactNode } from 'react'

import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'

type IntegrationDetailLayoutProps = {
  definition: ManagedIntegration
  title: string
  description: string
  overview: ReactNode
  settings: ReactNode
}

export function IntegrationDetailLayout({
  definition,
  title,
  description,
  overview,
  settings,
}: IntegrationDetailLayoutProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-4">
        <IntegrationLogo src={definition.logoSrc} alt={title} size="xl" />
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">{description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-8 border-t border-border-default pt-8">
        {overview}
        <div className="border-t border-border-default pt-8">{settings}</div>
      </div>
    </div>
  )
}
