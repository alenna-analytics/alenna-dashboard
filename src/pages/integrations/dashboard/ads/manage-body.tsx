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
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import { Label } from '@/ui/label'
import {
  needsInitialSyncConsent,
  useIntegrationConsentGate,
} from '@/pages/integrations/hooks/use-integration-consent-gate'

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
      : shellT(lang, 'integrationConnectMercadoLibreAds')
  const introKey =
    slug === 'amazon_ads'
      ? 'integrationSheetAmazonAdsConnectIntro'
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

  const runSync = () => {
    if (isFixture) {
      toast.info(shellT(lang, 'fixtureActionDisabled'))
      return
    }
    ads.syncMutation.mutate()
  }

  if (!ads.isAdmin) {
    return <p className="text-sm text-muted-foreground">{shellT(lang, 'connectionsAdminOnly')}</p>
  }
  if (ads.isLoading) return <IntegrationDetailSkeleton />
  if (ads.error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {shellT(lang, 'integrationAmazonLoadFailed')}
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
      {!ads.connected ? (
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
            <IntegrationSyncActionCard
              title={shellT(lang, 'syncSectionTitle')}
              description={shellT(lang, 'integrationAdsSyncDescription')}
              actionLabel={shellT(lang, 'syncRunBtn')}
              onAction={() => {
                if (needsInitialSyncConsent(ads.syncPlan?.last_sync_status)) {
                  consent.requestThen(runSync)
                  return
                }
                runSync()
              }}
              actionDisabled={ads.syncMutation.isPending || isFixture || planSyncPaused}
              actionLoading={ads.syncMutation.isPending}
              footer={`${shellT(lang, 'connectionsLastSynced')}: ${ads.lastSyncDisplay}`}
              className="w-full"
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
