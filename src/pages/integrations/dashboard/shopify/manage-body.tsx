import { CheckCircle2, Loader2 } from 'lucide-react'
import { useMemo } from 'react'

import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'
import type { ShopifyIntegrationHook } from '@/pages/integrations/details/use-shopify-integration'
import type { ManagedIntegration } from '@/lib/integrations/catalog'
import {
  normalizeShopifySubdomainInput,
  SHOPIFY_MYSHOPIFY_SUFFIX,
} from '@/lib/integrations/shopify-format'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { SyncPlan } from '@/lib/types/connectors'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Separator } from '@/ui/separator'
import { SheetHeader, SheetTitle } from '@/ui/sheet'

function formatYmdMedium(value: string | null, lang: string): string {
  if (!value) return ''
  const ymd = value.length >= 10 ? value.slice(0, 10) : value
  if (!/^\d{4}-\d{2}-\d{2}/.test(ymd)) return ''
  const d = new Date(`${ymd}T12:00:00`)
  return new Intl.DateTimeFormat(lang === 'en' ? 'en' : 'es', { dateStyle: 'medium' }).format(d)
}

function ceilHours(seconds: number | null | undefined): number {
  if (seconds == null || seconds <= 0) return 0
  return Math.max(1, Math.ceil(seconds / 3600))
}

function lifecycleButtonLabelKey(syncPlan: SyncPlan | null): ShellStringKey {
  const status = syncPlan?.last_sync_status ?? 'not_synced'
  if (status === 'synced' || status === 'partial') return 'syncRefreshBtn'
  if (status === 'failed') return 'syncRetryBtn'
  return 'syncRunBtn'
}

export function SheetHeaderWithLogo({
  definition,
  title,
}: {
  definition: ManagedIntegration
  title: string
}) {
  return (
    <SheetHeader className="flex flex-row items-center gap-3">
      <IntegrationLogo src={definition.logoSrc} alt={title} size="xl" className="pt-0.5" />
      <div className="min-w-0 flex-1 space-y-1">
        <SheetTitle>{title}</SheetTitle>
      </div>
    </SheetHeader>
  )
}

function ShopifyIntroCopy({ lang }: { lang: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      {shellT(lang, 'integrationSheetShopifyConnectIntro')}
    </p>
  )
}

