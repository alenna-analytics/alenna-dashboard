import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

import { LoadingIcon } from '@/ui/app-icon'
import { SyncFreshnessPillBadge } from '@/components/integrations/sync-freshness-badge'
import { IntegrationEnableCard } from '@/components/integrations/integration-enable-card'
import { IntegrationSyncActionCard } from '@/components/integrations/integration-sync-action-card'
import { formatMercadoLibreSyncUserError } from '@/lib/integrations/mercadolibre-sync-user-error'
import { resolveConnectionSyncFreshnessPillContent } from '@/lib/integrations/sync-freshness'
import type { MercadoLibreIntegrationHook } from '@/pages/integrations/details/use-mercadolibre-integration'
import { useLanguage, type Language } from '@/shell/providers/language-provider'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { SyncPlan } from '@/lib/types/connectors'
import { Button } from '@/ui/button'
import { Label } from '@/ui/label'

function formatYmdMedium(value: string | null, lang: string): string {
  if (!value) return ''
  const ymd = value.length >= 10 ? value.slice(0, 10) : value
  if (!/^\d{4}-\d{2}-\d{2}/.test(ymd)) return ''
  const d = new Date(`${ymd}T12:00:00`)
  return new Intl.DateTimeFormat(lang === 'en' ? 'en' : 'es', { dateStyle: 'medium' }).format(d)
}

function lifecycleButtonLabelKey(syncPlan: SyncPlan | null): ShellStringKey {
  const status = syncPlan?.last_sync_status ?? 'not_synced'
  if (status === 'synced' || status === 'partial') return 'syncRefreshBtn'
  if (status === 'failed') return 'syncRetryBtn'
  return 'syncRunBtn'
}

function MercadoLibreIntroCopy({ lang }: { lang: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      {shellT(lang, 'integrationSheetMercadoLibreConnectIntro')}
    </p>
  )
}

function MercadoLibreSyncSection({
  lang,
  meli,
}: {
  lang: Language
  meli: MercadoLibreIntegrationHook
}) {
  const {
    activeConnection,
    lastSyncDisplay,
    syncMutation,
    meliSyncPhase,
    meliJobQuery,
    ordersProcessed,
    syncPanelBlockSuccess,
    syncFailedMessage,
    retryMercadoLibreSync,
    retryMercadoLibreSyncPending,
    syncPlan,
  } = meli

  const syncPill = resolveConnectionSyncFreshnessPillContent(activeConnection, {
    forceSyncing: meliSyncPhase === 'working',
  })

  const buttonLabel = shellT(lang, lifecycleButtonLabelKey(syncPlan))

  if (meliSyncPhase === 'working') {
    const job = meliJobQuery.data
    const phase = job?.progress?.phase
    const queued = job?.status === 'queued'
    let subtitle: string
    if (phase === 'catalog') {
      subtitle = shellT(lang, 'shopifySyncProgressCatalog')
    } else if (ordersProcessed != null && !Number.isNaN(ordersProcessed)) {
      subtitle = `${ordersProcessed.toLocaleString()} ${shellT(lang, 'shopifySyncProgressOrders')}`
    } else if (queued) {
      subtitle = shellT(lang, 'meliSyncProgressQueued')
    } else {
      subtitle = shellT(lang, 'syncRunning')
    }

    return (
      <IntegrationSyncActionCard
        title={shellT(lang, 'syncSectionTitle')}
        description={subtitle}
        actionLabel={shellT(lang, 'syncRunning')}
        onAction={() => {}}
        actionDisabled
        actionLoading
        hideAction
        badge={<SyncFreshnessPillBadge pill={{ kind: 'syncing', freshnessState: 'syncing' }} lang={lang} />}
        className="w-full"
      />
    )
  }

  if (meliSyncPhase === 'done_ok' && syncPanelBlockSuccess) {
    const b = syncPanelBlockSuccess
    const from = formatYmdMedium(b.minOrderDate, lang)
    const to = formatYmdMedium(b.maxOrderDate, lang)
    const range = from && to ? `${from} — ${to}` : from || to || ''

    const stats = [
      `${b.recordsSynced.toLocaleString()} ${shellT(lang, 'reportsOrders')}`,
      `${b.catalogListingsUpserted.toLocaleString()} ${shellT(lang, 'syncListingsImported')}`,
    ].join(' · ')

    return (
      <IntegrationSyncActionCard
        title={shellT(lang, 'integrationSyncDone')}
        description={`${stats}${range ? ` · ${range}` : ''}`}
        actionLabel={shellT(lang, 'syncRefreshBtn')}
        onAction={() => {}}
        hideAction
        badge={<CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />}
        footer={shellT(lang, 'shopifySyncBlockedHint')}
        className="w-full"
      />
    )
  }

  if (meliSyncPhase === 'done_fail') {
    return (
      <IntegrationSyncActionCard
        title={shellT(lang, 'syncSectionTitle')}
        description={formatMercadoLibreSyncUserError(syncFailedMessage, lang)}
        actionLabel={shellT(lang, 'shopifySyncRetry')}
        onAction={() => retryMercadoLibreSync()}
        actionDisabled={retryMercadoLibreSyncPending}
        actionLoading={retryMercadoLibreSyncPending}
        className="w-full"
      />
    )
  }

  return (
    <IntegrationSyncActionCard
      title={shellT(lang, 'syncSectionTitle')}
      description={shellT(lang, 'syncSectionCardDescription')}
      actionLabel={buttonLabel}
      actionLoadingLabel={shellT(lang, 'syncRunning')}
      onAction={() => syncMutation.mutate()}
      actionDisabled={syncMutation.isPending}
      actionLoading={syncMutation.isPending}
      badge={syncPill ? <SyncFreshnessPillBadge pill={syncPill} lang={lang} /> : undefined}
      footer={`${shellT(lang, 'connectionsLastSynced')}: ${lastSyncDisplay}`}
      className="w-full"
    />
  )
}

