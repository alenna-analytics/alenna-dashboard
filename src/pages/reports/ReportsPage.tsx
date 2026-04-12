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
        {
          name: t('reportsWfAdjustmentsToNet'),
          value: Math.max(0, kpi.gross_revenue - kpi.net_revenue),
          isSubtotal: false,
          isNegative: true,
          stackedParts: [
            { name: t('reportsWfDiscounts'), value: kpi.discounts, isNegative: true },
            { name: t('reportsWfReturns'), value: kpi.returns, isNegative: true },
            { name: t('reportsWfCommissions'), value: kpi.referral_commissions, isNegative: true },
            { name: t('reportsWfShipping'), value: kpi.shipping, isNegative: true },
            { name: t('reportsWfTaxes'), value: kpi.taxes, isNegative: true },
            { name: t('reportsWfFees'), value: kpi.per_transaction_fees, isNegative: true },
          ],
        },
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
      <div className="flex flex-col gap-8">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="max-w-[36rem]">
            <h1 className="max-w-[10ch] text-4xl font-semibold tracking-[-0.045em] text-text-primary sm:text-5xl lg:text-[4.25rem]">
              {t('reportsPageTitle')}
            </h1>
          </div>
          <div className="surface-glass flex flex-wrap items-center justify-end gap-2 rounded-[1.75rem] p-2.5">
            {showConnectionSelector && (
              <Select
                value={activeConnectionId}
                onValueChange={(v) => setFilters({ connectionId: v ?? '' })}
              >
                <SelectTrigger className="w-48 border-border-default bg-bg-elevated shadow-none">
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
            <div className="w-[19rem]">
              <DateRangePicker
                strings={pickerStrings}
                startValue={startDate}
                endValue={endDate}
                onStartChange={(v) => v && setFilters({ startDate: v })}
                onEndChange={(v) => v && setFilters({ endDate: v })}
              />
            </div>
            <Button variant="default" size="sm" onClick={() => setExpensesOpen(true)}>
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
        </section>

        {!activeConnectionId ? (
          <div className="surface-glass rounded-[2rem] px-6 py-8 text-sm text-text-secondary">
            {t('reportsSelectConnection')}
          </div>
        ) : kpiLoading ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12">
              <Skeleton className="h-36 rounded-[1.75rem] xl:col-span-6" />
              <Skeleton className="h-36 rounded-[1.75rem] xl:col-span-2" />
              <Skeleton className="h-36 rounded-[1.75rem] xl:col-span-2" />
              <Skeleton className="h-36 rounded-[1.75rem] xl:col-span-2" />
            </div>
            <Skeleton className="h-20 rounded-[1.75rem]" />
            <Skeleton className="h-[26rem] rounded-[2rem]" />
          </div>
        ) : kpi ? (
          <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-safe:fill-mode-both">
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
              <Card className="overflow-hidden rounded-[2rem] border-0 bg-transparent py-4 shadow-none hover:shadow-none">
                <CardHeader className="space-y-1 px-1 pb-4 pt-0 sm:px-1">
                  <CardTitle className="text-2xl tracking-[-0.03em] text-text-primary">
                    {t('reportsSectionRevenueBreakdown')}
                  </CardTitle>
                  <CardDescription className="max-w-[30rem] text-sm text-text-secondary">
                    {t('reportsWaterfallSubtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pt-0">
                  <WaterfallChart
                    segments={waterfallSegments}
                    currency={currency}
                    grossRevenue={kpi.gross_revenue}
                    formatPctOfGross={(pct) => t('reportsWaterfallPctOfGross').replace('{pct}', pct.toFixed(1))}
                    finalBarCaption={t('reportsWaterfallFinalHint')}
                  />
                </CardContent>
              </Card>
            </section>
          </div>
        ) : (
          <div className="surface-glass rounded-[2rem] px-6 py-8 text-sm text-text-secondary">
            {t('reportsNoData')}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
