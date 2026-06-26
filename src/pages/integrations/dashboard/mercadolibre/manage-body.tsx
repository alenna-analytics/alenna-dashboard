import { useState } from 'react'

import { LoadingIcon } from '@/ui/app-icon'
import { IntegrationEnableCard } from '@/components/integrations/integration-enable-card'
import { IntegrationSyncActionCard } from '@/components/integrations/integration-sync-action-card'
import type { MercadoLibreIntegrationHook } from '@/pages/integrations/details/use-mercadolibre-integration'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { SyncPlan } from '@/lib/types/connectors'
import { Button } from '@/ui/button'
import { Label } from '@/ui/label'

type MercadoLibreManageBodyProps = {
  meli: MercadoLibreIntegrationHook
  onRequestDisconnect?: () => void
  disconnectPending?: boolean
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
  lang: string
  meli: MercadoLibreIntegrationHook
}) {
  const buttonLabel = shellT(lang, lifecycleButtonLabelKey(meli.syncPlan))

  return (
    <IntegrationSyncActionCard
      title={shellT(lang, 'syncSectionTitle')}
      description={shellT(lang, 'syncSectionDescriptionMercadoLibre')}
      actionLabel={buttonLabel}
      actionLoadingLabel={shellT(lang, 'syncRunning')}
      onAction={() => meli.syncMutation.mutate()}
      actionDisabled={meli.syncMutation.isPending}
      actionLoading={meli.syncMutation.isPending}
      footer={`${shellT(lang, 'connectionsLastSynced')}: ${meli.lastSyncDisplay}`}
      className="w-full"
    />
  )
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

  const syncInProgress =
    meli.syncMutation.isPending || meli.syncPlan?.last_sync_status === 'syncing'

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
            disabled={meli.oauthStarting}
            onClick={() => void meli.startOAuth()}
          >
            {meli.oauthStarting ? (
              <LoadingIcon className="size-4 shrink-0" />
            ) : null}
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
