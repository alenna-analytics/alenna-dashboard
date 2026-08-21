import { useMemo, useState } from 'react'

import type { ManagedIntegration } from '@/lib/integrations/catalog'
import type { PlatformConnection } from '@/lib/types/connectors'
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
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'

type IntegrationsListPageProps = {
  category?: IntegrationsListCategory
}

type InstallFilter = 'installed' | 'not_installed' | ''

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

function integrationIsConnected(
  integration: ManagedIntegration,
  shopifyConnected: boolean,
  mercadolibreConnected: boolean,
  amazonConnected: boolean,
  connections: PlatformConnection[],
): boolean {
  return (
    isIntegrationConnected(
      integration.slug,
      shopifyConnected,
      mercadolibreConnected,
      amazonConnected,
      Boolean(findActiveConnection(connections, integration.slug)),
    ) || Boolean(findActiveConnection(connections, integration.slug))
  )
}

export function IntegrationsListPage({ category = 'all' }: IntegrationsListPageProps) {
  const { lang } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [installFilter, setInstallFilter] = useState<InstallFilter>('')
  useIntegrationOAuthReturn()

  const shopifyIntegration = useShopifyIntegration()
  const mercadolibreIntegration = useMercadoLibreIntegration()
  const amazonIntegration = useAmazonIntegration()

  const { integrations, connections, pageLoading, pageError, isFetching, refetch } =
    useIntegrationsListQueries()

  const shopifyConnected = shopifyIntegration.connected
  const mercadolibreConnected = mercadolibreIntegration.connected
  const amazonConnected = amazonIntegration.connected

  const statusOptions = useMemo(
    () => [
      { value: 'installed', label: shellT(lang, 'integrationsFilterInstalled') },
      { value: 'not_installed', label: shellT(lang, 'integrationsFilterNotInstalled') },
    ],
    [lang],
  )

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
    const searched =
      q.length === 0
        ? byCategory
        : byCategory.filter((integration) => {
            const name = integrationDisplayName(integration, lang)
            const haystack = `${name} ${integration.catalogName} ${integration.slug}`
              .toLocaleLowerCase(locale)
            return haystack.includes(q)
          })

    const filtered =
      installFilter === ''
        ? searched
        : searched.filter((integration) => {
            const connected = integrationIsConnected(
              integration,
              shopifyConnected,
              mercadolibreConnected,
              amazonConnected,
              connections,
            )
            return installFilter === 'installed' ? connected : !connected
          })

    return [...filtered].sort((a, b) => compareIntegrationNames(a, b, lang))
  }, [
    amazonConnected,
    category,
    connections,
    installFilter,
    integrations,
    lang,
    mercadolibreConnected,
    searchQuery,
    shopifyConnected,
  ])

  const hasCatalog = integrations.length > 0
  const hasVisible = visibleIntegrations.length > 0
  const searchActive = searchQuery.trim().length > 0
  const filterActive = installFilter.length > 0

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
          <div className="flex min-w-max items-center gap-2">
            <IntegrationsSearchField
              lang={lang}
              value={searchQuery}
              onChange={setSearchQuery}
            />
            <FilterComboboxSingle
              label={shellT(lang, 'integrationsColStatus')}
              options={statusOptions}
              value={installFilter}
              onValueChange={(value) => {
                if (value === 'installed' || value === 'not_installed') {
                  setInstallFilter(value)
                  return
                }
                setInstallFilter('')
              }}
              searchPlaceholder={shellT(lang, 'filterSearch')}
              emptyLabel={shellT(lang, 'filterComingSoon')}
              clearAriaLabel={shellT(lang, 'filterClear')}
            />
          </div>
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
        searchActive || filterActive ? (
          <EmptyState
            icon="integrations"
            title={shellT(
              lang,
              searchActive ? 'integrationsEmptySearch' : 'integrationsEmptyFilter',
            )}
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
                connected={integrationIsConnected(
                  integration,
                  shopifyConnected,
                  mercadolibreConnected,
                  amazonConnected,
                  connections,
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
