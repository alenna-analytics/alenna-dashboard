import { toast } from 'sonner'
import { useState } from 'react'

import { IntegrationConsentDialog } from '@/pages/integrations/dashboard/integration-consent-dialog'
import { IntegrationDetailSkeleton } from '@/pages/integrations/dashboard/integration-detail-skeleton'
import type { AdsPlatformSlug } from '@/pages/integrations/details/use-ads-integration'
import { useAdsIntegration } from '@/pages/integrations/details/use-ads-integration'
import { isPlanLimitSyncPaused } from '@/lib/plan/plan-limit-ui'
import { PlanLimitSyncAlert } from '@/components/integrations/plan-limit-sync-alert'
import { IntegrationEnableCard } from '@/components/integrations/integration-enable-card'
import { IntegrationSyncActionCard } from '@/components/integrations/integration-sync-action-card'
import { SyncFreshnessPillBadge } from '@/components/integrations/sync-freshness-badge'
import { resolveConnectionSyncFreshnessPillContent } from '@/lib/integrations/sync-freshness'
import { useCancelPlatformSyncJob } from '@/hooks/use-cancel-platform-sync-job'
import { GLOBAL_ACTIVITY_ADS_SYNC_ID } from '@/shell/providers/global-activity-provider'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { SyncPlan } from '@/lib/types/connectors'
import { Button } from '@/ui/button'
import { Label } from '@/ui/label'
import {
  needsInitialSyncConsent,
  useIntegrationConsentGate,
} from '@/pages/integrations/hooks/use-integration-consent-gate'

function lifecycleButtonLabelKey(syncPlan: SyncPlan | null): ShellStringKey {
  const status = syncPlan?.last_sync_status ?? 'not_synced'
  if (status === 'synced' || status === 'partial') return 'syncRefreshBtn'
  if (status === 'failed') return 'syncRetryBtn'
  return 'syncRunBtn'
}

type AdsManageBodyProps = {
  slug: AdsPlatformSlug
  onRequestDisconnect?: () => void
  disconnectPending?: boolean
}

