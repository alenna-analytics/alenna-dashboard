import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import { SyncFreshnessPillBadge } from '@/components/integrations/sync-freshness-badge'
import { connectionNeedsInitialSync } from '@/lib/integrations/sync-freshness'
import {
  findActiveConnection,
  isIntegrationConnected,
} from '@/pages/integrations/dashboard/integration-connection'
import { resolveConnectionSyncFreshnessPillContent } from '@/lib/integrations/sync-freshness'
import { IntegrationDetailBreadcrumb } from '@/pages/integrations/dashboard/integration-detail-breadcrumb'
import { IntegrationDetailLayout } from '@/pages/integrations/dashboard/integration-detail-layout'
import { IntegrationOverviewPanel } from '@/pages/integrations/dashboard/integration-overview-panel'
import { IntegrationsDisconnectDialog } from '@/pages/integrations/dashboard/integrations-disconnect-dialog'
import {
  integrationDescription,
  integrationTitle,
} from '@/pages/integrations/dashboard/integration-display'
import { MercadoLibreManageBody } from '@/pages/integrations/dashboard/mercadolibre/manage-body'
import { ShopifyManageBody } from '@/pages/integrations/dashboard/shopify/manage-body'
import { useIntegrationsListQueries } from '@/pages/integrations/hooks/use-integrations-list-queries'
import { useMercadoLibreIntegration } from '@/pages/integrations/details/use-mercadolibre-integration'
import { useShopifyIntegration } from '@/pages/integrations/details/use-shopify-integration'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import { StatusPill } from '@/ui/status-pill'

function IntegrationPlaceholderSettings({ lang }: { lang: string }) {
  return (
    <div className="max-w-2xl space-y-2">
      <p className="text-sm font-medium text-text-primary">
        {shellT(lang, 'integrationPlaceholderTitle')}
      </p>
      <p className="text-sm text-text-secondary">{shellT(lang, 'integrationPlaceholderBody')}</p>
    </div>
  )
}

export function IntegrationDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { lang } = useLanguage()
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)

  const shopifyIntegration = useShopifyIntegration()
  const mercadolibreIntegration = useMercadoLibreIntegration()
  const { integrations, connections, pageLoading } = useIntegrationsListQueries()

  const integration = useMemo(
    () => integrations.find((item) => item.slug === slug),
    [integrations, slug],
  )

  const shopifyConnection = findActiveConnection(connections, 'shopify')
  const mercadolibreConnection = findActiveConnection(connections, 'mercadolibre')

  const connected = slug
    ? isIntegrationConnected(
        slug,
        shopifyIntegration.connected,
        mercadolibreIntegration.connected,
      )
    : false

  if (!slug) {
    return <Navigate to="/dashboard/integrations" replace />
  }

  if (!pageLoading && !integration) {
    return <Navigate to="/dashboard/integrations" replace />
  }

  if (!integration) {
    return (
      <DashboardPage>
        <p className="text-sm text-text-secondary">{shellT(lang, 'connectionsLoading')}</p>
      </DashboardPage>
    )
  }

  const title = integrationTitle(lang, integration)
  const description = integrationDescription(lang, integration)
  const isShopify = integration.slug === 'shopify'
  const isMercadolibre = integration.slug === 'mercadolibre'
  const activeConnection = isShopify
    ? shopifyConnection
    : isMercadolibre
      ? mercadolibreConnection
      : null
  const needsInitialSync = connectionNeedsInitialSync(activeConnection)
  const syncPill =
    connected && activeConnection
      ? resolveConnectionSyncFreshnessPillContent(activeConnection, {
          forceSyncing:
            (isShopify && shopifyIntegration.shopifySyncPhase === 'working') ||
            (isMercadolibre && mercadolibreIntegration.meliSyncPhase === 'working'),
        })
      : null

  const titleBadges = connected ? (
    <>
      <StatusPill variant="success">{shellT(lang, 'integrationDetailInstalledBadge')}</StatusPill>
      {needsInitialSync ? (
        <StatusPill variant="warning">{shellT(lang, 'integrationCardSyncPending')}</StatusPill>
      ) : syncPill ? (
        <SyncFreshnessPillBadge pill={syncPill} lang={lang} />
      ) : null}
    </>
  ) : null

  const settingsBody = !integration.available ? (
    <IntegrationPlaceholderSettings lang={lang} />
  ) : isShopify ? (
    <ShopifyManageBody
      shopify={shopifyIntegration}
      onRequestDisconnect={
        shopifyIntegration.isAdmin && shopifyIntegration.connected
          ? () => setDisconnectDialogOpen(true)
          : undefined
      }
      disconnectPending={shopifyIntegration.disconnectMutation.isPending}
    />
  ) : isMercadolibre ? (
    <MercadoLibreManageBody
      meli={mercadolibreIntegration}
      onRequestDisconnect={
        mercadolibreIntegration.isAdmin && mercadolibreIntegration.connected
          ? () => setDisconnectDialogOpen(true)
          : undefined
      }
      disconnectPending={mercadolibreIntegration.disconnectMutation.isPending}
    />
  ) : (
    <IntegrationPlaceholderSettings lang={lang} />
  )

  return (
    <DashboardPage className="space-y-6">
      <IntegrationDetailBreadcrumb slug={slug} />
      <IntegrationDetailLayout
        definition={integration}
        title={title}
        description={description}
        titleBadges={titleBadges}
        overview={
          <IntegrationOverviewPanel
            integration={integration}
            lang={lang}
            connected={connected}
          />
        }
        settings={settingsBody}
      />

      <IntegrationsDisconnectDialog
        lang={lang}
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        disconnectPending={
          shopifyIntegration.disconnectMutation.isPending ||
          mercadolibreIntegration.disconnectMutation.isPending
        }
        onConfirmDisconnect={() => {
          const mutation = isMercadolibre
            ? mercadolibreIntegration.disconnectMutation
            : shopifyIntegration.disconnectMutation
          mutation.mutate(undefined, {
            onSettled: () => setDisconnectDialogOpen(false),
          })
        }}
      />
    </DashboardPage>
  )
}
