import type { ReactNode } from 'react'

import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { shellT } from '@/lib/i18n/shell-strings'
import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'
import {
  type IntegrationDetailTabId,
  isIntegrationDetailTabId,
} from '@/pages/integrations/dashboard/integration-detail-tab'
import { IntegrationOverviewPanel } from '@/pages/integrations/dashboard/integration-overview-panel'
import { pageTitleClassName } from '@/shell/layout/dashboard-page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'

type IntegrationDetailLayoutProps = {
  definition: ManagedIntegration
  title: string
  description?: string
  titleBadges?: ReactNode
  lang: string
  connected: boolean
  tab: IntegrationDetailTabId
  onTabChange: (tab: IntegrationDetailTabId) => void
  overview: ReactNode
  settings: ReactNode
}

export function IntegrationDetailLayout({
  definition,
  title,
  description,
  titleBadges,
  lang,
  connected,
  tab,
  onTabChange,
  overview,
  settings,
}: IntegrationDetailLayoutProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-4 pb-6">
        <IntegrationLogo src={definition.logoSrc} alt={title} size="lg" className="size-14 bg-white p-2" />
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

      <Tabs
        value={tab}
        onValueChange={(next) => {
          if (isIntegrationDetailTabId(next)) onTabChange(next)
        }}
      >
        <TabsList variant="line">
          <TabsTrigger value="overview">{shellT(lang, 'integrationDetailTabOverview')}</TabsTrigger>
          <TabsTrigger value="settings">{shellT(lang, 'integrationDetailTabSettings')}</TabsTrigger>
        </TabsList>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_15.5rem] lg:items-start">
          <div className="relative min-w-0 grid grid-cols-1">
            <TabsContent value="overview" className="min-w-0">
              {overview}
            </TabsContent>
            <TabsContent value="settings" className="min-w-0">
              {settings}
            </TabsContent>
          </div>
          <IntegrationOverviewPanel
            integration={definition}
            lang={lang}
            connected={connected}
          />
        </div>
      </Tabs>
    </div>
  )
}
