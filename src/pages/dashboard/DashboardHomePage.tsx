import { useMemo } from 'react'

import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { enUS, es as esLocale } from 'date-fns/locale'
import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { useCurrentTenant } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import { apiFetch } from '@/lib/api'
import type { PlatformConnection } from '@/lib/types/connectors'
import { useLanguage } from '@/shell/providers/language-provider'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { Skeleton } from '@/ui/skeleton'
import { DateRangePicker } from '@/ui/date-range-picker'
import { KpiCard } from '@/ui/kpi-card'

import { DashboardRevenueTrendChart } from './dashboard-revenue-trend-chart'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import {
  computePreviousPeriod,
  fmtCurrency,
  pctVersusPrevious,
  toYmd,
} from '@/pages/reports/reports-ui-helpers'
import { buildWaterfallSegments } from '@/pages/reports/waterfall-segments'
import { WaterfallChart } from '@/pages/reports/waterfall-chart'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'
import { useReports } from '@/pages/reports/use-reports'

type HomeFiltersState = {
  startDate: string
  endDate: string
  connectionId: string
}

function parseHomeFilters(raw: unknown): HomeFiltersState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.startDate)) return null
  if (typeof o.endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.endDate)) return null
  if (typeof o.connectionId !== 'string') return null
  return { startDate: o.startDate, endDate: o.endDate, connectionId: o.connectionId }
}

