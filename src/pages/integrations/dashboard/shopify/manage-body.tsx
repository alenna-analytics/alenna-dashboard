import { CheckCircle2, Loader2 } from 'lucide-react'

import { IntegrationLogo } from '@/pages/integrations/details/integration-logo'
import type { ShopifyIntegrationHook } from '@/pages/integrations/details/use-shopify-integration'
import type { ManagedIntegration } from '@/lib/integrations/catalog'
import {
  normalizeShopifySubdomainInput,
  SHOPIFY_MYSHOPIFY_SUFFIX,
} from '@/lib/integrations/shopify-format'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import { toYmd } from '@/pages/reports/reports-ui-helpers'
import { Button } from '@/ui/button'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Separator } from '@/ui/separator'
import { SheetHeader, SheetTitle } from '@/ui/sheet'

function formatYmdMedium(ymd: string | null, lang: string): string {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}/.test(ymd)) return ''
  const d = new Date(`${ymd.slice(0, 10)}T12:00:00`)
  return new Intl.DateTimeFormat(lang === 'en' ? 'en' : 'es', {
    dateStyle: 'medium',
  }).format(d)
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
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    lastSyncDisplay,
    syncMutation,
    shopifySyncPhase,
    shopifyJobQuery,
    ordersProcessed,
    syncPage,
    syncPanelBlockSuccess,
    syncFailedMessage,
    retryShopifySync,
    retryShopifySyncPending,
  } = shopify

  if (shopifySyncPhase === 'working') {
    const job = shopifyJobQuery.data
    const queued = job?.status === 'queued'
    const ordersLine =
      ordersProcessed != null && !Number.isNaN(ordersProcessed)
        ? `${shellT(lang, 'shopifySyncProgressOrders')}: ${ordersProcessed.toLocaleString()}`
        : null
    const pageLine =
      syncPage != null && !Number.isNaN(syncPage)
        ? `${shellT(lang, 'shopifySyncProgressPages')}: ${syncPage}`
        : null

    return (
      <div className="space-y-4">
        <div className="flex gap-3 rounded-md border border-border-subtle bg-bg-section p-4 shadow-[var(--glass-shadow)] backdrop-blur-xl">
          <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-text-primary">
              {shellT(lang, 'shopifySyncProgressTitle')}
            </p>
            <p className="text-xs text-muted-foreground">
              {queued ? shellT(lang, 'shopifySyncProgressQueued') : shellT(lang, 'syncRunning')}
            </p>
            {ordersLine ? <p className="text-sm text-text-primary">{ordersLine}</p> : null}
            {pageLine ? <p className="text-xs text-muted-foreground">{pageLine}</p> : null}
          </div>
        </div>
      </div>
    )
  }

  if (shopifySyncPhase === 'done_ok' && syncPanelBlockSuccess) {
    const b = syncPanelBlockSuccess
    const from = formatYmdMedium(b.minOrderDate, lang)
    const to = formatYmdMedium(b.maxOrderDate, lang)
    const range =
      from && to ? `${from} — ${to}` : from || to || ''

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

  const pickerStrings: DateRangePickerStrings = {
    startLabel: shellT(lang, 'connectionsDateFrom'),
    endLabel: shellT(lang, 'connectionsDateTo'),
    applyLabel: shellT(lang, 'datePickerApply'),
    presetCustom: shellT(lang, 'datePickerCustom'),
    presetLast7Days: shellT(lang, 'datePickerLast7Days'),
    presetLast30Days: shellT(lang, 'datePickerLast30Days'),
    presetLast3Months: shellT(lang, 'datePickerLast3Months'),
    presetLast12Months: shellT(lang, 'datePickerLast12Months'),
    presetCurrentMonth: shellT(lang, 'datePickerCurrentMonth'),
    presetCurrentQuarter: shellT(lang, 'datePickerCurrentQuarter'),
    presetYtd: shellT(lang, 'datePickerYtd'),
    presetLastYear: shellT(lang, 'datePickerLastYear'),
  }

  return (
    <div className="space-y-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-text-primary">{shellT(lang, 'syncSectionTitle')}</p>
        <p className="text-xs text-muted-foreground">{shellT(lang, 'syncSectionDescription')}</p>
      </div>

      <DateRangePicker
        strings={pickerStrings}
        startValue={dateFrom}
        endValue={dateTo}
        onStartChange={(v) => setDateFrom(v ?? '')}
        onEndChange={(v) => setDateTo(v ?? '')}
        filterLabel={shellT(lang, 'filterDateTimeLabel')}
        clearAriaLabel={shellT(lang, 'filterClear')}
        onClear={() => {
          const today = new Date()
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(today.getDate() - 29)
          setDateFrom(toYmd(thirtyDaysAgo))
          setDateTo(toYmd(today))
        }}
      />

      <Button
        type="button"
        className="w-full"
        disabled={syncMutation.isPending || !dateFrom || !dateTo}
        onClick={() => syncMutation.mutate()}
      >
        {syncMutation.isPending ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        ) : null}
        {syncMutation.isPending ? shellT(lang, 'syncRunning') : shellT(lang, 'syncRunBtn')}
      </Button>

      {syncMutation.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {syncMutation.error instanceof Error
            ? syncMutation.error.message
            : shellT(lang, 'syncErrorLabel')}
        </p>
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
    activeConnectionId,
    disconnectMutation,
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
              size="lg"
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
              <Button
                type="button"
                variant="outline"
                className="inline-flex w-full items-center justify-center gap-2 border-destructive/35 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                disabled={disconnectMutation.isPending || !activeConnectionId}
                onClick={() => disconnectMutation.mutate()}
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                ) : null}
                {shellT(lang, 'integrationDetailDisconnect')}
              </Button>
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
