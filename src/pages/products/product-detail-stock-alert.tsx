import { Calendar, CalendarDays, ChevronDown, Clock, Gauge, Package, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import type { StockRuleApi } from '@/lib/types/alert-rules'
import type { AlertItemApi, AlertPostponeDuration } from '@/lib/types/alerts'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi, StockAlertLevel } from '@/lib/types/catalog'
import {
  useAlertsListQuery,
  usePostponeAlertMutation,
} from '@/pages/dashboard/use-alerts-queries'
import { effectiveStockAlertLevel } from '@/pages/configuration/alarms/stock/use-stock-alert-display'
import { useStockRuleQuery } from '@/pages/configuration/alarms/stock/use-alert-rules-queries'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { buttonVariants } from '@/ui/button'
import { LoadingIcon } from '@/ui/app-icon'
import { cn } from '@/lib/utils'

import { productPlatformLabel } from './product-platform-label'
import { displayStockQuantity } from './product-stock-alert-ui'

type ProductDetailStockAlertProps = {
  detail: ProductDetailApi
  productId: string
  t: (key: ShellStringKey) => string
}

type ProductDetailAlertRow = {
  platformSlug: string
  platformLabel: string
  level: Extract<StockAlertLevel, 'low' | 'out'>
  stockQuantity: number | null
  listingIds: string[]
  alertIds: string[]
}

const POSTPONE_DURATIONS = ['1h', '1d', '1w'] as const satisfies readonly AlertPostponeDuration[]

const postponeLabelKey: Record<AlertPostponeDuration, ShellStringKey> = {
  '1h': 'homeAlertsDialogPostpone1h',
  '1d': 'homeAlertsDialogPostpone1d',
  '1w': 'homeAlertsDialogPostpone1w',
}

function alertLevelRank(level: StockAlertLevel): number {
  if (level === 'out') return 2
  if (level === 'low') return 1
  return 0
}

function normalizeId(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase()
  return trimmed ? trimmed : null
}

function activeStockAlertsForProduct(
  alerts: AlertItemApi[] | undefined,
  productId: string | undefined,
  listingIds: string[],
): AlertItemApi[] {
  const normalizedProductId = normalizeId(productId)
  const listingIdSet = new Set(
    listingIds.map((id) => normalizeId(id)).filter((id): id is string => id != null),
  )

  return (alerts ?? []).filter((alert) => {
    if (alert.alert_type !== 'stock') return false
    const alertProductId = normalizeId(alert.product_id)
    if (normalizedProductId && alertProductId === normalizedProductId) return true
    const entityId = normalizeId(alert.entity_id)
    return entityId != null && listingIdSet.has(entityId)
  })
}

function resolveAlertIdsForRow(
  activeAlerts: AlertItemApi[],
  platformSlug: string,
  listingIds: string[],
): string[] {
  const listingIdSet = new Set(
    listingIds.map((id) => normalizeId(id)).filter((id): id is string => id != null),
  )
  const matched = new Set<string>()

  for (const alert of activeAlerts) {
    const entityId = normalizeId(alert.entity_id)
    const alertPlatform = normalizeId(alert.platform)
    const matchesListing = entityId != null && listingIdSet.has(entityId)
    const matchesPlatform = alertPlatform === platformSlug
    if (matchesListing || matchesPlatform) {
      matched.add(alert.id)
    }
  }

  return Array.from(matched)
}

function buildAlertRows(
  summary: ProductDetailApi['stock_alert_summary'],
  rule: StockRuleApi | undefined,
  activeAlerts: AlertItemApi[],
  t: (key: ShellStringKey) => string,
): ProductDetailAlertRow[] {
  const byPlatform = new Map<string, ProductDetailAlertRow>()

  for (const alert of summary ?? []) {
    const level = effectiveStockAlertLevel(alert.stock_alert, rule)
    if (level !== 'low' && level !== 'out') continue

    const platformSlug = alert.platform?.trim().toLowerCase()
    if (!platformSlug) continue

    const stockQuantity = displayStockQuantity(alert.stock_quantity)
    const existing = byPlatform.get(platformSlug)

    if (!existing || alertLevelRank(level) > alertLevelRank(existing.level)) {
      const listingIds = alert.listing_id ? [alert.listing_id] : []
      byPlatform.set(platformSlug, {
        platformSlug,
        platformLabel: productPlatformLabel(alert.platform, t),
        level,
        stockQuantity,
        listingIds,
        alertIds: resolveAlertIdsForRow(activeAlerts, platformSlug, listingIds),
      })
      continue
    }

    if (alert.listing_id && !existing.listingIds.includes(alert.listing_id)) {
      existing.listingIds.push(alert.listing_id)
    }

    if (
      existing.level === level
      && stockQuantity != null
      && (existing.stockQuantity == null || stockQuantity < existing.stockQuantity)
    ) {
      existing.stockQuantity = stockQuantity
    }

    existing.alertIds = resolveAlertIdsForRow(activeAlerts, platformSlug, existing.listingIds)
  }

  return Array.from(byPlatform.values()).sort((a, b) => {
    const levelDiff = alertLevelRank(b.level) - alertLevelRank(a.level)
    if (levelDiff !== 0) return levelDiff
    return a.platformLabel.localeCompare(b.platformLabel)
  })
}

const postponeDurationIcon: Record<AlertPostponeDuration, LucideIcon> = {
  '1h': Clock,
  '1d': Calendar,
  '1w': CalendarDays,
}

function alertRowKey(row: ProductDetailAlertRow): string {
  return `${row.level}-${row.platformSlug}`
}

