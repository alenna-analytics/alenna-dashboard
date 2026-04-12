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
import { Button } from '@/ui/button'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Separator } from '@/ui/separator'
import { SheetHeader, SheetTitle } from '@/ui/sheet'
// ── shared header ─────────────────────────────────────────────────────────────

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

// ── internal helpers ──────────────────────────────────────────────────────────

function ShopifyIntroCopy({ lang }: { lang: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      {shellT(lang, 'integrationSheetShopifyConnectIntro')}
    </p>
  )
}

type ShopifySyncSectionProps = {
  lang: string
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
  lastSyncDisplay: string
  syncMutation: ShopifyIntegrationHook['syncMutation']
}

function ShopifySyncSection({
  lang,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  lastSyncDisplay,
  syncMutation,
}: ShopifySyncSectionProps) {
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
        {syncMutation.isPending
          ? shellT(lang, 'syncRunning')
          : shellT(lang, 'syncRunBtn')}
      </Button>

      {syncMutation.isSuccess && syncMutation.data ? (
        <div className="rounded-lg border border-white/40 bg-white/[0.35] p-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_24px_rgba(65,74,97,0.06)] backdrop-blur-md">
          <div className="mb-2 flex items-center gap-1.5 font-medium text-text-primary">
            <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
            {shellT(lang, 'integrationSyncDone')}
          </div>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            <li>{syncMutation.data.records_synced}</li>
            {syncMutation.data.catalog_products_upserted > 0 ? (
              <li>
                {syncMutation.data.catalog_products_upserted} {shellT(lang, 'syncProductsUpdated')}
              </li>
            ) : null}
            {syncMutation.data.min_order_date && syncMutation.data.max_order_date ? (
              <li>
                {syncMutation.data.min_order_date} → {syncMutation.data.max_order_date}
              </li>
            ) : null}
          </ul>
        </div>
      ) : syncMutation.isError ? (
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

// ── main export ───────────────────────────────────────────────────────────────

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
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    syncMutation,
    lastSyncDisplay,
  } = shopify

  const name = definition.nameKey
    ? shellT(lang, definition.nameKey)
    : definition.catalogName
  const storeId = 'integration-shop-domain-sheet'
  const shopSubdomain = normalizeShopifySubdomainInput(
    activeConnection?.shop_domain ?? '',
  )

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
                className="flex h-10 min-h-10 min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-background shadow-xs ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                role="group"
                aria-label={shellT(lang, 'connectionsConnectShopLabel')}
              >
                <Input
                  id={storeId}
                  placeholder={shellT(lang, 'connectionsConnectShopPlaceholder')}
                  value={shopInput}
                  onChange={(e) =>
                    setShopInput(normalizeShopifySubdomainInput(e.target.value))
                  }
                  autoComplete="off"
                  className="h-full min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-2.5 py-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <span
                  className="flex shrink-0 items-center border-l border-input bg-muted px-3 text-sm text-muted-foreground"
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
                oauthStarting ||
                !normalizeShopifySubdomainInput(shopInput) ||
                !tenantId
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
              <ShopifyIntroCopy lang={lang} />
              <div className="space-y-2">
                <Label htmlFor={`${storeId}-ro`}>
                  {shellT(lang, 'connectionsConnectShopLabel')}
                </Label>
                <div
                  className="flex h-10 min-h-10 min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-muted/60 text-sm text-foreground shadow-xs"
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
                <p className="text-xs text-muted-foreground">
                  {shellT(lang, 'integrationDetailHeroHelper')}
                </p>
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

            <ShopifySyncSection
              lang={lang}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              lastSyncDisplay={lastSyncDisplay}
              syncMutation={syncMutation}
            />
          </div>
        )}
      </div>
    </>
  )
}
