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
import { IntegrationDetailSkeleton } from '@/pages/integrations/dashboard/integration-detail-skeleton'
import { IntegrationOverviewPanel } from '@/pages/integrations/dashboard/integration-overview-panel'
import { IntegrationsDisconnectConfirmDialog } from '@/pages/integrations/dashboard/integrations-disconnect-confirm-dialog'
import {
  IntegrationsDisconnectDataDialog,
  type DisconnectDataChoice,
} from '@/pages/integrations/dashboard/integrations-disconnect-data-dialog'
import {
  integrationDescription,
  integrationTitle,
} from '@/pages/integrations/dashboard/integration-display'
import { AdsManageBody } from '@/pages/integrations/dashboard/ads/manage-body'
import { MercadoLibreManageBody } from '@/pages/integrations/dashboard/mercadolibre/manage-body'
import { AmazonManageBody } from '@/pages/integrations/dashboard/amazon/manage-body'
import { ShopifyManageBody } from '@/pages/integrations/dashboard/shopify/manage-body'
import { useIntegrationsListQueries } from '@/pages/integrations/hooks/use-integrations-list-queries'
import { useMercadoLibreIntegration } from '@/pages/integrations/details/use-mercadolibre-integration'
import { useAdsIntegration } from '@/pages/integrations/details/use-ads-integration'
import { useAmazonIntegration } from '@/pages/integrations/details/use-amazon-integration'
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
  const [disconnectDataDialogOpen, setDisconnectDataDialogOpen] = useState(false)
  const [disconnectConfirmDialogOpen, setDisconnectConfirmDialogOpen] = useState(false)
  const [purgeDataOnDisconnect, setPurgeDataOnDisconnect] = useState(false)

  const shopifyIntegration = useShopifyIntegration()
  const mercadolibreIntegration = useMercadoLibreIntegration()
  const amazonIntegration = useAmazonIntegration()
  const amazonAdsIntegration = useAdsIntegration('amazon_ads')
  const mercadolibreAdsIntegration = useAdsIntegration('mercadolibre_ads')
  const { integrations, connections, pageLoading } = useIntegrationsListQueries()

  const integration = useMemo(
    () => integrations.find((item) => item.slug === slug),
    [integrations, slug],
  )

  const shopifyConnection = findActiveConnection(connections, 'shopify')
  const mercadolibreConnection = findActiveConnection(connections, 'mercadolibre')
  const amazonConnection = findActiveConnection(connections, 'amazon')
  const amazonAdsConnection = findActiveConnection(connections, 'amazon_ads')
  const mercadolibreAdsConnection = findActiveConnection(connections, 'mercadolibre_ads')

  const connected = slug
    ? isIntegrationConnected(
        slug,
        shopifyIntegration.connected,
        mercadolibreIntegration.connected,
        amazonIntegration.connected,
        Boolean(findActiveConnection(connections, slug)),
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
      <DashboardPage className="space-y-6">
        <IntegrationDetailBreadcrumb slug={slug} />
        <IntegrationDetailSkeleton />
      </DashboardPage>
    )
  }

  const title = integrationTitle(lang, integration)
  const description = integrationDescription(lang, integration)
  const isShopify = integration.slug === 'shopify'
  const isMercadolibre = integration.slug === 'mercadolibre'
  const isAmazon = integration.slug === 'amazon'
  const isAmazonAds = integration.slug === 'amazon_ads'
  const isMercadolibreAds = integration.slug === 'mercadolibre_ads'
  const activeConnection = isShopify
    ? shopifyConnection
    : isMercadolibre
      ? mercadolibreConnection
      : isAmazon
        ? amazonConnection
        : isAmazonAds
          ? amazonAdsConnection
          : isMercadolibreAds
            ? mercadolibreAdsConnection
            : null
  const needsInitialSync = connectionNeedsInitialSync(activeConnection)
  const syncPill =
    connected && activeConnection
      ? resolveConnectionSyncFreshnessPillContent(activeConnection, {
          forceSyncing:
            (isShopify && shopifyIntegration.shopifySyncPhase === 'working') ||
            (isMercadolibre && mercadolibreIntegration.meliSyncPhase === 'working') ||
            (isAmazon && amazonIntegration.amazonSyncPhase === 'working'),
          suppressSyncing:
            (isAmazon && amazonIntegration.amazonSyncPhase === 'done_fail') ||
            (isShopify && shopifyIntegration.shopifySyncPhase === 'done_fail') ||
            (isMercadolibre && mercadolibreIntegration.meliSyncPhase === 'done_fail'),
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
          ? () => setDisconnectDataDialogOpen(true)
          : undefined
      }
      disconnectPending={shopifyIntegration.disconnectMutation.isPending}
    />
  ) : isMercadolibre ? (
    <MercadoLibreManageBody
      meli={mercadolibreIntegration}
      onRequestDisconnect={
        mercadolibreIntegration.isAdmin && mercadolibreIntegration.connected
          ? () => setDisconnectDataDialogOpen(true)
          : undefined
      }
      disconnectPending={mercadolibreIntegration.disconnectMutation.isPending}
    />
  ) : isAmazon ? (
    <AmazonManageBody
      amazon={amazonIntegration}
      onRequestDisconnect={
        amazonIntegration.isAdmin && amazonIntegration.hasConnection
          ? () => setDisconnectDataDialogOpen(true)
          : undefined
      }
      disconnectPending={amazonIntegration.disconnectMutation.isPending}
    />
  ) : isAmazonAds || isMercadolibreAds ? (
    <AdsManageBody
      slug={isAmazonAds ? 'amazon_ads' : 'mercadolibre_ads'}
      onRequestDisconnect={
        (isAmazonAds ? amazonAdsIntegration.isAdmin : mercadolibreAdsIntegration.isAdmin) &&
        (isAmazonAds ? amazonAdsIntegration.connected : mercadolibreAdsIntegration.connected)
          ? () => setDisconnectDataDialogOpen(true)
          : undefined
      }
      disconnectPending={
        isAmazonAds
          ? amazonAdsIntegration.disconnectMutation.isPending
          : mercadolibreAdsIntegration.disconnectMutation.isPending
      }
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

      <IntegrationsDisconnectDataDialog
        lang={lang}
        open={disconnectDataDialogOpen}
        onOpenChange={setDisconnectDataDialogOpen}
        onContinue={(choice: DisconnectDataChoice) => {
          setPurgeDataOnDisconnect(choice === 'purge')
          setDisconnectDataDialogOpen(false)
          setDisconnectConfirmDialogOpen(true)
        }}
      />

      <IntegrationsDisconnectConfirmDialog
        lang={lang}
        open={disconnectConfirmDialogOpen}
        onOpenChange={setDisconnectConfirmDialogOpen}
        purgeData={purgeDataOnDisconnect}
        disconnectPending={
          shopifyIntegration.disconnectMutation.isPending ||
          mercadolibreIntegration.disconnectMutation.isPending ||
          amazonIntegration.disconnectMutation.isPending ||
          amazonAdsIntegration.disconnectMutation.isPending ||
          mercadolibreAdsIntegration.disconnectMutation.isPending
        }
        onBack={() => {
          setDisconnectConfirmDialogOpen(false)
          setDisconnectDataDialogOpen(true)
        }}
        onConfirmDisconnect={() => {
          const mutation = isAmazonAds
            ? amazonAdsIntegration.disconnectMutation
            : isMercadolibreAds
              ? mercadolibreAdsIntegration.disconnectMutation
              : isAmazon
            ? amazonIntegration.disconnectMutation
            : isMercadolibre
              ? mercadolibreIntegration.disconnectMutation
              : shopifyIntegration.disconnectMutation
          mutation.mutate(purgeDataOnDisconnect, {
            onSettled: () => {
              setDisconnectConfirmDialogOpen(false)
              setPurgeDataOnDisconnect(false)
            },
          })
        }}
      />
    </DashboardPage>
  )
}
