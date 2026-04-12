import { useMemo, useState } from 'react'

import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import { apiFetch } from '@/lib/api'
import type { PlatformConnection } from '@/lib/types/connectors'
import type { ExpenseCreate } from '@/lib/types/expenses'
import { useLanguage } from '@/shell/providers/language-provider'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Skeleton } from '@/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { DateRangePicker } from '@/ui/date-range-picker'
import { ExpensesSheet } from './expenses-sheet'
import { WaterfallChart } from './waterfall-chart'
import { useReports } from './use-reports'
import { useExpenses } from './use-expenses'

function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fmtCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PAID: 'default',
  PARTIALLY_PAID: 'secondary',
  REFUNDED: 'destructive',
  PARTIALLY_REFUNDED: 'destructive',
  VOIDED: 'outline',
  EXPIRED: 'outline',
}

const STATUS_LABEL_KEYS: Record<string, Parameters<typeof shellT>[1]> = {
  PAID: 'orderStatusPaid',
  PARTIALLY_PAID: 'orderStatusPartiallyPaid',
  REFUNDED: 'orderStatusRefunded',
  PARTIALLY_REFUNDED: 'orderStatusPartiallyRefunded',
  VOIDED: 'orderStatusVoided',
  EXPIRED: 'orderStatusExpired',
}

type ReportsFiltersState = {
  startDate: string
  endDate: string
  connectionId: string
}

function parseReportsFilters(raw: unknown): ReportsFiltersState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.startDate)) return null
  if (typeof o.endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.endDate)) return null
  if (typeof o.connectionId !== 'string') return null
  return { startDate: o.startDate, endDate: o.endDate, connectionId: o.connectionId }
}