export function AdsManageBody({
  slug,
  onRequestDisconnect,
  disconnectPending,
}: AdsManageBodyProps) {
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const ads = useAdsIntegration(slug)
  const consent = useIntegrationConsentGate()
  const isFixture = Boolean(me?.is_fixture)
  const planSyncPaused = isPlanLimitSyncPaused(me)
  const [integrationEnabled, setIntegrationEnabled] = useState(true)

  const connectLabel =
    slug === 'amazon_ads'
      ? shellT(lang, 'integrationConnectAmazonAds')
      : slug === 'google_ads'
        ? shellT(lang, 'integrationConnectGoogleAds')
        : shellT(lang, 'integrationConnectMercadoLibreAds')
  const introKey: ShellStringKey =
    slug === 'amazon_ads'
      ? 'integrationSheetAmazonAdsConnectIntro'
      : slug === 'google_ads'
        ? 'integrationSheetGoogleAdsConnectIntro'
        : 'integrationSheetMercadoLibreAdsConnectIntro'
  const accountId = `integration-${slug}-account`
  const accountDisplay =
    ads.activeConnection?.shop_domain?.trim() ||
    shellT(lang, 'integrationsStatusConnected')

  const runConnect = () => {
    if (isFixture) {
      toast.info(shellT(lang, 'fixtureActionDisabled'))
      return
    }
    void ads.startConnect()
  }

  if (!ads.isAdmin) {
    return <p className="text-sm text-muted-foreground">{shellT(lang, 'connectionsAdminOnly')}</p>
  }
  if (ads.isLoading) return <IntegrationDetailSkeleton />
  if (ads.error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {shellT(lang, 'integrationLoadFailed')}
      </p>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {ads.caseA ? (
        <p className="text-sm text-text-secondary">{shellT(lang, 'integrationAdsCaseA')}</p>
      ) : null}
      {ads.caseC ? (
        <p className="text-sm text-text-secondary">{shellT(lang, 'integrationAdsCaseC')}</p>
      ) : null}
      {planSyncPaused ? <PlanLimitSyncAlert /> : null}
      {ads.needsAccountSelection ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text-primary">
              {shellT(lang, 'integrationGoogleAdsSelectTitle')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {shellT(lang, 'integrationGoogleAdsSelectDescription')}
            </p>
          </div>
          {ads.pendingAccountsLoading ? (
            <IntegrationDetailSkeleton />
          ) : ads.pendingAccountsError ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive" role="alert">
                {ads.pendingAccountsError}
              </p>
              <Button
                type="button"
                variant="accent"
                size="tiny"
                loading={ads.connectStarting}
                disabled={isFixture}
                onClick={() => consent.requestThen(runConnect)}
              >
                {connectLabel}
              </Button>
            </div>
          ) : ads.pendingCandidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {shellT(lang, 'integrationGoogleAdsSelectEmpty')}
            </p>
          ) : (
            <div className="space-y-3">
              <ul className="flex flex-col gap-2">
                {ads.pendingCandidates.map((candidate) => {
                  const selected = ads.selectedCustomerId === candidate.id
                  return (
                    <li key={candidate.id}>
                      <button
                        type="button"
                        className={
                          selected
                            ? 'flex w-full flex-col items-start rounded-md border border-accent bg-accent/10 px-3 py-2 text-left'
                            : 'flex w-full flex-col items-start rounded-md border border-border-subtle px-3 py-2 text-left hover:bg-muted/40'
                        }
                        onClick={() => ads.setSelectedCustomerId(candidate.id)}
                      >
                        <span className="text-sm font-medium text-text-primary">
                          {candidate.descriptive_name}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {candidate.id}
                          {candidate.currency_code ? ` · ${candidate.currency_code}` : ''}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <Button
                type="button"
                variant="accent"
                size="tiny"
                loading={ads.confirmAccountMutation.isPending}
                disabled={!ads.selectedCustomerId || isFixture}
                onClick={() => {
                  if (!ads.selectedCustomerId) return
                  ads.confirmAccountMutation.mutate(ads.selectedCustomerId)
                }}
              >
                {shellT(lang, 'integrationGoogleAdsSelectConfirm')}
              </Button>
            </div>
          )}
        </div>
      ) : !ads.connected ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{shellT(lang, introKey)}</p>
          <Button
            type="button"
            variant="accent"
            size="tiny"
            loading={ads.connectStarting}
            disabled={isFixture}
            onClick={() => consent.requestThen(runConnect)}
          >
            {connectLabel}
          </Button>
          <p className="text-xs text-muted-foreground">{shellT(lang, 'integrationDetailAdsHelper')}</p>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          <IntegrationEnableCard
            title={shellT(lang, 'integrationEnableTitle')}
            description={shellT(lang, 'integrationAdsEnableDescription')}
            enabled={integrationEnabled}
            onEnabledChange={setIntegrationEnabled}
            switchId={`integration-${slug}-enabled`}
            switchDisabled={isFixture}
            onDisconnect={isFixture ? undefined : onRequestDisconnect}
            disconnectLabel={shellT(lang, 'integrationDetailDisconnect')}
            disconnectPending={disconnectPending}
          >
            <div className="space-y-2">
              <Label htmlFor={accountId}>{shellT(lang, 'integrationAdsAccountLabel')}</Label>
              <div
                id={accountId}
                className="flex h-10 min-h-10 min-w-0 items-center overflow-hidden rounded-md border border-border-subtle bg-muted/30 px-2.5 text-sm text-text-primary"
              >
                <span className="min-w-0 truncate">{accountDisplay}</span>
              </div>
            </div>
          </IntegrationEnableCard>

          {integrationEnabled ? (
            <AdsSyncSection
              ads={ads}
              isFixture={isFixture}
              planSyncPaused={planSyncPaused}
              onConsentThen={consent.requestThen}
            />
          ) : null}
        </div>
      )}
      <IntegrationConsentDialog
        lang={lang}
        slug={slug}
        open={consent.open}
        onOpenChange={consent.setOpen}
        onConfirm={consent.confirm}
      />
    </div>
  )
}

function AdsSyncSection({
  ads,
  isFixture,
  planSyncPaused,
  onConsentThen,
}: {
  ads: ReturnType<typeof useAdsIntegration>
  isFixture: boolean
  planSyncPaused: boolean
  onConsentThen: (action: () => void) => void
}) {
  const { lang } = useLanguage()
  const cancelSyncMutation = useCancelPlatformSyncJob()
  const { syncPlan, adsSyncPhase, adsJobQuery, activeSyncJobId, lastSyncDisplay } = ads
  const syncPill = resolveConnectionSyncFreshnessPillContent(ads.activeConnection, {
    forceSyncing: adsSyncPhase === 'working',
    suppressSyncing: adsSyncPhase === 'done_fail',
  })
  const buttonLabel = shellT(lang, lifecycleButtonLabelKey(syncPlan))

  const runSync = (action: () => void) => {
    if (isFixture) {
      toast.info(shellT(lang, 'fixtureActionDisabled'))
      return
    }
    if (needsInitialSyncConsent(syncPlan?.last_sync_status)) {
      onConsentThen(action)
      return
    }
    action()
  }

  if (adsSyncPhase === 'working') {
    const queued = adsJobQuery.data?.status === 'queued'
    return (
      <IntegrationSyncActionCard
        title={shellT(lang, 'syncSectionTitle')}
        description={queued ? shellT(lang, 'amazonSyncProgressQueued') : shellT(lang, 'syncRunning')}
        actionLabel={shellT(lang, 'syncRunning')}
        onAction={() => {}}
        actionDisabled
        actionLoading
        hideAction
        secondaryActionLabel={ads.isAdmin ? shellT(lang, 'platformSyncCancelBtn') : undefined}
        onSecondaryAction={
          ads.isAdmin && activeSyncJobId
            ? () =>
                cancelSyncMutation.mutate({
                  jobId: activeSyncJobId,
                  activityId: GLOBAL_ACTIVITY_ADS_SYNC_ID,
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

  if (adsSyncPhase === 'done_fail') {
    return (
      <IntegrationSyncActionCard
        title={shellT(lang, 'syncSectionTitle')}
        description={adsJobQuery.data?.error_message ?? shellT(lang, 'integrationConnectFailed')}
        actionLabel={shellT(lang, 'syncRetryBtn')}
        onAction={() => runSync(() => ads.retryAdsSync())}
        actionDisabled={ads.retryAdsSyncPending || isFixture || planSyncPaused}
        actionLoading={ads.retryAdsSyncPending}
        badge={syncPill ? <SyncFreshnessPillBadge pill={syncPill} lang={lang} /> : undefined}
        footer={`${shellT(lang, 'connectionsLastSynced')}: ${lastSyncDisplay}`}
        className="w-full"
      />
    )
  }

  return (
    <IntegrationSyncActionCard
      title={shellT(lang, 'syncSectionTitle')}
      description={shellT(lang, 'integrationAdsSyncDescription')}
      actionLabel={buttonLabel}
      actionLoadingLabel={shellT(lang, 'syncRunning')}
      onAction={() => runSync(() => ads.syncMutation.mutate())}
      actionDisabled={ads.syncMutation.isPending || isFixture || planSyncPaused}
      actionLoading={ads.syncMutation.isPending}
      badge={syncPill ? <SyncFreshnessPillBadge pill={syncPill} lang={lang} /> : undefined}
      footer={`${shellT(lang, 'connectionsLastSynced')}: ${lastSyncDisplay}`}
      className="w-full"
    />
  )
}
