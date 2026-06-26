import { useMemo } from 'react'

import { IntegrationCardSkeleton } from '@/pages/integrations/dashboard/integration-card-skeleton'
import { IntegrationListCard } from '@/pages/integrations/dashboard/integration-list-card'
import {
  integrationNeedsInitialSync,
  isIntegrationConnected,
} from '@/pages/integrations/dashboard/integration-connection'
import { IntegrationsErrorState } from '@/pages/integrations/dashboard/integrations-error-state'
import { IntegrationsEmptyState } from '@/pages/integrations/dashboard/integrations-empty-state'
import type { IntegrationsListCategory } from '@/pages/integrations/dashboard/integrations-list-category'
import { useIntegrationsListQueries } from '@/pages/integrations/hooks/use-integrations-list-queries'
import { useMercadoLibreIntegration } from '@/pages/integrations/details/use-mercadolibre-integration'
import { useShopifyIntegration } from '@/pages/integrations/details/use-shopify-integration'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'

type IntegrationsListPageProps = {
  category?: IntegrationsListCategory
}

export function IntegrationsListPage({ category = 'all' }: IntegrationsListPageProps) {
  const { lang } = useLanguage()

  const shopifyIntegration = useShopifyIntegration()
  const mercadolibreIntegration = useMercadoLibreIntegration()

  const { integrations, connections, pageLoading, pageError, isFetching, refetch } =
    useIntegrationsListQueries()

  const visibleIntegrations = useMemo(() => {
    if (category === 'all') return integrations
    return integrations.filter(
      (integration) => integration.categoryKey === 'integrationsCategoryEcommerce',
    )
  }, [category, integrations])

  const hasData = visibleIntegrations.length > 0

  return (
    <DashboardPage className="space-y-8">
      <section>
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
            {shellT(lang, 'integrationsHeroTitle')}
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            {shellT(lang, 'integrationsHeroSubtitle')}
          </p>
        </div>
      </section>

      {pageLoading ? (
        <ul
          className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label={shellT(lang, 'connectionsLoading')}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <IntegrationCardSkeleton key={i} />
          ))}
        </ul>
      ) : pageError && !hasData ? (
        <IntegrationsErrorState
          lang={lang}
          error={pageError}
          isRetrying={isFetching}
          onRetry={refetch}
        />
      ) : !hasData ? (
        <IntegrationsEmptyState lang={lang} />
      ) : (
        <>
          {pageError ? (
            <IntegrationsErrorState
              lang={lang}
              error={pageError}
              isRetrying={isFetching}
              onRetry={refetch}
            />
          ) : null}

          <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleIntegrations.map((integration) => (
              <IntegrationListCard
                key={integration.slug}
                integration={integration}
                lang={lang}
                connected={isIntegrationConnected(
                  integration.slug,
                  shopifyIntegration.connected,
                  mercadolibreIntegration.connected,
                )}
                needsInitialSync={integrationNeedsInitialSync(integration.slug, connections)}
              />
            ))}
          </ul>
        </>
      )}
    </DashboardPage>
  )
}