function ShopifySyncSection({ lang, shopify }: { lang: string; shopify: ShopifyIntegrationHook }) {
  const {
    lastSyncDisplay,
    syncMutation,
    shopifySyncPhase,
    shopifyJobQuery,
    ordersProcessed,
    oldestProcessedYear,
    syncPanelBlockSuccess,
    syncFailedMessage,
    retryShopifySync,
    retryShopifySyncPending,
    syncPlan,
  } = shopify

  const buttonLabel = shellT(lang, lifecycleButtonLabelKey(syncPlan))

  const helperText = useMemo<string | null>(() => {
    if (!syncPlan) return shellT(lang, 'syncFullHistoryHelper', { startYear: '' })
    const startYear = syncPlan.full_history_window.start_date.slice(0, 4)
    const hasActual = Boolean(syncPlan.actual_min_created_at && syncPlan.actual_max_created_at)
    if (hasActual) {
      const min = formatYmdMedium(syncPlan.actual_min_created_at, lang)
      const max = formatYmdMedium(syncPlan.actual_max_created_at, lang)
      const count = syncPlan.last_sync_records_count ?? 0
      const coverage = shellT(lang, 'syncCoverageHelper', {
        count: count.toLocaleString(),
        actualMin: min,
        actualMax: max,
      })
      const isNoOp =
        syncPlan.last_sync_records_count === 0 &&
        (syncPlan.last_sync_records_touched_count ?? 0) === 0
      if (isNoOp) return `${shellT(lang, 'syncNoNewOrdersHelper')} ${coverage}`
      return coverage
    }
    return shellT(lang, 'syncFullHistoryHelper', { startYear })
  }, [lang, syncPlan])

  const cooldownHelper = useMemo<string | null>(() => {
    if (!syncPlan?.retry_after_seconds || syncPlan.retry_after_seconds <= 0) return null
    if (syncPlan.cooldown_reason !== 'shopify_full_sync_cooldown') return null
    return shellT(lang, 'syncCooldownHelper', { hours: String(ceilHours(syncPlan.retry_after_seconds)) })
  }, [lang, syncPlan])

  if (shopifySyncPhase === 'working') {
    const job = shopifyJobQuery.data
    const queued = job?.status === 'queued'
    const subtitle =
      ordersProcessed != null && !Number.isNaN(ordersProcessed) && oldestProcessedYear != null
        ? shellT(lang, 'syncProgressLabel', {
            year: String(oldestProcessedYear),
            count: ordersProcessed.toLocaleString(),
          })
        : queued
          ? shellT(lang, 'shopifySyncProgressQueued')
          : shellT(lang, 'syncRunning')

    return (
      <div className="space-y-4">
        <div className="flex gap-3 rounded-md border border-border-subtle bg-bg-section p-4 shadow-[var(--glass-shadow)] backdrop-blur-xl">
          <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-text-primary">
              {shellT(lang, 'shopifySyncProgressTitle')}
            </p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            {job?.created_by_user_id === null ? (
              <p className="text-xs text-muted-foreground">{shellT(lang, 'jobTriggeredBySystem')}</p>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  if (shopifySyncPhase === 'done_ok' && syncPanelBlockSuccess) {
    const b = syncPanelBlockSuccess
    const from = formatYmdMedium(b.minOrderDate, lang)
    const to = formatYmdMedium(b.maxOrderDate, lang)
    const range = from && to ? `${from} — ${to}` : from || to || ''

    return (
      <div className="space-y-4">
        <div className="rounded-md border border-border-subtle bg-bg-section p-4 text-sm shadow-[var(--glass-shadow)] backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-1.5 font-medium text-text-primary">
            <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
            {shellT(lang, 'integrationSyncDone')}
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="text-sm text-text-primary">
              {b.recordsSynced.toLocaleString()} {shellT(lang, 'reportsOrders')}
            </li>
            <li>
              {b.catalogProductsUpserted.toLocaleString()} {shellT(lang, 'syncProductsUpdated')}
            </li>
            {range ? (
              <li>
                {shellT(lang, 'shopifySyncDateRange')}: {range}
              </li>
            ) : null}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{shellT(lang, 'shopifySyncBlockedHint')}</p>
        </div>
      </div>
    )
  }

  if (shopifySyncPhase === 'done_fail') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive" role="alert">
          {syncFailedMessage ?? shellT(lang, 'syncErrorLabel')}
        </p>
        <Button
          type="button"
          className="w-full"
          variant="secondary"
          disabled={retryShopifySyncPending}
          onClick={() => retryShopifySync()}
        >
          {retryShopifySyncPending ? (
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          ) : null}
          {shellT(lang, 'shopifySyncRetry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-text-primary">{shellT(lang, 'syncSectionTitle')}</p>
        <p className="text-xs text-muted-foreground">{shellT(lang, 'syncSectionDescription')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="w-full"
          disabled={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
        >
          {syncMutation.isPending ? (
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          ) : null}
          {syncMutation.isPending ? shellT(lang, 'syncRunning') : buttonLabel}
        </Button>
      </div>

      {helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}

      {cooldownHelper ? (
        <p className="text-xs text-muted-foreground">{cooldownHelper}</p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {shellT(lang, 'connectionsLastSynced')}: {lastSyncDisplay}
      </p>
    </div>
  )
}

export function ShopifyManageBody({
  definition,
  shopify,
}: {
  definition: ManagedIntegration
  shopify: ShopifyIntegrationHook
}) {
  const { lang } = useLanguage()
  const {
    tenantId,
    isAdmin,
    shopInput,
    setShopInput,
    startOAuth,
    oauthStarting,
    isLoading,
    error,
    activeConnection,
    connected,
    previewMessage,
    syncMessage,
    shopifySyncPhase,
  } = shopify

  const name = definition.nameKey ? shellT(lang, definition.nameKey) : definition.catalogName
  const storeId = 'integration-shop-domain-sheet'
  const shopSubdomain = normalizeShopifySubdomainInput(activeConnection?.shop_domain ?? '')

  return (
    <>
      <SheetHeaderWithLogo definition={definition} title={name} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
        {!isAdmin ? (
          <p className="text-sm text-muted-foreground">{shellT(lang, 'connectionsAdminOnly')}</p>
        ) : isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {shellT(lang, 'connectionsLoading')}
          </p>
        ) : error ? (
          <p className="text-sm text-destructive" role="alert">
            {error instanceof Error ? error.message : String(error)}
          </p>
        ) : !connected ? (
          <div className="space-y-4">
            <ShopifyIntroCopy lang={lang} />
            <div className="space-y-2">
              <Label htmlFor={storeId}>{shellT(lang, 'connectionsConnectShopLabel')}</Label>
              <div
                className="flex h-10 min-h-10 min-w-0 items-stretch overflow-hidden rounded-sm bg-background backdrop-blur-xl focus-within:ring-3 focus-within:ring-ring/45 focus-within:ring-offset-0"
                role="group"
                aria-label={shellT(lang, 'connectionsConnectShopLabel')}
              >
                <Input
                  variant="bare"
                  id={storeId}
                  placeholder={shellT(lang, 'connectionsConnectShopPlaceholder')}
                  value={shopInput}
                  onChange={(e) =>
                    setShopInput(normalizeShopifySubdomainInput(e.target.value))
                  }
                  autoComplete="off"
                  className="h-full min-h-0 flex-1 rounded-none px-2.5 py-0"
                />
                <span
                  className="flex shrink-0 items-center border-l border-border-subtle/80 bg-muted px-3 text-sm text-muted-foreground"
                  aria-hidden
                >
                  {SHOPIFY_MYSHOPIFY_SUFFIX}
                </span>
              </div>
            </div>
            <Button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
              size="default"
              disabled={
                oauthStarting || !normalizeShopifySubdomainInput(shopInput) || !tenantId
              }
              onClick={() => void startOAuth()}
            >
              {oauthStarting ? (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              ) : null}
              {shellT(lang, 'integrationConnectWithShopify')}
            </Button>
            {previewMessage && !oauthStarting ? (
              <p className="text-sm text-destructive" role="alert">
                {previewMessage}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {shellT(lang, 'integrationDetailHeroHelper')}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-4">
              {shopifySyncPhase === 'idle' ? <ShopifyIntroCopy lang={lang} /> : null}
              <div className="space-y-2">
                <Label htmlFor={`${storeId}-ro`}>
                  {shellT(lang, 'connectionsConnectShopLabel')}
                </Label>
                <div
                  className="flex h-10 min-h-10 min-w-0 items-stretch overflow-hidden rounded-sm border border-input bg-muted/60 text-sm text-foreground"
                  role="group"
                  aria-label={shellT(lang, 'connectionsConnectShopLabel')}
                >
                  <div
                    id={`${storeId}-ro`}
                    className="min-w-0 flex-1 truncate px-2.5 py-2 text-muted-foreground"
                  >
                    {shopSubdomain}
                  </div>
                  <span
                    className="flex shrink-0 items-center border-l border-input bg-muted px-3 text-sm text-muted-foreground"
                    aria-hidden
                  >
                    {SHOPIFY_MYSHOPIFY_SUFFIX}
                  </span>
                </div>
                {shopifySyncPhase === 'idle' ? (
                  <p className="text-xs text-muted-foreground">
                    {shellT(lang, 'integrationDetailHeroHelper')}
                  </p>
                ) : null}
              </div>
            </div>

            <Separator />

            <ShopifySyncSection lang={lang} shopify={shopify} />

            {syncMessage ? (
              <p className="text-xs text-muted-foreground" role="status">
                {syncMessage}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </>
  )
}
