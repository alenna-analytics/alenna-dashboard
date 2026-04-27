import { useMemo } from 'react'

import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { endOfMonth, formatDistanceToNow, startOfMonth, subMonths, subYears } from 'date-fns'
import { enUS, es as esLocale } from 'date-fns/locale'

import { useCurrentTenant } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import { apiFetch } from '@/lib/api'
import type { PlatformConnection } from '@/lib/types/connectors'
import { useLanguage } from '@/shell/providers/language-provider'
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
import { ReportsSummaryCards } from './reports-kpi-blocks'
import {
  computePreviousPeriod,
  parseLocalYmd,
  pctVersusPrevious,
  toYmd,
} from './reports-ui-helpers'
import { WaterfallChart } from './waterfall-chart'
import { useReports } from './use-reports'

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

  const momRanges = useMemo(() => {
    const endDt = parseLocalYmd(endDate)
    const curStart = startOfMonth(endDt)
    const curEnd = endOfMonth(endDt)
    const prevAnchor = subMonths(endDt, 1)
    return {
      current: { start: toYmd(curStart), end: toYmd(curEnd) },
      previous: { start: toYmd(startOfMonth(prevAnchor)), end: toYmd(endOfMonth(prevAnchor)) },
    }
  }, [endDate])

  const yoyPriorRange = useMemo(() => {
    const s = parseLocalYmd(startDate)
    const e = parseLocalYmd(endDate)
    return {
      start: toYmd(subYears(s, 1)),
      end: toYmd(subYears(e, 1)),
    }
  }, [startDate, endDate])

  const momCurrentKpi = useReports({
    connectionId: activeConnectionId || null,
    startDate: momRanges.current.start,
    endDate: momRanges.current.end,
    enabled: Boolean(activeConnectionId),
  })

  const momPreviousKpi = useReports({
    connectionId: activeConnectionId || null,
    startDate: momRanges.previous.start,
    endDate: momRanges.previous.end,
    enabled: Boolean(activeConnectionId),
  })

  const kpiYoyPrior = useReports({
    connectionId: activeConnectionId || null,
    startDate: yoyPriorRange.start,
    endDate: yoyPriorRange.end,
    enabled: Boolean(activeConnectionId),
  })

  const momPct = useMemo(() => {
    const cur = momCurrentKpi.data?.net_revenue
    const prev = momPreviousKpi.data?.net_revenue
    if (cur === undefined || prev === undefined) return null
    return pctVersusPrevious(cur, prev)?.pct ?? null
  }, [momCurrentKpi.data, momPreviousKpi.data])

  const momReady = Boolean(activeConnectionId && momCurrentKpi.data && momPreviousKpi.data)

  const yoyPct = useMemo(() => {
    if (kpi === undefined || kpiYoyPrior.data === undefined) return null
    return pctVersusPrevious(kpi.net_revenue, kpiYoyPrior.data.net_revenue)?.pct ?? null
  }, [kpi, kpiYoyPrior.data])

  const yoyReady = Boolean(kpi && kpiYoyPrior.data)

  const currency = kpi?.currency ?? 'USD'

  const lastUpdatedLabel = useMemo(() => {
    if (!dataUpdatedAt) return null
    return formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true, locale: dateLocale })
  }, [dataUpdatedAt, dateLocale])

  const waterfallSegments = kpi
    ? [
        { name: t('reportsWfGrossRevenue'), value: kpi.gross_revenue, isSubtotal: true, isNegative: false },
        {
          name: t('reportsWfDiscountsReturns'),
          value: kpi.discounts + kpi.returns,
          isSubtotal: false,
          isNegative: true,
          stackedParts: [
            { name: t('reportsWfDiscounts'), value: kpi.discounts, isNegative: true },
            { name: t('reportsWfReturns'), value: kpi.returns, isNegative: true },
          ],
        },
        { name: t('reportsWfNetRevenue'), value: kpi.net_revenue, isSubtotal: true, isNegative: false },
        { name: t('reportsWfCogs'), value: kpi.cogs, isSubtotal: false, isNegative: true },
        { name: t('reportsWfGrossProfit'), value: kpi.gross_profit, isSubtotal: true, isNegative: false },
        { name: t('reportsWfCommissions'), value: kpi.platform_fees_total, isSubtotal: false, isNegative: true },
        { name: t('reportsWfShipping'), value: kpi.merchant_shipping_cost, isSubtotal: false, isNegative: true },
        { name: t('reportsWfAdsSpend'), value: kpi.ads_spend, isSubtotal: false, isNegative: true },
        { name: t('reportsWfContributionMargin'), value: kpi.contribution_margin, isSubtotal: true, isNegative: kpi.contribution_margin < 0 },
        { name: t('reportsWfOpex'), value: kpi.fixed_operating_expenses, isSubtotal: false, isNegative: true },
        { name: t('reportsWfEbitda'), value: kpi.ebitda, isSubtotal: true, isNegative: kpi.ebitda < 0 },
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
          </div>
        </section>

        {!activeConnectionId ? (
          <div className="surface-glass rounded-[2rem] px-6 py-8 text-sm text-text-secondary">
            {t('reportsSelectConnection')}
          </div>
        ) : kpiLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-7 w-32 rounded-lg" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={`v-${i}`} className="h-36 rounded-[1.75rem]" />
              ))}
            </div>
            <Skeleton className="h-7 w-40 rounded-lg" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 11 }).map((_, i) => (
                <Skeleton key={`r-${i}`} className="h-36 rounded-[1.75rem]" />
              ))}
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
                momPct={momPct}
                momReady={momReady}
                yoyPct={yoyPct}
                yoyReady={yoyReady}
                t={t}
              />
            </section>

            <section>
              <Card className="overflow-visible rounded-[2rem] border-0 bg-transparent py-4 shadow-none hover:shadow-none">
                <CardHeader className="space-y-1 px-1 pb-4 pt-0 sm:px-1">
                  <CardTitle className="text-2xl tracking-[-0.03em] text-text-primary">
                    {t('reportsSectionRevenueBreakdown')}
                  </CardTitle>
                  <CardDescription className="max-w-[30rem] text-sm text-text-secondary">
                    {t('reportsWaterfallSubtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pt-0">
                  {kpi.currency_mismatch_warning ? (
                    <div className="mb-3 rounded-xl border border-border-default bg-bg-elevated px-4 py-2 text-xs text-text-secondary">
                      {t('reportsCurrencyMismatchWarning')}
                    </div>
                  ) : null}
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
  )
}
