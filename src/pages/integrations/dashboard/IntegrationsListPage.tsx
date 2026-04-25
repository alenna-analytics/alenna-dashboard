import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es as dateFnsEs } from 'date-fns/locale'

import { IntegrationManageSheet } from '@/pages/integrations/dashboard/integration-manage-sheet'
import {
  integrationCategory,
  integrationDescription,
  integrationTitle,
} from '@/pages/integrations/dashboard/integration-display'
import { IntegrationCardSkeleton } from '@/pages/integrations/dashboard/integration-card-skeleton'
import { IntegrationListCard } from '@/pages/integrations/dashboard/integration-list-card'
import { IntegrationsDisconnectDialog } from '@/pages/integrations/dashboard/integrations-disconnect-dialog'
import { IntegrationsSearchField } from '@/pages/integrations/dashboard/integrations-search-field'
import { IntegrationsErrorState } from '@/pages/integrations/dashboard/integrations-error-state'
import { IntegrationsEmptyState } from '@/pages/integrations/dashboard/integrations-empty-state'
import { useIntegrationsListQueries } from '@/pages/integrations/hooks/use-integrations-list-queries'
import { useShopifyIntegration } from '@/pages/integrations/details/use-shopify-integration'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'

function formatUpdatedAt(ts: number, lang: string): string {
  if (!ts) return ''
  const locale = lang === 'en' ? undefined : dateFnsEs
  return formatDistanceToNow(new Date(ts), { addSuffix: true, locale })
}

export function IntegrationsListPage() {
  const { lang } = useLanguage()
  const [q, setQ] = useState('')
  const [managedSlug, setManagedSlug] = useState<string | null>(null)
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)

  const shopifyIntegration = useShopifyIntegration()
  const { isAdmin, connected: shopifyConnected, disconnectMutation } =
    shopifyIntegration

  const { integrations, pageLoading, pageError, isFetching, dataUpdatedAt, refetch } =
    useIntegrationsListQueries()

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return integrations
    return integrations.filter((i) => {
      const name = integrationTitle(lang, i).toLowerCase()
      const cat = integrationCategory(lang, i).toLowerCase()
      const desc = integrationDescription(lang, i).toLowerCase()
      return (
        name.includes(needle) ||
        cat.includes(needle) ||
        desc.includes(needle) ||
        i.slug.toLowerCase().includes(needle)
      )
    })
  }, [q, lang, integrations])

  const managed = managedSlug
    ? integrations.find((x) => x.slug === managedSlug)
    : undefined

  const hasData = integrations.length > 0
  const isSearching = q.trim().length > 0
  const updatedLabel =
    dataUpdatedAt > 0 ? formatUpdatedAt(dataUpdatedAt, lang) : null

  return (
    <DashboardPage className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="max-w-xl">
          <h1 className="max-w-[12ch] text-4xl font-semibold tracking-[-0.045em] text-text-primary sm:text-5xl lg:text-[4.25rem]">
            {shellT(lang, 'integrationsHeroTitle')}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-text-secondary">
            {shellT(lang, 'integrationsHeroSubtitle')}
          </p>
        </div>
        {updatedLabel && !pageLoading ? (
          <p className="shrink-0 pt-1 text-xs text-muted-foreground">
            {shellT(lang, 'integrationsLastUpdated')} {updatedLabel}
          </p>
        ) : null}
      </section>

      <IntegrationsSearchField lang={lang} value={q} onChange={setQ} />

      {pageLoading ? (
        <ul
          className="grid list-none gap-4 sm:grid-cols-2"
          aria-busy="true"
          aria-label={shellT(lang, 'connectionsLoading')}
        >
          {Array.from({ length: 4 }).map((_, i) => (
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
      ) : !hasData && !isSearching ? (
        <IntegrationsEmptyState
          lang={lang}
          onExplore={() => setManagedSlug('shopify')}
        />
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {shellT(lang, 'integrationsEmptySearch')}
        </p>
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
          <ul className="grid list-none gap-4 sm:grid-cols-2">
            {filtered.map((integration) => (
              <IntegrationListCard
                key={integration.slug}
                integration={integration}
                lang={lang}
                shopifyConnected={shopifyConnected}
                isAdmin={isAdmin}
                disconnectPending={disconnectMutation.isPending}
                onManage={() => setManagedSlug(integration.slug)}
                onConnectToggle={(on) => {
                  if (on) {
                    setManagedSlug('shopify')
                    return
                  }
                  if (!shopifyConnected) return
                  setDisconnectDialogOpen(true)
                }}
              />
            ))}
          </ul>
        </>
      )}

      {managed ? (
        <IntegrationManageSheet
          definition={managed}
          open={managedSlug !== null}
          onOpenChange={(open) => {
            if (!open) setManagedSlug(null)
          }}
          shopify={managed.slug === 'shopify' ? shopifyIntegration : undefined}
        />
      ) : null}

      <IntegrationsDisconnectDialog
        lang={lang}
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        disconnectPending={disconnectMutation.isPending}
        onConfirmDisconnect={() => {
          disconnectMutation.mutate(undefined, {
            onSettled: () => setDisconnectDialogOpen(false),
          })
        }}
      />
    </DashboardPage>
  )
}