function ProductDetailAlertPostponeButton({
  alertIds,
  t,
  postponePending,
  onPostpone,
}: {
  alertIds: string[]
  t: (key: ShellStringKey) => string
  postponePending: boolean
  onPostpone: (alertIds: string[], duration: AlertPostponeDuration) => void
}) {
  const canPostpone = alertIds.length > 0
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger
        type="button"
        disabled={postponePending || !canPostpone}
        className={cn(buttonVariants({ variant: 'inverse', size: 'xs' }), 'gap-1 px-2.5')}
        aria-busy={postponePending || undefined}
        aria-label={t('productsDetailStockAlertPostponeAria')}
      >
        {postponePending ? (
          <>
            <LoadingIcon className="size-3.5 shrink-0 text-white" />
            <span>{t('productsDetailStockAlertPostponeLoading')}</span>
          </>
        ) : (
          <>
            <span>{t('productsDetailStockAlertPostpone')}</span>
            <ChevronDown className="size-3.5 shrink-0 text-white/80" aria-hidden />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {POSTPONE_DURATIONS.map((duration) => {
          const Icon = postponeDurationIcon[duration]
          return (
            <DropdownMenuItem
              key={duration}
              disabled={postponePending}
              className="gap-2"
              onClick={() => {
                setMenuOpen(false)
                onPostpone(alertIds, duration)
              }}
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {t(postponeLabelKey[duration])}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ProductDetailStockAlertCard({
  row,
  t,
  isAdmin,
  postponePending,
  onPostpone,
}: {
  row: ProductDetailAlertRow
  t: (key: ShellStringKey) => string
  isAdmin: boolean
  postponePending: boolean
  onPostpone: (alertIds: string[], duration: AlertPostponeDuration) => void
}) {
  const isOut = row.level === 'out'
  const title = isOut ? t('productsDetailStockAlertOut') : t('productsDetailStockAlertLow')
  const Icon = isOut ? Package : Gauge

  return (
    <article className="flex items-center gap-3 rounded-lg border border-border-subtle bg-white px-4 py-3.5">
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md',
          isOut ? 'bg-(--stock-alert-critical-bg)' : 'bg-(--stock-alert-warning-bg)',
        )}
      >
        <Icon
          className={cn(
            'size-4',
            isOut ? 'text-(--stock-alert-critical)' : 'text-(--stock-alert-warning)',
          )}
          aria-hidden
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.platformLabel}</p>
      </div>
      {isAdmin ? (
        <ProductDetailAlertPostponeButton
          alertIds={row.alertIds}
          t={t}
          postponePending={postponePending}
          onPostpone={onPostpone}
        />
      ) : null}
    </article>
  )
}

export function ProductDetailStockAlert({ detail, productId, t }: ProductDetailStockAlertProps) {
  const { data: rule } = useStockRuleQuery()
  const { me } = useAppBootstrap()
  const isAdmin = me?.role === 'admin' || me?.role === 'owner'
  const activeAlertsQuery = useAlertsListQuery('active', true, { limit: 100 })
  const postponeAlertMutation = usePostponeAlertMutation()
  const [pendingAlertIds, setPendingAlertIds] = useState<ReadonlySet<string>>(() => new Set())
  const [postponedRowKeys, setPostponedRowKeys] = useState<ReadonlySet<string>>(() => new Set())

  const resolvedProductId = detail.id ?? productId
  const listingIds = useMemo(
    () => (detail.stock_alert_summary ?? []).map((entry) => entry.listing_id).filter(Boolean),
    [detail.stock_alert_summary],
  )

  const activeStockAlerts = useMemo(
    () => activeStockAlertsForProduct(activeAlertsQuery.data?.items, resolvedProductId, listingIds),
    [activeAlertsQuery.data?.items, resolvedProductId, listingIds],
  )

  const rows = useMemo(
    () => buildAlertRows(detail.stock_alert_summary ?? [], rule, activeStockAlerts, t),
    [detail.stock_alert_summary, rule, activeStockAlerts, t],
  )

  const visibleRows = useMemo(
    () => rows.filter((row) => !postponedRowKeys.has(alertRowKey(row))),
    [rows, postponedRowKeys],
  )

  if (visibleRows.length === 0) return null

  const sectionTitle = t('productsDetailStockAlertsTitle').replace(
    '{count}',
    String(visibleRows.length),
  )

  const handlePostpone = async (
    row: ProductDetailAlertRow,
    alertIds: string[],
    duration: AlertPostponeDuration,
  ) => {
    if (alertIds.length === 0) return
    setPendingAlertIds(new Set(alertIds))
    try {
      await Promise.all(
        alertIds.map((alertId) =>
          postponeAlertMutation.mutateAsync({ alertId, duration }),
        ),
      )
      setPostponedRowKeys((prev) => {
        const next = new Set(prev)
        next.add(alertRowKey(row))
        return next
      })
      toast.success(t('productsDetailStockAlertPostponeToast'))
    } catch {
      toast.error(t('productsDetailStockAlertPostponeFailed'))
    } finally {
      setPendingAlertIds(new Set())
    }
  }

  const postponePending = postponeAlertMutation.isPending || pendingAlertIds.size > 0

  return (
    <section className="flex w-full flex-col gap-2" aria-label={sectionTitle}>
      <h2 className="text-sm font-semibold text-foreground">{sectionTitle}</h2>
      <div className="flex w-full flex-col gap-2">
        {visibleRows.map((row) => (
          <ProductDetailStockAlertCard
            key={alertRowKey(row)}
            row={row}
            t={t}
            isAdmin={isAdmin}
            postponePending={postponePending && row.alertIds.some((id) => pendingAlertIds.has(id))}
            onPostpone={(alertIds, duration) => {
              void handlePostpone(row, alertIds, duration)
            }}
          />
        ))}
      </div>
    </section>
  )
}
