import { useMemo, useState } from 'react'

import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { enUS, es as esLocale } from 'date-fns/locale'

import { useCurrentTenant } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import { apiFetch } from '@/lib/api'
import type { PlatformConnection } from '@/lib/types/connectors'
import type { ExpenseCreate } from '@/lib/types/expenses'
import { useLanguage } from '@/shell/providers/language-provider'
import { Button } from '@/ui/button'
import { TooltipProvider } from '@/ui/tooltip'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
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
import { ReportsSummaryCards } from './reports-kpi-blocks'
import { computePreviousPeriod, toYmd } from './reports-ui-helpers'
import { WaterfallChart } from './waterfall-chart'
import { useReports } from './use-reports'
import { useExpenses } from './use-expenses'

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
  const dateLocale = lang === 'en' ? enUS : esLocale

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

  const prevPeriod = useMemo(() => computePreviousPeriod(startDate, endDate), [startDate, endDate])

  const {
    data: kpi,
    isLoading: kpiLoading,
    dataUpdatedAt,
    isFetching: kpiFetching,
  } = useReports({
    connectionId: activeConnectionId || null,
    startDate,
    endDate,
  })

  const { data: kpiPrev, isLoading: kpiPrevLoading } = useReports({
    connectionId: activeConnectionId || null,
    startDate: prevPeriod?.start ?? '',
    endDate: prevPeriod?.end ?? '',
    enabled: Boolean(prevPeriod && activeConnectionId),
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

  const lastUpdatedLabel = useMemo(() => {
    if (!dataUpdatedAt) return null
    return formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true, locale: dateLocale })
  }, [dataUpdatedAt, dateLocale])

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

  const previousReady = Boolean(prevPeriod) && !kpiPrevLoading
  const vsPrior = t('reportsVsPreviousPeriod')
  const comparisonUnavailable = t('reportsComparisonUnavailable')

  return (
    <TooltipProvider delayDuration={200}>
    <div className="flex flex-col gap-8 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {t('reportsPageTitle')}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {showConnectionSelector && (
            <Select
              value={activeConnectionId}
              onValueChange={(v) => setFilters({ connectionId: v ?? '' })}
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

      {!activeConnectionId ? (
        <p className="text-sm text-text-secondary">{t('reportsSelectConnection')}</p>
      ) : kpiLoading ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            <Skeleton className="h-[5.25rem] rounded-xl" />
            <Skeleton className="h-[5.25rem] rounded-xl" />
            <Skeleton className="h-[5.25rem] rounded-xl" />
            <Skeleton className="h-[5.25rem] rounded-xl" />
          </div>
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : kpi ? (
        <>
          <section>
            <ReportsSummaryCards
              kpi={kpi}
              kpiPrev={kpiPrev}
              currency={currency}
              previousReady={previousReady}
              lastUpdatedLabel={lastUpdatedLabel}
              kpiFetching={kpiFetching}
              vsPrior={vsPrior}
              comparisonUnavailable={comparisonUnavailable}
              t={t}
            />
          </section>

          <section>
            <Card className="overflow-hidden">
              <CardHeader className="space-y-1 pb-2">
                <CardTitle className="text-lg font-semibold tracking-tight text-text-primary">
                  {t('reportsSectionRevenueBreakdown')}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-text-tertiary">
                  {t('reportsWaterfallSubtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <WaterfallChart
                  segments={waterfallSegments}
                  currency={currency}
                  grossRevenue={kpi.gross_revenue}
                  formatPctOfGross={(pct) => t('reportsWaterfallPctOfGross').replace('{pct}', pct.toFixed(1))}
                  finalBarCaption={t('reportsWaterfallFinalHint')}
                  legendLabels={{
                    total: t('reportsWaterfallLegendTotal'),
                    deduction: t('reportsWaterfallLegendDeduction'),
                    additive: t('reportsWaterfallLegendAdditive'),
                    final: t('reportsWaterfallLegendFinal'),
                  }}
                />
              </CardContent>
            </Card>
          </section>
        </>
      ) : (
        <p className="text-sm text-text-secondary">{t('reportsNoData')}</p>
      )}
    </div>
    </TooltipProvider>
  )
}
