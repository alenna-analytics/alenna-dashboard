import { Calendar, CalendarDays, ChevronDown, Clock, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useWorkspace } from '@/shell/providers/workspace-context'
import { can } from '@/lib/permissions/can'
import { useCurrentTenant } from '@/auth/hooks'
import type { AlertPostponeDuration } from '@/lib/types/alerts'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import type { ProductLinkGroupApi } from '@/lib/types/product-links'
import {
  alertsListQueryKey,
  useAlertsListQuery,
  usePostponeAlertMutation,
} from '@/pages/dashboard/use-alerts-queries'
import { useStockRuleQuery } from '@/pages/configuration/alarms/stock/use-alert-rules-queries'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { buttonVariants } from '@/ui/button'
import { AppIcon, LoadingIcon } from '@/ui/app-icon'
import { ContextAlertCard, ContextAlertsGroup } from '@/ui/context-alert'
import { cn } from '@/lib/utils'

import { inventoryCoverAlertCopy } from './inventory-cover-alert'
import { buildProductCoverRows } from './product-detail-cover'
import { buildChannelCoverRows } from './vinculacion/group-channel-cover'
import { PRODUCT_DETAIL_ALL_CHANNELS } from './product-detail-analytics-filter'
import {
  activeStockAlertsForProduct,
  buildAlertRows,
  hasSummaryStockAlerts,
  resolveAlertIdsForRow,
  type ProductDetailAlertRow,
} from './product-detail-stock-alert-utils'

type ProductDetailStockAlertProps = {
  detail: ProductDetailApi
  productId: string
  lang: string
  t: (key: ShellStringKey) => string
}

type ShownInventoryAlert = {
  key: string
  title: string
  subtitle: string
  tone: 'critical' | 'warning'
  alertIds: string[]
}

const POSTPONE_DURATIONS = ['1h', '1d', '1w'] as const satisfies readonly AlertPostponeDuration[]

const postponeLabelKey: Record<AlertPostponeDuration, ShellStringKey> = {
  '1h': 'homeAlertsDialogPostpone1h',
  '1d': 'homeAlertsDialogPostpone1d',
  '1w': 'homeAlertsDialogPostpone1w',
}

const postponeDurationIcon: Record<AlertPostponeDuration, LucideIcon> = {
  '1h': Clock,
  '1d': Calendar,
  '1w': CalendarDays,
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
  row: ShownInventoryAlert
  t: (key: ShellStringKey) => string
  isAdmin: boolean
  postponePending: boolean
  onPostpone: (alertIds: string[], duration: AlertPostponeDuration) => void
}) {
  return (
    <ContextAlertCard
      title={row.title}
      subtitle={row.subtitle}
      icon={<AppIcon name="orders" colorize className="size-4" />}
      tone={row.tone}
      action={
        isAdmin && row.alertIds.length > 0 ? (
          <ProductDetailAlertPostponeButton
            alertIds={row.alertIds}
            t={t}
            postponePending={postponePending}
            onPostpone={onPostpone}
          />
        ) : undefined
      }
    />
  )
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => vars[name] ?? match)
}

function alertIdsForPlatform(rows: ProductDetailAlertRow[], platformSlug: string): string[] {
  return rows.find((row) => row.platformSlug === platformSlug)?.alertIds ?? []
}

