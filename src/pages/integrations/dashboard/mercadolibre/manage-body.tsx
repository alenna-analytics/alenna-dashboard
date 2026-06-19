import { LoadingIcon } from '@/ui/app-icon'

import type { MercadoLibreIntegrationHook } from '@/pages/integrations/details/use-mercadolibre-integration'
import type { ManagedIntegration } from '@/lib/integrations/catalog'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { SyncPlan } from '@/lib/types/connectors'
import { Button } from '@/ui/button'
import { Label } from '@/ui/label'
import { Separator } from '@/ui/separator'
import { SheetHeaderWithLogo } from '@/pages/integrations/dashboard/shopify/manage-body'

type MercadoLibreManageBodyProps = {
  definition: ManagedIntegration
  meli: MercadoLibreIntegrationHook
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
    <div className="space-y-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-text-primary">{shellT(lang, 'syncSectionTitle')}</p>
        <p className="text-xs text-muted-foreground">
          {shellT(lang, 'syncSectionDescriptionMercadoLibre')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="w-full"
          disabled={meli.syncMutation.isPending}
          onClick={() => meli.syncMutation.mutate()}
        >
          {meli.syncMutation.isPending ? (
            <LoadingIcon className="size-4 shrink-0" />
          ) : null}
          {meli.syncMutation.isPending ? shellT(lang, 'syncRunning') : buttonLabel}
        </Button>
      </div>

      {meli.syncMessage ? (
        <p className="text-xs text-muted-foreground" role="status">
          {meli.syncMessage}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {shellT(lang, 'connectionsLastSynced')}: {meli.lastSyncDisplay}
      </p>
    </div>
  )
}

export function MercadoLibreManageBody({ definition, meli }: MercadoLibreManageBodyProps) {
  const { lang } = useLanguage()
  const name = definition.nameKey
    ? shellT(lang, definition.nameKey)
    : definition.catalogName

  const accountId = 'integration-meli-account-sheet'
  const accountDisplay =
    meli.activeConnection?.shop_domain?.trim() ||
    shellT(lang, 'integrationsStatusConnected')

  return (
    <>
      <SheetHeaderWithLogo definition={definition} title={name} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
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
          <div className="space-y-5">
            <div className="space-y-4">
              <MercadoLibreIntroCopy lang={lang} />
              <div className="space-y-2">
                <Label htmlFor={accountId}>{shellT(lang, 'integrationMercadoLibreAccountLabel')}</Label>
                <div
                  id={accountId}
                  className="flex h-10 min-h-10 min-w-0 items-center overflow-hidden rounded-sm border border-input bg-muted/60 px-2.5 text-sm text-muted-foreground"
                >
                  <span className="min-w-0 truncate">{accountDisplay}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {shellT(lang, 'integrationDetailMercadoLibreHelper')}
                </p>
              </div>
            </div>

            <Separator />

            <MercadoLibreSyncSection lang={lang} meli={meli} />
          </div>
        )}
      </div>
    </>
  )
}
