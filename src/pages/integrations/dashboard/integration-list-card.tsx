import { Settings } from 'lucide-react'

import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { resolveConnectionSyncFreshnessPillContent } from '@/lib/integrations/sync-freshness'
import type { PlatformConnection } from '@/lib/types/connectors'
import { SyncFreshnessPillBadge } from '@/components/integrations/sync-freshness-badge'
import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'
import { shellT } from '@/lib/i18n/shell-strings'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card'
import { Switch } from '@/ui/switch'

import {
  integrationDescription,
  integrationTitle,
} from '@/pages/integrations/dashboard/integration-display'

type IntegrationListCardProps = {
  integration: ManagedIntegration
  lang: string
  shopifyConnected: boolean
  shopifyConnection?: PlatformConnection | null
  shopifyForceSyncing?: boolean
  mercadolibreConnected?: boolean
  mercadolibreConnection?: PlatformConnection | null
  isAdmin: boolean
  disconnectPending: boolean
  onManage: () => void
  onConnectToggle: (on: boolean) => void
}

export function IntegrationListCard({
  integration,
  lang,
  shopifyConnected,
  shopifyConnection,
  shopifyForceSyncing = false,
  mercadolibreConnected = false,
  mercadolibreConnection = null,
  isAdmin,
  disconnectPending,
  onManage,
  onConnectToggle,
}: IntegrationListCardProps) {
  const name = integrationTitle(lang, integration)
  const desc = integrationDescription(lang, integration)
  const isShopify = integration.slug === 'shopify'
  const isMercadolibre = integration.slug === 'mercadolibre'
  const isConnectable = isShopify || isMercadolibre
  const switchChecked = isShopify
    ? shopifyConnected
    : isMercadolibre
      ? mercadolibreConnected
      : false
  const switchDisabled =
    !integration.available ||
    !isConnectable ||
    (!isAdmin || disconnectPending)

  const handleSwitch = (on: boolean) => {
    if (!integration.available || !isConnectable) return
    if (!isAdmin) return
    onConnectToggle(on)
  }

  const syncPill =
    isShopify && shopifyConnected
      ? resolveConnectionSyncFreshnessPillContent(shopifyConnection, {
          forceSyncing: shopifyForceSyncing,
        })
      : isMercadolibre && mercadolibreConnected
        ? resolveConnectionSyncFreshnessPillContent(mercadolibreConnection)
        : null

  return (
    <li>
      <Card
        size="sm"
        className="h-full hover:shadow-[var(--shadow-ink-sm)]"
      >
        <CardHeader className="flex flex-col items-start gap-3 border-0 pb-0">
          <IntegrationLogo src={integration.logoSrc} alt={name} size="xl" />
          <div className="min-w-0 flex-1 flex flex-col">
            <div className="flex flex-row flex-wrap items-center gap-2">
              <CardTitle className="text-base! font-semibold tracking-tight">{name}</CardTitle>
              {syncPill ? <SyncFreshnessPillBadge pill={syncPill} lang={lang} /> : null}
              {!integration.available ? (
                <Badge variant="default">
                  {shellT(lang, 'integrationsComingSoonBadge')}
                </Badge>
              ) : null}
            </div>
            <CardDescription className="mt-1.5 line-clamp-2 text-md! leading-relaxed">
              {desc}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-row flex-wrap items-center justify-between gap-3 border-border-subtle bg-transparent">
          {integration.available ? (
            <Button
              type="button"
              variant="default"
              className="gap-2 text-sm"
              onClick={onManage}
            >
              <Settings className="size-4" aria-hidden />
              {shellT(lang, 'integrationsActionManage')}
            </Button>
          ) : null}
          {integration.available ? (
            <Switch
              checked={switchChecked}
              disabled={switchDisabled}
              onCheckedChange={handleSwitch}
              aria-label={shellT(lang, 'integrationsToggleLabel')}
            />
          ) : null}
        </CardFooter>
      </Card>
    </li>
  )
}
