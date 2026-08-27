import { Calendar, CalendarDays, ChevronDown, Clock, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import { can } from '@/lib/permissions/can'
import { useCurrentTenant } from '@/auth/hooks'
import type { AlertPostponeDuration } from '@/lib/types/alerts'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
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
import { Skeleton } from '@/ui/skeleton'
import { cn } from '@/lib/utils'

import {
  activeStockAlertsForProduct,
  alertRowKey,
  buildAlertRows,
  filterVisibleAlertRows,
  hasSummaryStockAlerts,
  type ProductDetailAlertRow,
} from './product-detail-stock-alert-utils'

type ProductDetailStockAlertProps = {
  detail: ProductDetailApi
  productId: string
  t: (key: ShellStringKey) => string
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

function ProductDetailStockAlertCardSkeleton() {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border-subtle bg-white px-4 py-3.5"
      aria-hidden
    >
      <Skeleton className="size-9 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-7 w-[4.5rem] shrink-0 rounded-md" />
    </div>
  )
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

  return (
    <ContextAlertCard
      title={title}
      subtitle={row.platformLabel}
      icon={<AppIcon name="orders" colorize className="size-4" />}
      tone={isOut ? 'critical' : 'warning'}
      action={
        isAdmin ? (
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

export function ProductDetailStockAlert({ detail, productId, t }: ProductDetailStockAlertProps) {
  const { data: rule } = useStockRuleQuery()
  const { me } = useAppBootstrap()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()
  const isAdmin = can(me, 'alerts.manage')
  const postponeAlertMutation = usePostponeAlertMutation()
  const [pendingAlertIds, setPendingAlertIds] = useState<ReadonlySet<string>>(() => new Set())

  const resolvedProductId = detail.id ?? productId
  const hasSummaryAlerts = useMemo(
    () => hasSummaryStockAlerts(detail.stock_alert_summary, rule),
    [detail.stock_alert_summary, rule],
  )
  const alertsLimit = 50
  const activeAlertsQuery = useAlertsListQuery(
    'active',
    hasSummaryAlerts && Boolean(resolvedProductId),
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

  const visibleRows = useMemo(
    () =>
      filterVisibleAlertRows(rows, {
        isSuccess: activeAlertsQuery.isSuccess,
        isError: activeAlertsQuery.isError,
        isLoading: activeAlertsQuery.isLoading || activeAlertsQuery.isPending,
      }),
    [rows, activeAlertsQuery.isSuccess, activeAlertsQuery.isError, activeAlertsQuery.isLoading, activeAlertsQuery.isPending],
  )

  if (!hasSummaryAlerts) return null

  if (activeAlertsQuery.isError) return null

  if (activeAlertsQuery.isLoading || activeAlertsQuery.isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <ProductDetailStockAlertCardSkeleton />
      </div>
    )
  }

  if (visibleRows.length === 0) return null

  const sectionTitle = t('productsDetailStockAlertsTitle').replace(
    '{count}',
    String(visibleRows.length),
  )

  const handlePostpone = async (
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
      await queryClient.refetchQueries({
        queryKey: alertsListQueryKey(tenantId, 'active', alertsLimit, resolvedProductId),
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
      {visibleRows.map((row) => (
        <ProductDetailStockAlertCard
          key={alertRowKey(row)}
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
