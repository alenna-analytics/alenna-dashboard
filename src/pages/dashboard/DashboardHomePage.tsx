import { useCallback, useMemo } from 'react'

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
import { BootSpinner } from '@/ui/boot-spinner'
import { Skeleton } from '@/ui/skeleton'
import { DateRangePicker } from '@/ui/date-range-picker'
import { KpiCard } from '@/ui/kpi-card'

import { DashboardRevenueTrendChart } from './dashboard-revenue-trend-chart'
import { MoneyDisclaimer } from '@/shell/components/money-disclaimer'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import {
  computePreviousPeriod,
  pctVersusPrevious,
  toYmd,
} from '@/pages/reports/reports-ui-helpers'
import { useMoney } from '@/hooks/use-money'
import { buildWaterfallSegments } from '@/pages/reports/waterfall-segments'
import { WaterfallChart } from '@/pages/reports/waterfall-chart'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'
import { useReports } from '@/pages/reports/use-reports'
import type { KpiResponse } from '@/lib/types/reports'

function zeroKpiResponse(currency: string): KpiResponse {
  return {
    gross_revenue: 0,
    discounts: 0,
    returns: 0,
    referral_commissions: 0,
    shipping: 0,
    taxes: 0,
    per_transaction_fees: 0,
    net_revenue: 0,
    cogs: 0,
    gross_profit: 0,
    gross_margin_pct: 0,
    platform_fees_total: 0,
    merchant_shipping_cost: 0,
    ads_spend: 0,
    fixed_operating_expenses: 0,
    contribution_margin: 0,
    contribution_margin_pct: 0,
    ebitda: 0,
    ebitda_margin_pct: 0,
    units_sold: 0,
    order_count: 0,
    currency,
    cogs_incomplete: false,
    order_status_counts: {},
  }
}

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

function DashboardHomeLoadingSkeleton({ chartRegionLabel }: { chartRegionLabel: string }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div
          className="flex min-w-0 flex-col gap-2.5 rounded-md border border-white/25 bg-[var(--color-accent-forest)] p-3.5 sm:p-4"
          aria-hidden
        >
          <div className="flex w-full min-w-0 items-start justify-between gap-2">
            <div className="h-5 w-28 max-w-[70%] animate-pulse rounded-md bg-white/25" />
            <div className="size-5 shrink-0 animate-pulse rounded-full bg-white/15" />
          </div>
          <div className="h-[1.75rem] w-36 max-w-full animate-pulse rounded-md bg-white/30 sm:h-8" />
          <div className="mt-1 space-y-2">
            <div className="h-3 w-24 animate-pulse rounded-md bg-white/20" />
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div className="h-6 w-20 animate-pulse rounded-md bg-white/25" />
              <div className="h-6 w-14 animate-pulse rounded-md bg-white/20" />
            </div>
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex min-w-0 flex-col gap-2.5 rounded-md border border-[var(--shell-structure-border)] bg-white p-3.5 sm:p-4"
            aria-hidden
          >
            <div className="flex w-full min-w-0 items-start justify-between gap-2">
              <Skeleton className="h-5 w-24 max-w-[65%]" />
              <Skeleton className="size-5 shrink-0 rounded-full" />
            </div>
            <Skeleton className="h-[1.75rem] w-32 max-w-full sm:h-8" />
            <div className="mt-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-12 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-2 flex min-w-0 flex-1 flex-col gap-5"
        aria-label={chartRegionLabel}
        aria-busy="true"
      >
        <section>
          <SectionContainer className="overflow-visible">
            <div className="mb-4 space-y-2" aria-hidden>
              <Skeleton className="h-6 w-56 max-w-[85%]" />
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </div>
            <Skeleton className="h-80 w-full rounded-md" />
          </SectionContainer>
        </section>
        <section>
          <SectionContainer className="overflow-visible">
            <div className="mb-4 space-y-2" aria-hidden>
              <Skeleton className="h-6 w-52 max-w-[80%]" />
              <Skeleton className="h-4 w-full max-w-2xl" />
            </div>
            <Skeleton className="h-72 w-full rounded-md" />
          </SectionContainer>
        </section>
      </div>
    </>
  )
}

