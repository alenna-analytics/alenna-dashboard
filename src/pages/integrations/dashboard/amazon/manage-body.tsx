import { toast } from 'sonner'
import { useState } from 'react'

import { AmazonFeesUnavailableNotice } from '@/components/integrations/amazon-fees-unavailable-notice'
import { PlanLimitSyncAlert } from '@/components/integrations/plan-limit-sync-alert'
import { SyncFreshnessPillBadge } from '@/components/integrations/sync-freshness-badge'
import { isPlanLimitSyncPaused } from '@/lib/plan/plan-limit-ui'
import { IntegrationEnableCard } from '@/components/integrations/integration-enable-card'
import { IntegrationSyncActionCard } from '@/components/integrations/integration-sync-action-card'
import { IntegrationConnectPanel } from '@/pages/integrations/dashboard/integration-connect-panel'
import { IntegrationConsentDialog } from '@/pages/integrations/dashboard/integration-consent-dialog'
import { IntegrationDetailSkeleton } from '@/pages/integrations/dashboard/integration-detail-skeleton'
import { mercadoLibreSyncSummaryLine } from '@/lib/integrations/mercadolibre-sync-summary'
import { resolveConnectionSyncFreshnessPillContent } from '@/lib/integrations/sync-freshness'
import type { AmazonIntegrationHook } from '@/pages/integrations/details/use-amazon-integration'
import { useCancelPlatformSyncJob } from '@/hooks/use-cancel-platform-sync-job'
import { GLOBAL_ACTIVITY_AMAZON_SYNC_ID } from '@/shell/providers/global-activity-provider'
import { useLanguage, type Language } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { SyncPlan } from '@/lib/types/connectors'
import { Button } from '@/ui/button'
import { AppIcon } from '@/ui/app-icon'
import { Label } from '@/ui/label'
import {
  needsInitialSyncConsent,
  useIntegrationConsentGate,
} from '@/pages/integrations/hooks/use-integration-consent-gate'

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

function AmazonSyncSection({
  lang,
  amazon,
  isFixture,
  planSyncPaused,
  onConsentThen,
}: {
  lang: Language
  amazon: AmazonIntegrationHook
  isFixture: boolean
  planSyncPaused: boolean
  onConsentThen: (action: () => void) => void
}) {
  const {
    activeConnection,
    lastSyncDisplay,
    syncMutation,
    amazonSyncPhase,
    amazonJobQuery,
    ordersProcessed,
    syncPanelBlockSuccess,
    syncFailedMessage,
    retryAmazonSync,
    retryAmazonSyncPending,
    syncPlan,
    activeSyncJobId,
    isAdmin,
  } = amazon

  const cancelSyncMutation = useCancelPlatformSyncJob()

  const syncPill = resolveConnectionSyncFreshnessPillContent(activeConnection, {
    forceSyncing: amazonSyncPhase === 'working',
    suppressSyncing: amazonSyncPhase === 'done_fail',
  })

  const buttonLabel = shellT(lang, lifecycleButtonLabelKey(syncPlan))

  const fixtureBlocked = () => {
    toast.info(shellT(lang, 'fixtureActionDisabled'))
  }

  const runSync = (action: () => void) => {
    if (isFixture) {
      fixtureBlocked()
      return
    }
    if (needsInitialSyncConsent(syncPlan?.last_sync_status)) {
      onConsentThen(action)
      return
    }
    action()
  }

  const planLimitAlert = planSyncPaused ? <PlanLimitSyncAlert className="mb-4" /> : null

  if (amazonSyncPhase === 'working') {
    const job = amazonJobQuery.data
    const phase = job?.progress?.phase
    const queued = job?.status === 'queued'
    let subtitle: string
    if (phase === 'catalog') {
      subtitle = shellT(lang, 'platformSyncProgressCatalog')
    } else if (ordersProcessed != null && !Number.isNaN(ordersProcessed)) {
      subtitle = `${ordersProcessed.toLocaleString()} ${shellT(lang, 'platformSyncProgressOrders')}`
    } else if (queued) {
      subtitle = shellT(lang, 'amazonSyncProgressQueued')
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
        secondaryActionLabel={isAdmin ? shellT(lang, 'platformSyncCancelBtn') : undefined}
        onSecondaryAction={
          isAdmin && activeSyncJobId
            ? () =>
                cancelSyncMutation.mutate({
                  jobId: activeSyncJobId,
                  activityId: GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
                })
            : undefined
        }
        secondaryActionDisabled={!activeSyncJobId || isFixture}
        secondaryActionLoading={cancelSyncMutation.isPending}
        badge={<SyncFreshnessPillBadge pill={{ kind: 'syncing', freshnessState: 'syncing' }} lang={lang} />}
        className="w-full"
      />
    )
  }

  if (amazonSyncPhase === 'done_ok' && syncPanelBlockSuccess) {
    const b = syncPanelBlockSuccess
    const from = formatYmdMedium(b.minOrderDate, lang)
    const to = formatYmdMedium(b.maxOrderDate, lang)
    const range = from && to ? `${from} — ${to}` : from || to || ''

    const stats = mercadoLibreSyncSummaryLine(
      {
        recordsSynced: b.recordsSynced,
        recordsTouched: b.recordsTouched,
        catalogListingsUpserted: b.catalogListingsUpserted,
      },
      lang,
    )

    return (
      <IntegrationSyncActionCard
        title={shellT(lang, 'integrationSyncDone')}
        description={`${stats}${range ? ` · ${range}` : ''}`}
        actionLabel={shellT(lang, 'syncRefreshBtn')}
        actionLoadingLabel={shellT(lang, 'syncRunning')}
        onAction={() => (isFixture ? fixtureBlocked() : syncMutation.mutate())}
        actionDisabled={syncMutation.isPending || isFixture || planSyncPaused}
        actionLoading={syncMutation.isPending}
        badge={<AppIcon name="validation" colorize className="size-4 shrink-0 text-success" />}
        footer={`${shellT(lang, 'connectionsLastSynced')}: ${lastSyncDisplay}`}
        className="w-full"
      />
    )
  }

  if (amazonSyncPhase === 'done_fail') {
    return (
      <IntegrationSyncActionCard
        title={shellT(lang, 'syncSectionTitle')}
        description={syncFailedMessage ?? shellT(lang, 'amazonSyncToastFailed')}
        actionLabel={shellT(lang, 'platformSyncRetry')}
        onAction={() => runSync(() => retryAmazonSync())}
        actionDisabled={retryAmazonSyncPending || isFixture || planSyncPaused}
        actionLoading={retryAmazonSyncPending}
        className="w-full"
      />
    )
  }

  return (
    <>
      {planLimitAlert}
      <IntegrationSyncActionCard
        title={shellT(lang, 'syncSectionTitle')}
        description={shellT(lang, 'syncSectionDescriptionAmazon')}
        actionLabel={buttonLabel}
        actionLoadingLabel={shellT(lang, 'syncRunning')}
        onAction={() => runSync(() => syncMutation.mutate())}
        actionDisabled={syncMutation.isPending || isFixture || planSyncPaused}
        actionLoading={syncMutation.isPending}
        badge={syncPill ? <SyncFreshnessPillBadge pill={syncPill} lang={lang} /> : undefined}
        footer={`${shellT(lang, 'connectionsLastSynced')}: ${lastSyncDisplay}`}
        className="w-full"
      />
    </>
  )
}

