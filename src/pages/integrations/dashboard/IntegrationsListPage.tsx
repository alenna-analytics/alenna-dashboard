import { useMemo, useState } from 'react'

import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { IntegrationCardSkeleton } from '@/pages/integrations/dashboard/integration-card-skeleton'
import { IntegrationListCard } from '@/pages/integrations/dashboard/integration-list-card'
import {
  integrationNeedsInitialSync,
  findActiveConnection,
  isIntegrationConnected,
} from '@/pages/integrations/dashboard/integration-connection'
import { IntegrationsErrorState } from '@/pages/integrations/dashboard/integrations-error-state'
import { IntegrationsEmptyState } from '@/pages/integrations/dashboard/integrations-empty-state'
import type { IntegrationsListCategory } from '@/pages/integrations/dashboard/integrations-list-category'
import { IntegrationsSearchField } from '@/pages/integrations/dashboard/integrations-search-field'
import { useIntegrationsListQueries } from '@/pages/integrations/hooks/use-integrations-list-queries'
import { useIntegrationOAuthReturn } from '@/pages/integrations/hooks/use-integration-oauth-return'
import { useMercadoLibreIntegration } from '@/pages/integrations/details/use-mercadolibre-integration'
import { useAmazonIntegration } from '@/pages/integrations/details/use-amazon-integration'
import { useShopifyIntegration } from '@/pages/integrations/details/use-shopify-integration'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import { EmptyState } from '@/ui/empty-state'

type IntegrationsListPageProps = {
  category?: IntegrationsListCategory
}

function integrationDisplayName(integration: ManagedIntegration, lang: string): string {
  if (integration.nameKey) return shellT(lang, integration.nameKey)
  return integration.catalogName
}

function compareIntegrationNames(
  a: ManagedIntegration,
  b: ManagedIntegration,
  lang: string,
): number {
  const locale = lang === 'en' ? 'en' : 'es'
  return integrationDisplayName(a, lang).localeCompare(
    integrationDisplayName(b, lang),
    locale,
    { sensitivity: 'base' },
  )
}

export function IntegrationsListPage({ category = 'all' }: IntegrationsListPageProps) {
  const { lang } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  useIntegrationOAuthReturn()

  const shopifyIntegration = useShopifyIntegration()
  const mercadolibreIntegration = useMercadoLibreIntegration()
  const amazonIntegration = useAmazonIntegration()

  const { integrations, connections, pageLoading, pageError, isFetching, refetch } =
    useIntegrationsListQueries()

  const visibleIntegrations = useMemo(() => {
    const byCategory =
      category === 'all'
        ? integrations
        : category === 'ads'
          ? integrations.filter(
              (integration) => integration.categoryKey === 'integrationsCategoryAds',
            )
          : integrations.filter(
              (integration) =>
                integration.categoryKey === 'integrationsCategoryEcommerce',
            )

    const locale = lang === 'en' ? 'en' : 'es'
    const q = searchQuery.trim().toLocaleLowerCase(locale)
    const filtered =
      q.length === 0
        ? byCategory
        : byCategory.filter((integration) => {
            const name = integrationDisplayName(integration, lang)
            const haystack = `${name} ${integration.catalogName} ${integration.slug}`
              .toLocaleLowerCase(locale)
            return haystack.includes(q)
          })

    return [...filtered].sort((a, b) => compareIntegrationNames(a, b, lang))
  }, [category, integrations, lang, searchQuery])

  const hasCatalog = integrations.length > 0
  const hasVisible = visibleIntegrations.length > 0
  const searchActive = searchQuery.trim().length > 0

  return (
    <DashboardPage className="space-y-8">
      <section className="flex flex-col gap-4">
        <div className="max-w-2xl">
          <h1 className={pageTitleClassName}>
            {shellT(lang, 'integrationsHeroTitle')}
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
            {shellT(lang, 'integrationsHeroSubtitle')}
          </p>
        </div>
        {!pageLoading && hasCatalog ? (
          <IntegrationsSearchField
            lang={lang}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        ) : null}
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
      ) : pageError && !hasCatalog ? (
        <IntegrationsErrorState
          lang={lang}
          error={pageError}
          isRetrying={isFetching}
          onRetry={refetch}
        />
      ) : !hasCatalog ? (
        <IntegrationsEmptyState lang={lang} />
      ) : !hasVisible ? (
        searchActive ? (
          <EmptyState
            icon="integrations"
            title={shellT(lang, 'integrationsEmptySearch')}
            className="rounded-md border border-border-subtle bg-muted/30"
          />
        ) : (
          <IntegrationsEmptyState lang={lang} />
        )
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
                connected={
                  isIntegrationConnected(
                    integration.slug,
                    shopifyIntegration.connected,
                    mercadolibreIntegration.connected,
                    amazonIntegration.connected,
                    Boolean(findActiveConnection(connections, integration.slug)),
                  ) || Boolean(findActiveConnection(connections, integration.slug))
                }
                needsInitialSync={integrationNeedsInitialSync(integration.slug, connections)}
              />
            ))}
          </ul>
        </>
      )}
    </DashboardPage>
  )
}