export function ProductDetailStockAlert({
  detail,
  productId,
  lang,
  t,
}: ProductDetailStockAlertProps) {
  const { data: rule } = useStockRuleQuery()

  const resolvedProductId = detail.id ?? productId
  const today = useMemo(() => new Date(), [])
  const hasSummaryAlerts = useMemo(
    () => hasSummaryStockAlerts(detail.stock_alert_summary, rule),
    [detail.stock_alert_summary, rule],
  )
  const coverAlerts = useMemo(
    () =>
      buildProductCoverRows(detail, PRODUCT_DETAIL_ALL_CHANNELS, today).flatMap((row) => {
        const copy = inventoryCoverAlertCopy(row, lang, t)
        if (!copy) return []
        return [{ platformSlug: row.platform.trim().toLowerCase(), ...copy }]
      }),
    [detail, lang, t, today],
  )
  const alertsLimit = 50
  const activeAlertsQuery = useAlertsListQuery(
    'active',
    (hasSummaryAlerts || coverAlerts.length > 0) && Boolean(resolvedProductId),
    { productId: resolvedProductId, limit: alertsLimit },
  )

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

  const shown = useMemo(() => {
    const covered = new Set(coverAlerts.map((row) => row.platformSlug))
    const fromCover: ShownInventoryAlert[] = coverAlerts.map((row) => ({
      key: row.platformSlug,
      title: row.title,
      subtitle: row.subtitle,
      tone: row.tone,
      alertIds: alertIdsForPlatform(rows, row.platformSlug),
    }))
    const fromSummary: ShownInventoryAlert[] = rows
      .filter((row) => !covered.has(row.platformSlug))
      .map((row) => ({
        key: `${row.level}-${row.platformSlug}`,
        title: fill(
          t(
            row.level === 'out'
              ? 'productsInventoryAlertCriticalOn'
              : 'productsInventoryAlertAttentionOn',
          ),
          { platform: row.platformLabel },
        ),
        subtitle:
          row.stockQuantity != null
            ? fill(t('productsInventoryAlertStockOnly'), {
                stock: row.stockQuantity.toLocaleString(lang === 'en' ? 'en-US' : 'es-MX'),
              })
            : row.platformLabel,
        tone: row.level === 'out' ? 'critical' : 'warning',
        alertIds: row.alertIds,
      }))
    return [...fromCover, ...fromSummary]
  }, [coverAlerts, lang, rows, t])

  if (shown.length === 0) return null

  return <InventoryAlertCards items={shown} productId={resolvedProductId} t={t} />
}

export function GroupInventoryCoverAlert({
  group,
  lang,
  t,
}: {
  group: ProductLinkGroupApi
  lang: string
  t: (key: ShellStringKey) => string
}) {
  const today = useMemo(() => new Date(), [])
  const coverAlerts = useMemo(
    () =>
      buildChannelCoverRows(group, group.members, today).flatMap((row) => {
        const copy = inventoryCoverAlertCopy(row, lang, t)
        if (!copy) return []
        return [{ platformSlug: row.platform.trim().toLowerCase(), ...copy }]
      }),
    [group, lang, t, today],
  )
  const activeAlertsQuery = useAlertsListQuery('active', coverAlerts.length > 0, { limit: 50 })
  const shown = useMemo(
    () =>
      coverAlerts.map((row) => ({
        key: row.platformSlug,
        title: row.title,
        subtitle: row.subtitle,
        tone: row.tone,
        alertIds: resolveAlertIdsForRow(
          (activeAlertsQuery.data?.items ?? []).filter((alert) => alert.alert_type === 'stock'),
          row.platformSlug,
          [],
        ),
      })),
    [activeAlertsQuery.data?.items, coverAlerts],
  )

  if (shown.length === 0) return null
  return <InventoryAlertCards items={shown} t={t} />
}

function InventoryAlertCards({
  items,
  productId,
  t,
}: {
  items: ShownInventoryAlert[]
  productId?: string
  t: (key: ShellStringKey) => string
}) {
  const { me } = useWorkspace()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()
  const isAdmin = can(me, 'alerts.manage')
  const postponeAlertMutation = usePostponeAlertMutation()
  const [pendingAlertIds, setPendingAlertIds] = useState<ReadonlySet<string>>(() => new Set())
  const alertsLimit = 50
  const sectionTitle = t('productsDetailStockAlertsTitle').replace('{count}', String(items.length))

  const handlePostpone = async (alertIds: string[], duration: AlertPostponeDuration) => {
    if (alertIds.length === 0) return
    setPendingAlertIds(new Set(alertIds))
    try {
      await Promise.all(
        alertIds.map((alertId) => postponeAlertMutation.mutateAsync({ alertId, duration })),
      )
      await queryClient.refetchQueries({
        queryKey: alertsListQueryKey(tenantId, 'active', alertsLimit, productId),
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
    <ContextAlertsGroup title={sectionTitle}>
      {items.map((row) => (
        <ProductDetailStockAlertCard
          key={row.key}
          row={row}
          t={t}
          isAdmin={isAdmin}
          postponePending={postponePending && row.alertIds.some((id) => pendingAlertIds.has(id))}
          onPostpone={(alertIds, duration) => {
            void handlePostpone(alertIds, duration)
          }}
        />
      ))}
    </ContextAlertsGroup>
  )
}