type MercadoLibreManageBodyProps = {
  meli: MercadoLibreIntegrationHook
  onRequestDisconnect?: () => void
  disconnectPending?: boolean
}

export function MercadoLibreManageBody({
  meli,
  onRequestDisconnect,
  disconnectPending = false,
}: MercadoLibreManageBodyProps) {
  const { lang } = useLanguage()
  const [integrationEnabled, setIntegrationEnabled] = useState(true)

  const accountId = 'integration-meli-account'
  const accountDisplay =
    meli.activeConnection?.shop_domain?.trim() ||
    shellT(lang, 'integrationsStatusConnected')

  const syncInProgress = meli.meliSyncPhase === 'working'

  return (
    <div className="flex w-full flex-col gap-4">
      {!meli.isAdmin ? (
        <p className="text-sm text-muted-foreground">{shellT(lang, 'connectionsAdminOnly')}</p>
      ) : meli.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoadingIcon className="size-4" />
          {shellT(lang, 'connectionsLoading')}
        </p>
      ) : meli.error ? (
        <p className="text-sm text-destructive" role="alert">
          {meli.error instanceof Error ? meli.error.message : String(meli.error)}
        </p>
      ) : !meli.connected ? (
        <div className="space-y-4">
          <MercadoLibreIntroCopy lang={lang} />
          <Button
            type="button"
            variant="accent"
            className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
            size="default"
            loading={meli.oauthStarting}
            onClick={() => void meli.startOAuth()}
          >
            {shellT(lang, 'integrationConnectWithMercadoLibre')}
          </Button>
          <p className="text-xs text-muted-foreground">
            {shellT(lang, 'integrationDetailMercadoLibreHelper')}
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          <IntegrationEnableCard
            title={shellT(lang, 'integrationEnableTitle')}
            description={shellT(lang, 'integrationEnableDescription')}
            enabled={integrationEnabled}
            onEnabledChange={setIntegrationEnabled}
            switchId="integration-meli-enabled"
            switchDisabled={syncInProgress}
            onDisconnect={onRequestDisconnect}
            disconnectLabel={shellT(lang, 'integrationDetailDisconnect')}
            disconnectPending={disconnectPending}
          >
            <div className="space-y-2">
              <Label htmlFor={accountId}>{shellT(lang, 'integrationMercadoLibreAccountLabel')}</Label>
              <div
                id={accountId}
                className="flex h-10 min-h-10 min-w-0 items-center overflow-hidden rounded-md border border-border-subtle bg-muted/30 px-2.5 text-sm text-text-primary"
              >
                <span className="min-w-0 truncate">{accountDisplay}</span>
              </div>
            </div>
          </IntegrationEnableCard>

          {integrationEnabled ? <MercadoLibreSyncSection lang={lang} meli={meli} /> : null}
        </div>
      )}
    </div>
  )
}