export function DashboardHomePage() {
  const { lang } = useLanguage()
  const dateLocale = lang === 'en' ? enUS : esLocale
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)

  const defaultFilters = useMemo((): HomeFiltersState => {
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 29)
    return { startDate: toYmd(thirtyDaysAgo), endDate: toYmd(today), connectionId: '' }
  }, [])

  const [filters, setFilters] = useTenantPersistedJson(
    tenantId,
    'alenna.reports.filters',
    defaultFilters,
    parseHomeFilters,
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

  const prevPeriod = useMemo(() => computePreviousPeriod(startDate, endDate), [startDate, endDate])

  const {
    data: kpi,
    isLoading: kpiLoading,
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

  const {
    data: monthlyCurrent,
    isLoading: monthlyRevenueLoading,
    isError: monthlyRevenueError,
  } = useMonthlyRevenueSeries({
    connectionId: activeConnectionId || null,
    startDate,
    endDate,
    enabled: Boolean(activeConnectionId),
  })

  const {
    data: monthlyPrev,
    isLoading: monthlyPrevLoading,
  } = useMonthlyRevenueSeries({
    connectionId: activeConnectionId || null,
    startDate: prevPeriod?.start ?? '',
    endDate: prevPeriod?.end ?? '',
    enabled: Boolean(activeConnectionId && prevPeriod),
  })

  const currency = kpi?.currency ?? 'USD'
  const orders = kpi?.order_count ?? 0
  const aov = orders > 0 && kpi ? kpi.net_revenue / orders : null

  const previousReady = Boolean(prevPeriod) && !kpiPrevLoading

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

  const vsPrior = t('reportsVsPreviousPeriod')

  function deltaBlock(current: number, previous: number | undefined, fmt: 'currency' | 'count' | 'percent') {
    const priorUnavailable = !previousReady || previous === undefined
    const priorDisplay =
      priorUnavailable || previous === undefined
        ? null
        : fmt === 'currency'
          ? fmtCurrency(previous, currency)
          : fmt === 'percent'
            ? `${previous.toFixed(1)}%`
            : previous.toLocaleString()
    const delta = previous !== undefined && previousReady ? pctVersusPrevious(current, previous) : null
    return {
      priorDisplay,
      pct: delta?.pct ?? null,
      trend: delta?.trend ?? ('flat' as const),
      unavailable: priorUnavailable,
    }
  }

  const net = kpi ? deltaBlock(kpi.net_revenue, kpiPrev?.net_revenue, 'currency') : null
  const ebitda = kpi ? deltaBlock(kpi.ebitda, kpiPrev?.ebitda, 'currency') : null
  const margin = kpi ? deltaBlock(kpi.gross_margin_pct, kpiPrev?.gross_margin_pct, 'percent') : null
  const ord = kpi ? deltaBlock(kpi.order_count, kpiPrev?.order_count, 'count') : null
  const aovCur = aov ?? 0
  const aovPrev =
    kpiPrev && kpiPrev.order_count > 0 ? kpiPrev.net_revenue / kpiPrev.order_count : undefined
  const aovDelta =
    kpi && aov !== null ? deltaBlock(aovCur, aovPrev, 'currency') : null

  const waterfallSegments = kpi ? buildWaterfallSegments(kpi, t) : []
  const chartsLoading = monthlyRevenueLoading || (Boolean(prevPeriod) && monthlyPrevLoading)

  return (
    <DashboardPage className="flex flex-1 flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-4xl">
            {t('navHome')}
          </h1>
        </div>
        <div className="w-full max-w-md">
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
      </header>

      {!activeConnectionId ? (
        <div className="rounded-md border border-[var(--shell-structure-border)] bg-[var(--bg-base)]/35 px-6 py-8 text-sm text-text-secondary">
          {t('reportsSelectConnection')}
        </div>
      ) : kpiLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`sk-${i}`} className="h-36 rounded-md border border-[var(--shell-structure-border)]" />
          ))}
        </div>
      ) : kpi && net && ebitda && margin && ord ? (
        <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            variant="featured"
            label={t('reportsNetRevenue')}
            helpText={t('reportsKpiHelpNetRevenue')}
            value={fmtCurrency(kpi.net_revenue, currency)}
            vsPriorLabel={vsPrior}
            priorValueDisplay={net.priorDisplay}
            pct={net.pct}
            trend={net.trend}
            comparisonUnavailable={net.unavailable}
          />
          <KpiCard
            label={t('reportsEbitda')}
            helpText={t('reportsKpiHelpEbitda')}
            value={fmtCurrency(kpi.ebitda, currency)}
            vsPriorLabel={vsPrior}
            priorValueDisplay={ebitda.priorDisplay}
            pct={ebitda.pct}
            trend={ebitda.trend}
            comparisonUnavailable={ebitda.unavailable}
          />
          <KpiCard
            label={t('reportsKpiMargenBrutoPct')}
            helpText={t('reportsKpiHelpMargenBrutoPct')}
            value={`${kpi.gross_margin_pct.toFixed(1)}%`}
            vsPriorLabel={vsPrior}
            priorValueDisplay={margin.priorDisplay}
            pct={margin.pct}
            trend={margin.trend}
            comparisonUnavailable={margin.unavailable}
          />
          <KpiCard
            label={t('reportsOrders')}
            helpText={t('reportsKpiHelpOrders')}
            value={kpi.order_count.toLocaleString()}
            vsPriorLabel={vsPrior}
            priorValueDisplay={ord.priorDisplay}
            pct={ord.pct}
            trend={ord.trend}
            comparisonUnavailable={ord.unavailable}
            showComparison={orders > 0}
          />
          <KpiCard
            label={t('reportsKpiAov')}
            helpText={t('reportsKpiHelpAov')}
            value={aov !== null ? fmtCurrency(aov, currency) : '—'}
            vsPriorLabel={vsPrior}
            priorValueDisplay={aovDelta?.priorDisplay ?? null}
            pct={aovDelta?.pct ?? null}
            trend={aovDelta?.trend ?? 'flat'}
            comparisonUnavailable={aovDelta?.unavailable ?? true}
            showComparison={orders > 0 && aov !== null}
          />
        </div>
        <div
          className="mt-2 flex min-w-0 flex-1 flex-col gap-5"
          aria-label={t('shellHomeChartRegion')}
        >
          <section>
            <SectionContainer className="overflow-visible">
              <SectionHeader
                title={t('dashboardRevenueTrendTitle')}
                description={t('dashboardRevenueTrendSubtitle')}
              />
              {monthlyRevenueError ? (
                <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
                  {t('reportsMonthlyLoadError')}
                </p>
              ) : chartsLoading ? (
                <Skeleton className="h-80 w-full rounded-md" />
              ) : (
                <DashboardRevenueTrendChart
                  startDate={startDate}
                  endDate={endDate}
                  prevStart={prevPeriod?.start ?? ''}
                  prevEnd={prevPeriod?.end ?? ''}
                  rowsCurrent={monthlyCurrent?.months ?? []}
                  rowsPrev={monthlyPrev?.months ?? []}
                  comparePrevious={Boolean(prevPeriod)}
                  currency={currency}
                  dateLocale={dateLocale}
                  t={t}
                />
              )}
            </SectionContainer>
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
              <WaterfallChart
                segments={waterfallSegments}
                currency={currency}
                grossRevenue={kpi.gross_revenue}
                formatPctOfGross={(pct) => t('reportsWaterfallPctOfGross').replace('{pct}', pct.toFixed(1))}
                finalBarCaption={t('reportsWaterfallFinalHint')}
              />
            </SectionContainer>
          </section>
        </div>
        </>
      ) : (
        <div className="rounded-md border border-[var(--shell-structure-border)] bg-[var(--bg-base)]/35 px-6 py-8 text-sm text-text-secondary">
          {t('reportsNoData')}
        </div>
      )}
    </DashboardPage>
  )
}
