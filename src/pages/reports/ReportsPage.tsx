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
import { SectionContainer, SectionHeader } from './report-ui'
import { MonthlyRevenueChart } from './monthly-revenue-chart'
import { buildWaterfallSegments } from './waterfall-segments'
import { WaterfallChart } from './waterfall-chart'
import { useMonthlyRevenueSeries } from './use-monthly-revenue-series'
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

  const {
    data: monthlyRevenue,
    isLoading: monthlyRevenueLoading,
    isError: monthlyRevenueError,
  } = useMonthlyRevenueSeries({
    connectionId: activeConnectionId || null,
    startDate,
    endDate,
    enabled: Boolean(activeConnectionId),
  })

  const currency = kpi?.currency ?? 'USD'

  const lastUpdatedLabel = useMemo(() => {
    if (!dataUpdatedAt) return null
    return formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true, locale: dateLocale })
  }, [dataUpdatedAt, dateLocale])

  const waterfallSegments = kpi ? buildWaterfallSegments(kpi, t) : []

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
    <div className="flex min-w-0 flex-col bg-[var(--color-bg-page)]">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0 space-y-2">
          <h1 className="text-4xl font-semibold tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-5xl">
            {t('reportsPageTitle')}
          </h1>
          {lastUpdatedLabel ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)] tabular-nums">
              {t('reportsLastUpdated')}: {lastUpdatedLabel}
              {kpiFetching ? ' · …' : ''}
            </p>
          ) : null}
        </div>
        <div className="flex w-full flex-col items-stretch gap-3 sm:ml-auto sm:max-w-xl lg:max-w-none lg:flex-row lg:items-center lg:justify-end">
          <div className="surface-glass flex flex-wrap items-center justify-end gap-2 rounded-md p-2.5 shadow-[var(--shadow-soft)]">
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
            <div className="w-full min-w-[16rem] sm:w-[19rem]">
              <DateRangePicker
                strings={pickerStrings}
                startValue={startDate}
                endValue={endDate}
                onStartChange={(v) => v && setFilters({ startDate: v })}
                onEndChange={(v) => v && setFilters({ endDate: v })}
                filterLabel={t('filterDateTimeLabel')}
                clearAriaLabel={t('filterClear')}
                onClear={() =>
                  setFilters({
                    startDate: defaultFilters.startDate,
                    endDate: defaultFilters.endDate,
                  })
                }
              />
            </div>
          </div>
        </div>
      </header>

      {!activeConnectionId ? (
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)]/90 px-6 py-8 text-sm text-text-secondary shadow-[var(--shadow-soft)] backdrop-blur-sm">
          {t('reportsSelectConnection')}
        </div>
      ) : kpiLoading ? (
        <div className="flex flex-col space-y-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`h-${i}`} className="h-28 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-44 rounded-md" />
          <Skeleton className="h-44 rounded-md" />
          <Skeleton className="h-44 rounded-md" />
          <Skeleton className="h-[22rem] rounded-md" />
          <Skeleton className="h-96 rounded-md" />
        </div>
      ) : kpi ? (
        <div className="flex flex-col space-y-12 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-safe:fill-mode-both">
          <section>
            <ReportsSummaryCards
              kpi={kpi}
              kpiPrev={kpiPrev}
              currency={currency}
              previousReady={previousReady}
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
            <SectionContainer className="overflow-visible">
              <SectionHeader
                title={t('reportsSectionRevenueBreakdown')}
                description={t('reportsWaterfallSubtitle')}
              />
              {kpi.currency_mismatch_warning ? (
                <div className="mb-4 rounded-md border border-border-default bg-bg-elevated px-4 py-2 text-xs text-text-secondary">
                  {t('reportsCurrencyMismatchWarning')}
                </div>
              ) : null}
              {kpi.cogs_incomplete ? (
                <div className="mb-4 space-y-2 rounded-md border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs text-amber-950 dark:text-amber-100">
                  <p>{t('reportsCogsIncompleteBanner')}</p>
                  <p className="text-[11px] opacity-90">{t('reportsCogsIncompleteFootnote')}</p>
                </div>
              ) : null}
              <WaterfallChart
                segments={waterfallSegments}
                currency={currency}
                grossRevenue={kpi.gross_revenue}
                formatPctOfGross={(pct) => t('reportsWaterfallPctOfGross').replace('{pct}', pct.toFixed(1))}
                finalBarCaption={t('reportsWaterfallFinalHint')}
              />
            </SectionContainer>
          </section>

          <section>
            <SectionContainer className="overflow-visible">
              <SectionHeader
                title={t('reportsMonthlyEvolutionTitle')}
                description={t('reportsMonthlyEvolutionSubtitle')}
              />
              {monthlyRevenueError ? (
                <p className="rounded-md px-4 py-8 text-sm text-text-secondary">{t('reportsMonthlyLoadError')}</p>
              ) : monthlyRevenueLoading ? (
                <Skeleton className="h-96 w-full rounded-md" />
              ) : (
                <MonthlyRevenueChart
                  startDate={startDate}
                  endDate={endDate}
                  rows={monthlyRevenue?.months ?? []}
                  currency={currency}
                  dateLocale={dateLocale}
                  t={t}
                />
              )}
            </SectionContainer>
          </section>
        </div>
      ) : (
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)]/90 px-6 py-8 text-sm text-text-secondary shadow-[var(--shadow-soft)] backdrop-blur-sm">
          {t('reportsNoData')}
        </div>
      )}
    </div>
  )
}
