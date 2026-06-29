import { CheckCircle2 } from 'lucide-react'

import { LoadingIcon } from '@/ui/app-icon'
import { useMemo, useRef, useState } from 'react'

import type { ShopifyIntegrationHook } from '@/pages/integrations/details/use-shopify-integration'
import {
  normalizeShopifySubdomainInput,
  SHOPIFY_MYSHOPIFY_SUFFIX,
} from '@/lib/integrations/shopify-format'
import { useLanguage, type Language } from '@/shell/providers/language-provider'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { SyncPlan } from '@/lib/types/connectors'
import { resolveConnectionSyncFreshnessPillContent } from '@/lib/integrations/sync-freshness'
import { formatShopifySyncUserError } from '@/lib/integrations/shopify-sync-user-error'
import { SyncFreshnessPillBadge } from '@/components/integrations/sync-freshness-badge'
import { IntegrationEnableCard } from '@/components/integrations/integration-enable-card'
import { IntegrationSyncActionCard } from '@/components/integrations/integration-sync-action-card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

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

function ShopifySyncSection({ lang, shopify }: { lang: Language; shopify: ShopifyIntegrationHook }) {
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

  const cooldownHelper = useMemo<string | null>(() => {
    if (!syncPlan?.retry_after_seconds || syncPlan.retry_after_seconds <= 0) return null
    if (syncPlan.cooldown_reason !== 'shopify_full_sync_cooldown') return null
    return shellT(lang, 'syncCooldownHelper', { hours: String(ceilHours(syncPlan.retry_after_seconds)) })
  }, [lang, syncPlan])

  if (shopifySyncPhase === 'working') {
    const queued = shopifyJobQuery.data?.status === 'queued'
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

  if (shopifySyncPhase === 'done_ok' && syncPanelBlockSuccess) {
    const b = syncPanelBlockSuccess
    const from = formatYmdMedium(b.minOrderDate, lang)
    const to = formatYmdMedium(b.maxOrderDate, lang)
    const range = from && to ? `${from} — ${to}` : from || to || ''

    return (
      <IntegrationSyncActionCard
        title={shellT(lang, 'integrationSyncDone')}
        description={`${b.recordsSynced.toLocaleString()} ${shellT(lang, 'reportsOrders')} · ${b.catalogProductsUpserted.toLocaleString()} ${shellT(lang, 'syncProductsUpdated')}${range ? ` · ${range}` : ''}`}
        actionLabel={shellT(lang, 'syncRefreshBtn')}
        onAction={() => {}}
        hideAction
        badge={<CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />}
        footer={shellT(lang, 'shopifySyncBlockedHint')}
        className="w-full"
      />
    )
  }

  if (shopifySyncPhase === 'done_fail') {
    return (
      <IntegrationSyncActionCard
        title={shellT(lang, 'syncSectionTitle')}
        description={formatShopifySyncUserError(syncFailedMessage, lang)}
        actionLabel={shellT(lang, 'shopifySyncRetry')}
        onAction={() => retryShopifySync()}
        actionDisabled={retryShopifySyncPending}
        actionLoading={retryShopifySyncPending}
        className="w-full"
      />
    )
  }

  const syncFooter = [
    `${shellT(lang, 'connectionsLastSynced')}: ${lastSyncDisplay}`,
    cooldownHelper,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <IntegrationSyncActionCard
      title={shellT(lang, 'syncSectionTitle')}
      description={shellT(lang, 'syncSectionCardDescription')}
      actionLabel={buttonLabel}
      actionLoadingLabel={shellT(lang, 'syncRunning')}
      onAction={() => syncMutation.mutate()}
      actionDisabled={syncMutation.isPending || Boolean(cooldownHelper)}
      actionLoading={syncMutation.isPending}
      badge={syncPill ? <SyncFreshnessPillBadge pill={syncPill} lang={lang} /> : undefined}
      footer={syncFooter}
      className="w-full"
    />
  )
}

type ShopifyManageBodyProps = {
  shopify: ShopifyIntegrationHook
  onRequestDisconnect?: () => void
  disconnectPending?: boolean
}

export function ShopifyManageBody({
  shopify,
  onRequestDisconnect,
  disconnectPending = false,
}: ShopifyManageBodyProps) {
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
  const [integrationEnabled, setIntegrationEnabled] = useState(true)
  const syncInProgress = shopifySyncPhase === 'working'

  return (
    <div className="flex w-full flex-col gap-4">
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
                  loading={oauthStarting}
                  disabled={!normalizeShopifySubdomainInput(shopInput) || !tenantId}
                  onClick={() => void startOAuth()}
                >
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
          <div className="flex w-full flex-col gap-4">
            <IntegrationEnableCard
              title={shellT(lang, 'integrationEnableTitle')}
              description={shellT(lang, 'integrationEnableDescription')}
              enabled={integrationEnabled}
              onEnabledChange={setIntegrationEnabled}
              switchId="integration-shopify-enabled"
              switchDisabled={syncInProgress}
              onDisconnect={onRequestDisconnect}
              disconnectLabel={shellT(lang, 'integrationDetailDisconnect')}
              disconnectPending={disconnectPending}
            >
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
              </div>
            </IntegrationEnableCard>

            {integrationEnabled ? (
              <>
                <ShopifySyncSection lang={lang} shopify={shopify} />
                {syncMessage ? (
                  <p className="text-xs text-muted-foreground" role="status">
                    {syncMessage}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        )}
    </div>
  )
}
