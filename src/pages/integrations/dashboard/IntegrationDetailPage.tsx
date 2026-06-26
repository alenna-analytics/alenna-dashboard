import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import { LoadingIcon } from '@/ui/app-icon'
import {
  findActiveConnection,
  isIntegrationConnected,
} from '@/pages/integrations/dashboard/integration-connection'
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
import { Button } from '@/ui/button'

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
  const canDisconnect =
    (isShopify && shopifyIntegration.isAdmin && shopifyIntegration.connected) ||
    (isMercadolibre && mercadolibreIntegration.isAdmin && mercadolibreIntegration.connected)

  const settingsBody = !integration.available ? (
    <IntegrationPlaceholderSettings lang={lang} />
  ) : isShopify ? (
    <ShopifyManageBody shopify={shopifyIntegration} />
  ) : isMercadolibre ? (
    <MercadoLibreManageBody meli={mercadolibreIntegration} />
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
        overview={
          <IntegrationOverviewPanel
            integration={integration}
            lang={lang}
            connected={connected}
            connection={
              isShopify
                ? shopifyConnection
                : isMercadolibre
                  ? mercadolibreConnection
                  : null
            }
            forceSyncing={
              isShopify && shopifyIntegration.shopifySyncPhase === 'working'
            }
          />
        }
        settings={
          <div className="flex flex-col gap-8">
            {settingsBody}
            {canDisconnect ? (
              <div className="max-w-2xl border-t border-border-default pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="inline-flex items-center justify-center gap-2 border-destructive/35 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={
                    shopifyIntegration.disconnectMutation.isPending ||
                    mercadolibreIntegration.disconnectMutation.isPending
                  }
                  onClick={() => setDisconnectDialogOpen(true)}
                >
                  {shopifyIntegration.disconnectMutation.isPending ||
                  mercadolibreIntegration.disconnectMutation.isPending ? (
                    <LoadingIcon className="size-4 shrink-0" />
                  ) : null}
                  {shellT(lang, 'integrationDetailDisconnect')}
                </Button>
              </div>
            ) : null}
          </div>
        }
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