type AmazonManageBodyProps = {
  amazon: AmazonIntegrationHook
  onRequestDisconnect?: () => void
  disconnectPending?: boolean
}

export function AmazonManageBody({
  amazon,
  onRequestDisconnect,
  disconnectPending = false,
}: AmazonManageBodyProps) {
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const isFixture = Boolean(me?.is_fixture)
  const planSyncPaused = isPlanLimitSyncPaused(me)
  const [integrationEnabled, setIntegrationEnabled] = useState(true)
  const consent = useIntegrationConsentGate()

  const accountId = 'integration-amazon-account'
  const accountDisplay =
    amazon.activeConnection?.shop_domain?.trim() ||
    shellT(lang, 'integrationsStatusConnected')

  const syncInProgress = amazon.amazonSyncPhase === 'working'
  const connectLabel = amazon.sandboxConnect
    ? shellT(lang, 'integrationConnectAmazonSandbox')
    : shellT(lang, 'integrationConnectWithAmazon')

  return (
    <div className="flex w-full flex-col gap-4">
      {amazon.feesUnavailable ? <AmazonFeesUnavailableNotice lang={lang} /> : null}

      {!amazon.isAdmin ? (
        <p className="text-sm text-muted-foreground">{shellT(lang, 'connectionsAdminOnly')}</p>
      ) : amazon.isLoading ? (
        <IntegrationDetailSkeleton />
      ) : amazon.error ? (
        <p className="text-sm text-destructive" role="alert">
          {shellT(lang, 'integrationAmazonLoadFailed')}
        </p>
      ) : !amazon.hasConnection ? (
        <IntegrationConnectPanel
          description={shellT(lang, 'integrationSheetAmazonConnectIntro')}
          title={shellT(lang, 'integrationConnectSectionTitle')}
          disclaimer={shellT(lang, 'integrationDetailAmazonHelper')}
          disclaimerExtra={
            amazon.sandboxConnect ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {shellT(lang, 'integrationAmazonSandboxHint')}
              </p>
            ) : null
          }
        >
          <Button
            type="button"
            variant="accent"
            size="tiny"
            loading={amazon.connectStarting}
            disabled={isFixture}
            onClick={() => {
              if (isFixture) {
                toast.info(shellT(lang, 'fixtureActionDisabled'))
                return
              }
              consent.requestThen(() => void amazon.startConnect())
            }}
          >
            {connectLabel}
          </Button>
        </IntegrationConnectPanel>
      ) : (
        <div className="flex w-full flex-col gap-4">
          <IntegrationEnableCard
            title={shellT(lang, 'integrationEnableTitle')}
            description={shellT(lang, 'integrationEnableDescription')}
            enabled={integrationEnabled}
            onEnabledChange={setIntegrationEnabled}
            switchId="integration-amazon-enabled"
            switchDisabled={syncInProgress || isFixture}
            onDisconnect={isFixture ? undefined : onRequestDisconnect}
            disconnectLabel={shellT(lang, 'integrationDetailDisconnect')}
            disconnectPending={disconnectPending}
          >
            <div className="space-y-2">
              <Label htmlFor={accountId}>{shellT(lang, 'integrationAmazonAccountLabel')}</Label>
              <div
                id={accountId}
                className="flex h-10 min-h-10 min-w-0 items-center overflow-hidden rounded-md border border-border-subtle bg-muted/30 px-2.5 text-sm text-text-primary"
              >
                <span className="min-w-0 truncate">{accountDisplay}</span>
              </div>
            </div>
          </IntegrationEnableCard>

          {integrationEnabled ? (
            <AmazonSyncSection
              lang={lang}
              amazon={amazon}
              isFixture={isFixture}
              planSyncPaused={planSyncPaused}
              onConsentThen={consent.requestThen}
            />
          ) : null}
        </div>
      )}
      <IntegrationConsentDialog
        lang={lang}
        slug="amazon"
        open={consent.open}
        onOpenChange={consent.setOpen}
        onConfirm={consent.confirm}
      />
    </div>
  )
}
