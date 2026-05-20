import { useState } from 'react'

import { IntegrationManageSheet } from '@/pages/integrations/dashboard/integration-manage-sheet'
import { IntegrationCardSkeleton } from '@/pages/integrations/dashboard/integration-card-skeleton'
import { IntegrationListCard } from '@/pages/integrations/dashboard/integration-list-card'
import { IntegrationsDisconnectDialog } from '@/pages/integrations/dashboard/integrations-disconnect-dialog'
import { IntegrationsErrorState } from '@/pages/integrations/dashboard/integrations-error-state'
import { IntegrationsEmptyState } from '@/pages/integrations/dashboard/integrations-empty-state'
import { useIntegrationsListQueries } from '@/pages/integrations/hooks/use-integrations-list-queries'
import { useMercadoLibreIntegration } from '@/pages/integrations/details/use-mercadolibre-integration'
import { useShopifyIntegration } from '@/pages/integrations/details/use-shopify-integration'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'

export function IntegrationsListPage() {
  const { lang } = useLanguage()
  const [managedSlug, setManagedSlug] = useState<string | null>(null)
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)

  const shopifyIntegration = useShopifyIntegration()
  const mercadolibreIntegration = useMercadoLibreIntegration()
  const { isAdmin, connected: shopifyConnected, disconnectMutation: shopifyDisconnect } =
    shopifyIntegration
  const mercadolibreConnected = mercadolibreIntegration.connected
  const meliDisconnect = mercadolibreIntegration.disconnectMutation

  const { integrations, connections, pageLoading, pageError, isFetching, refetch } =
    useIntegrationsListQueries()

  const shopifyConnection =
    connections.find(
      (c) =>
        c.platform === 'shopify' &&
        c.status === 'active' &&
        c.connection_status === 'active',
    ) ?? null

  const mercadolibreConnection =
    connections.find(
      (c) =>
        c.platform === 'mercadolibre' &&
        c.status === 'active' &&
        c.connection_status === 'active',
    ) ?? null

  const managed = managedSlug
    ? integrations.find((x) => x.slug === managedSlug)
    : undefined

  const hasData = integrations.length > 0

  return (
    <DashboardPage className="space-y-8">
      <section className="grid gap-6">
        <div className="max-w-xl">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-text-primary sm:text-4xl">
            {shellT(lang, 'integrationsHeroTitle')}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-text-secondary">
            {shellT(lang, 'integrationsHeroSubtitle')}
          </p>
        </div>
      </section>

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
      ) : !hasData ? (
        <IntegrationsEmptyState
          lang={lang}
          onExplore={() => setManagedSlug('shopify')}
        />
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
            {integrations.map((integration) => (
              <IntegrationListCard
                key={integration.slug}
                integration={integration}
                lang={lang}
                shopifyConnected={shopifyConnected}
                shopifyConnection={
                  integration.slug === 'shopify' ? shopifyConnection : null
                }
                shopifyForceSyncing={
                  integration.slug === 'shopify' &&
                  shopifyIntegration.shopifySyncPhase === 'working'
                }
                isAdmin={isAdmin}
                mercadolibreConnected={mercadolibreConnected}
                mercadolibreConnection={
                  integration.slug === 'mercadolibre' ? mercadolibreConnection : null
                }
                disconnectPending={
                  shopifyDisconnect.isPending || meliDisconnect.isPending
                }
                onManage={() => setManagedSlug(integration.slug)}
                onConnectToggle={(on) => {
                  if (on) {
                    setManagedSlug(integration.slug)
                    return
                  }
                  if (integration.slug === 'shopify' && shopifyConnected) {
                    setDisconnectDialogOpen(true)
                    return
                  }
                  if (integration.slug === 'mercadolibre' && mercadolibreConnected) {
                    setDisconnectDialogOpen(true)
                  }
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
          mercadolibre={
            managed.slug === 'mercadolibre' ? mercadolibreIntegration : undefined
          }
        />
      ) : null}

      <IntegrationsDisconnectDialog
        lang={lang}
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        disconnectPending={shopifyDisconnect.isPending || meliDisconnect.isPending}
        onConfirmDisconnect={() => {
          const mutation =
            managedSlug === 'mercadolibre' ? meliDisconnect : shopifyDisconnect
          mutation.mutate(undefined, {
            onSettled: () => setDisconnectDialogOpen(false),
          })
        }}
      />
    </DashboardPage>
  )
}
