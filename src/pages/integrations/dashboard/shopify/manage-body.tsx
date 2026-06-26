import { CheckCircle2 } from 'lucide-react'

import { LoadingIcon } from '@/ui/app-icon'
import { useMemo, useRef } from 'react'

import type { ShopifyIntegrationHook } from '@/pages/integrations/details/use-shopify-integration'
import {
  normalizeShopifySubdomainInput,
  SHOPIFY_MYSHOPIFY_SUFFIX,
} from '@/lib/integrations/shopify-format'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { SyncPlan } from '@/lib/types/connectors'
import { resolveConnectionSyncFreshnessPillContent } from '@/lib/integrations/sync-freshness'
import { SyncFreshnessPillBadge } from '@/components/integrations/sync-freshness-badge'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Separator } from '@/ui/separator'

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

function shopifyDomainInputWidthCh(value: string, placeholder: string): number {
  const visibleLength = value.length > 0 ? value.length : placeholder.length
  return Math.max(visibleLength, 3)
}

function ShopifyDomainInlineField({
  id,
  value,
  placeholder,
  onChange,
  readOnly = false,
}: {
  id: string
  value: string
  placeholder: string
  onChange?: (value: string) => void
  readOnly?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const widthCh = shopifyDomainInputWidthCh(value, placeholder)

  const focusInput = () => {
    inputRef.current?.focus()
  }

  if (readOnly) {
    return (
      <div
        id={id}
        className="flex min-w-0 flex-1 items-center truncate px-3 font-mono text-sm text-text-primary"
      >
        <span className="truncate">{value}</span>
        <span className="shrink-0 text-text-tertiary">{SHOPIFY_MYSHOPIFY_SUFFIX}</span>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-10 min-w-0 flex-1 cursor-text items-center px-3"
      onPointerDown={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('input, button, a')) return
        e.preventDefault()
        focusInput()
      }}
    >
      <div className="inline-flex min-w-0 items-center">
        <Input
          ref={inputRef}
          variant="bare"
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(normalizeShopifySubdomainInput(e.target.value))}
          autoComplete="off"
          spellCheck={false}
          className="h-10 min-h-0 w-auto min-w-0 max-w-full shrink-0 rounded-none px-0 py-0 font-mono text-sm text-text-primary caret-text-primary placeholder:text-text-tertiary field-sizing-content"
          style={{ width: `${widthCh}ch` }}
        />
        <span className="shrink-0 font-mono text-sm text-text-tertiary">
          {SHOPIFY_MYSHOPIFY_SUFFIX}
        </span>
      </div>
    </div>
  )
}

function ShopifySyncSection({ lang, shopify }: { lang: string; shopify: ShopifyIntegrationHook }) {
  const {
    activeConnection,
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

  const syncPill = resolveConnectionSyncFreshnessPillContent(activeConnection, {
    forceSyncing: shopifySyncPhase === 'working',
  })

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
        <div className="flex gap-3 rounded-md border border-border-subtle bg-white p-4">
          <LoadingIcon className="size-5 shrink-0 text-muted-foreground" />
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
        <div className="rounded-md border border-border-subtle bg-white p-4 text-sm">
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
          variant="primary"
          disabled={retryShopifySyncPending}
          onClick={() => retryShopifySync()}
        >
          {retryShopifySyncPending ? (
            <LoadingIcon className="size-4 shrink-0" />
          ) : null}
          {shellT(lang, 'shopifySyncRetry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-text-primary">{shellT(lang, 'syncSectionTitle')}</p>
          {syncPill ? <SyncFreshnessPillBadge pill={syncPill} lang={lang} /> : null}
        </div>
        <p className="text-xs text-muted-foreground">{shellT(lang, 'syncSectionDescription')}</p>
        {syncPill ? (
          <p className="text-xs text-muted-foreground">{shellT(lang, 'syncFreshnessManageLine')}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="w-full"
          disabled={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
        >
          {syncMutation.isPending ? (
            <LoadingIcon className="size-4 shrink-0" />
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

export function ShopifyManageBody({ shopify }: { shopify: ShopifyIntegrationHook }) {
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

  const storeId = 'integration-shop-domain'
  const shopSubdomain = normalizeShopifySubdomainInput(activeConnection?.shop_domain ?? '')
  const shopPlaceholder = shellT(lang, 'connectionsConnectShopPlaceholder')

  return (
    <div className="flex max-w-2xl flex-col gap-6">
        {!isAdmin ? (
          <p className="text-sm text-muted-foreground">{shellT(lang, 'connectionsAdminOnly')}</p>
        ) : isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingIcon className="size-4" />
            {shellT(lang, 'connectionsLoading')}
          </p>
        ) : error ? (
          <p className="text-sm text-destructive" role="alert">
            {error instanceof Error ? error.message : String(error)}
          </p>
        ) : !connected ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={storeId}>{shellT(lang, 'connectionsConnectShopLabel')}</Label>
              <div
                className="flex min-h-10 min-w-0 items-stretch overflow-hidden rounded-md border border-border-subtle bg-muted/30 focus-within:border-border-default focus-within:ring-3 focus-within:ring-ring/45 focus-within:ring-offset-0"
                role="group"
                aria-label={shellT(lang, 'connectionsConnectShopLabel')}
              >
                <ShopifyDomainInlineField
                  id={storeId}
                  value={shopInput}
                  placeholder={shopPlaceholder}
                  onChange={setShopInput}
                />
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  className="my-1.5 mr-1.5 shrink-0 self-center rounded-md px-3"
                  disabled={
                    oauthStarting || !normalizeShopifySubdomainInput(shopInput) || !tenantId
                  }
                  onClick={() => void startOAuth()}
                >
                  {oauthStarting ? (
                    <LoadingIcon className="size-4 shrink-0" />
                  ) : null}
                  {shellT(lang, 'integrationConnectWithShopify')}
                </Button>
              </div>
            </div>
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
              <div className="space-y-2">
                <Label htmlFor={`${storeId}-ro`}>
                  {shellT(lang, 'connectionsConnectShopLabel')}
                </Label>
                <div
                  className="flex h-10 min-h-10 min-w-0 items-stretch overflow-hidden rounded-md border border-border-subtle bg-muted/30 text-sm text-foreground"
                  role="group"
                  aria-label={shellT(lang, 'connectionsConnectShopLabel')}
                >
                  <ShopifyDomainInlineField
                    id={`${storeId}-ro`}
                    value={shopSubdomain}
                    placeholder={shopPlaceholder}
                    readOnly
                  />
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
  )
}