export function DashboardHomePage() {
  const { lang } = useLanguage()
  const dateLocale = lang === 'en' ? enUS : esLocale
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const t = useCallback(
    (k: Parameters<typeof shellT>[1]) => shellT(lang, k),
    [lang],
  )

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
  const connectorsLoading = Boolean(tenantId) && connectionsQuery.isLoading
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

  const { format: formatMoney, convert: convertMoney, effectiveDisplayCurrency, baseCurrency } =
    useMoney()

  const displayKpi = useMemo((): KpiResponse | null => {
    if (connectorsLoading) return null
    if (activeConnectionId && kpiLoading) return null
    return kpi ?? zeroKpiResponse(baseCurrency)
  }, [connectorsLoading, activeConnectionId, kpiLoading, kpi, baseCurrency])

  const currency = displayKpi?.currency ?? baseCurrency
  const convertFromBase = useMemo(
    () => (n: number) => convertMoney(n, { nativeCurrency: currency }).amount,
    [convertMoney, currency],
  )
  // For chart tooltips: number is *already* in display currency, so format
  // with `nativeCurrency = display` to skip a second conversion.
  const formatInDisplay = useMemo(
    () => (n: number) =>
      formatMoney(n, { nativeCurrency: effectiveDisplayCurrency }),
    [formatMoney, effectiveDisplayCurrency],
  )
  const orders = displayKpi?.order_count ?? 0
  const aov = orders > 0 && displayKpi ? displayKpi.net_revenue / orders : null

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
    presetLastYear: t('datePickerLastYear'),
  }

  const vsPrior = t('reportsVsPreviousPeriod')

  function deltaBlock(current: number, previous: number | undefined, fmt: 'currency' | 'count' | 'percent') {
    const priorUnavailable = !previousReady || previous === undefined
    const priorDisplay =
      priorUnavailable || previous === undefined
        ? null
        : fmt === 'currency'
          ? formatMoney(previous, { nativeCurrency: currency })
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

  const net = displayKpi ? deltaBlock(displayKpi.net_revenue, kpiPrev?.net_revenue, 'currency') : null
  const ebitda = displayKpi ? deltaBlock(displayKpi.ebitda, kpiPrev?.ebitda, 'currency') : null
  const margin = displayKpi
    ? deltaBlock(displayKpi.gross_margin_pct, kpiPrev?.gross_margin_pct, 'percent')
    : null
  const ord = displayKpi ? deltaBlock(displayKpi.order_count, kpiPrev?.order_count, 'count') : null
  const aovCur = aov ?? 0
  const aovPrev =
    kpiPrev && kpiPrev.order_count > 0 ? kpiPrev.net_revenue / kpiPrev.order_count : undefined
  const aovDelta =
    displayKpi && aov !== null ? deltaBlock(aovCur, aovPrev, 'currency') : null

  const waterfallSegments = useMemo(() => {
    if (!displayKpi) return []
    const segs = buildWaterfallSegments(displayKpi, t)
    return segs.map((s) => ({
      ...s,
      value: convertFromBase(s.value),
      stackedParts: s.stackedParts?.map((p) => ({
        ...p,
        value: convertFromBase(p.value),
      })),
    }))
  }, [displayKpi, t, convertFromBase])
  const chartsLoading =
    Boolean(activeConnectionId) &&
    (monthlyRevenueLoading || (Boolean(prevPeriod) && monthlyPrevLoading))

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

      {connectorsLoading ? (
        <div
          className="flex min-h-[12rem] items-center justify-center rounded-md border border-[var(--shell-structure-border)] bg-[var(--bg-base)]/35 px-6 py-8"
          aria-busy
          aria-label={t('bootLoadingLabel')}
        >
          <BootSpinner />
        </div>
      ) : displayKpi === null ? (
        <DashboardHomeLoadingSkeleton chartRegionLabel={t('shellHomeChartRegion')} />
      ) : (
        <>
        <MoneyDisclaimer />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            variant="featured"
            label={t('reportsNetRevenue')}
            helpText={t('reportsKpiHelpNetRevenue')}
            value={formatMoney(displayKpi.net_revenue, { nativeCurrency: currency })}
            vsPriorLabel={vsPrior}
            priorValueDisplay={net.priorDisplay}
            pct={net.pct}
            trend={net.trend}
            comparisonUnavailable={net.unavailable}
          />
          <KpiCard
            label={t('reportsEbitda')}
            helpText={t('reportsKpiHelpEbitda')}
            value={formatMoney(displayKpi.ebitda, { nativeCurrency: currency })}
            vsPriorLabel={vsPrior}
            priorValueDisplay={ebitda.priorDisplay}
            pct={ebitda.pct}
            trend={ebitda.trend}
            comparisonUnavailable={ebitda.unavailable}
          />
          <KpiCard
            label={t('reportsKpiMargenBrutoPct')}
            helpText={t('reportsKpiHelpMargenBrutoPct')}
            value={`${displayKpi.gross_margin_pct.toFixed(1)}%`}
            vsPriorLabel={vsPrior}
            priorValueDisplay={margin.priorDisplay}
            pct={margin.pct}
            trend={margin.trend}
            comparisonUnavailable={margin.unavailable}
          />
          <KpiCard
            label={t('reportsOrders')}
            helpText={t('reportsKpiHelpOrders')}
            value={displayKpi.order_count.toLocaleString()}
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
            value={aov !== null ? formatMoney(aov, { nativeCurrency: currency }) : '—'}
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
                  currency={effectiveDisplayCurrency}
                  formatValue={formatInDisplay}
                  convertValue={convertFromBase}
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
              <WaterfallChart
                segments={waterfallSegments}
                currency={effectiveDisplayCurrency}
                grossRevenue={convertFromBase(displayKpi.gross_revenue)}
                formatPctOfGross={(pct) => t('reportsWaterfallPctOfGross').replace('{pct}', pct.toFixed(1))}
                finalBarCaption={t('reportsWaterfallFinalHint')}
              />
            </SectionContainer>
          </section>
        </div>
        </>
      )}
    </DashboardPage>
  )
}