export function ReportsPage() {
  const { lang } = useLanguage()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)

  const defaultFilters = useMemo((): ReportsFiltersState => {
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 29)
    return { startDate: toYmd(thirtyDaysAgo), endDate: toYmd(today), connectionId: '' }
  }, [])

  const [filters, setFilters] = useTenantPersistedJson(
    tenantId,
    'alenna.reports.filters',
    defaultFilters,
    parseReportsFilters,
  )
  const { startDate, endDate, connectionId } = filters
  const [expensesOpen, setExpensesOpen] = useState(false)

  const connectionsQuery = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as PlatformConnection[]
    },
  })

  const connections = useMemo(() => connectionsQuery.data ?? [], [connectionsQuery.data])
  const activeConnectionId = useMemo(() => {
    if (connectionId && connections.some((c) => c.id === connectionId)) return connectionId
    return connections[0]?.id ?? ''
  }, [connectionId, connections])

  const showConnectionSelector = connections.length > 1

  const { data: kpi, isLoading: kpiLoading } = useReports({
    connectionId: activeConnectionId || null,
    startDate,
    endDate,
  })

  const { query: expensesQuery, createMutation, updateMutation, deleteMutation } = useExpenses()
  const expenses = expensesQuery.data ?? []
  const isBusy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const platforms = useMemo(() => {
    const seen = new Set<string>()
    return connections
      .filter((c) => {
        if (seen.has(c.platform)) return false
        seen.add(c.platform)
        return true
      })
      .map((c) => ({ slug: c.platform, name: c.platform }))
  }, [connections])

  const currency = kpi?.currency ?? 'USD'

  const waterfallSegments = kpi
    ? [
        { name: t('reportsWfGrossRevenue'), value: kpi.gross_revenue, isSubtotal: true, isNegative: false },
        { name: t('reportsWfDiscounts'), value: kpi.discounts, isSubtotal: false, isNegative: true },
        { name: t('reportsWfReturns'), value: kpi.returns, isSubtotal: false, isNegative: true },
        { name: t('reportsWfCommissions'), value: kpi.referral_commissions, isSubtotal: false, isNegative: true },
        { name: t('reportsWfShipping'), value: kpi.shipping, isSubtotal: false, isNegative: true },
        { name: t('reportsWfTaxes'), value: kpi.taxes, isSubtotal: false, isNegative: true },
        { name: t('reportsWfFees'), value: kpi.per_transaction_fees, isSubtotal: false, isNegative: true },
        { name: t('reportsWfNetRevenue'), value: kpi.net_revenue, isSubtotal: true, isNegative: false },
        { name: t('reportsWfCogs'), value: kpi.cogs, isSubtotal: false, isNegative: true },
        { name: t('reportsWfGrossProfit'), value: kpi.gross_profit, isSubtotal: true, isNegative: false },
        { name: t('reportsWfOpex'), value: kpi.operating_expenses, isSubtotal: false, isNegative: true },
        { name: t('reportsWfNetProfit'), value: kpi.net_profit, isSubtotal: true, isNegative: kpi.net_profit < 0 },
      ]
    : []

  const pickerStrings = {
    startLabel: t('connectionsDateFrom'),
    endLabel: t('connectionsDateTo'),
    applyLabel: t('datePickerApply'),
    presetCustom: t('datePickerCustom'),
    presetLast7Days: t('datePickerLast7Days'),
    presetLast30Days: t('datePickerLast30Days'),
    presetLast3Months: t('datePickerLast3Months'),
    presetLast12Months: t('datePickerLast12Months'),
    presetCurrentMonth: t('datePickerCurrentMonth'),
    presetCurrentQuarter: t('datePickerCurrentQuarter'),
    presetYtd: t('datePickerYtd'),
  }

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {t('reportsPageTitle')}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {showConnectionSelector && (
            <Select
              value={activeConnectionId}
              onValueChange={(v) => setFilters({ connectionId: v })}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t('reportsConnection')} />
              </SelectTrigger>
              <SelectContent>
                {connections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.shop_domain ?? c.platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="w-72">
            <DateRangePicker
              strings={pickerStrings}
              startValue={startDate}
              endValue={endDate}
              onStartChange={(v) => v && setFilters({ startDate: v })}
              onEndChange={(v) => v && setFilters({ endDate: v })}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setExpensesOpen(true)}>
            {t('expensesAddBtn')}
          </Button>
          <ExpensesSheet
            open={expensesOpen}
            onOpenChange={setExpensesOpen}
            expenses={expenses}
            platforms={platforms}
            onCreate={async (body: ExpenseCreate) => { await createMutation.mutateAsync(body) }}
            onUpdate={async (id, body) => { await updateMutation.mutateAsync({ id, ...body }) }}
            onDelete={async (id) => { await deleteMutation.mutateAsync(id) }}
            isBusy={isBusy}
          />
        </div>
      </div>

      {/* KPI Cards */}
      {!activeConnectionId ? (
        <p className="text-sm text-text-secondary">{t('reportsSelectConnection')}</p>
      ) : kpiLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : kpi ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              title={t('reportsGrossRevenue')}
              value={fmtCurrency(kpi.gross_revenue, currency)}
            />
            <KpiCard
              title={t('reportsNetRevenue')}
              value={fmtCurrency(kpi.net_revenue, currency)}
            />
            <KpiCard
              title={t('reportsGrossProfit')}
              value={fmtCurrency(kpi.gross_profit, currency)}
              badge={`${kpi.gross_margin_pct.toFixed(1)}%`}
              badgeLabel={t('reportsGrossMargin')}
            />
            <KpiCard
              title={t('reportsNetProfit')}
              value={fmtCurrency(kpi.net_profit, currency)}
              negative={kpi.net_profit < 0}
            />
          </div>

          {/* Order status row */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{t('reportsOrders')}:</span>
            <span className="font-semibold text-text-primary">{kpi.order_count.toLocaleString()}</span>
            {Object.entries(kpi.order_status_counts)
              .filter(([, count]) => count > 0)
              .map(([status, count]) => (
                <Badge key={status} variant={STATUS_BADGE_VARIANT[status] ?? 'secondary'}>
                  {count} {STATUS_LABEL_KEYS[status] ? t(STATUS_LABEL_KEYS[status]) : status.toLowerCase()}
                </Badge>
              ))}
            <span className="ml-2">
              {t('reportsUnits')}: {kpi.units_sold.toLocaleString()}
            </span>
          </div>

          {/* Waterfall chart */}
          <Card className="bg-white dark:bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                {t('reportsWaterfallTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <WaterfallChart segments={waterfallSegments} currency={currency} />
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-text-secondary">{t('reportsNoData')}</p>
      )}
    </div>
  )
}

function KpiCard({
  title,
  value,
  badge,
  badgeLabel,
  negative,
}: {
  title: string
  value: string
  badge?: string
  badgeLabel?: string
  negative?: boolean
}) {
  return (
    <Card className="bg-white dark:bg-white">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`text-2xl font-semibold tabular-nums ${negative ? 'text-destructive' : 'text-text-primary'}`}
        >
          {value}
        </p>
        {badge && (
          <div className="mt-1 flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
            {badgeLabel && (
              <span className="text-xs text-text-tertiary">{badgeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
