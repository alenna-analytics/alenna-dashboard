import { useCallback, useMemo, useState } from 'react'

import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { enUS, es as esLocale } from 'date-fns/locale'
import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { useCurrentTenant } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import { apiFetch } from '@/lib/api'
import type { PlatformConnection } from '@/lib/types/connectors'
import { useLanguage, type Language } from '@/shell/providers/language-provider'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { Skeleton } from '@/ui/skeleton'
import { FilterDates } from '@/ui/filters/filter-dates'
import { FilterComboboxMulti } from '@/ui/filters/filter-combobox-multi'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import { KpiCard } from '@/ui/kpi-card'

import { DashboardChannelSalesChart } from './dashboard-channel-sales-chart'
import { DashboardProfitMarginChart } from './dashboard-profit-margin-chart'
import { DashboardRevenueTrendChart } from './dashboard-revenue-trend-chart'
import { HomeChannelDonutChart } from './home-channel-donut-chart'
import { HomeProductFilter } from './home-product-filter'
import { HomeTopProductsChart } from './home-top-products-chart'
import { getTopProductsChartHeightPx } from './home-top-products-chart-layout'
import { MoneyDisclaimer } from '@/shell/components/money-disclaimer'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import {
  computePreviousPeriod,
  computeShiftedPreviousPeriod,
  pctVersusPrevious,
  toYmd,
} from '@/pages/reports/reports-ui-helpers'
import { useMoney } from '@/hooks/use-money'
import { buildWaterfallSegments } from '@/pages/reports/waterfall-segments'
import { WaterfallChart } from '@/pages/reports/waterfall-chart'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'
import { useReports } from '@/pages/reports/use-reports'
import { useProductReports } from '@/pages/reports/use-product-reports'
import { useTopProducts } from '@/pages/reports/use-top-products'
import { useChannelBreakdown } from '@/pages/reports/use-channel-breakdown'
import { useChannelTimeSeries } from '@/pages/reports/use-channel-time-series'
import type { KpiResponse, ProductKpiResponse, RevenueSeriesGranularity } from '@/lib/types/reports'

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

function zeroProductKpi(currency: string): ProductKpiResponse {
  return {
    gross_revenue: 0,
    cogs: 0,
    gross_profit: 0,
    gross_margin_pct: 0,
    units_sold: 0,
    currency,
  }
}

type HomeFiltersState = {
  startDate: string
  endDate: string
  connectionIds: string[]
  productIds: string[]
  /** Schema version; bumped when shape changes so old payloads are dropped. */
  v: number
}

const FILTERS_VERSION = 2
const FILTERS_KEY = 'alenna.reports.filters.v2'

function parseHomeFilters(raw: unknown): HomeFiltersState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.v !== FILTERS_VERSION) return null
  if (typeof o.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.startDate)) return null
  if (typeof o.endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.endDate)) return null
  if (!Array.isArray(o.connectionIds)) return null
  const connectionIds = o.connectionIds.filter(
    (x): x is string => typeof x === 'string',
  )
  const productIds = Array.isArray(o.productIds)
    ? o.productIds.filter((x): x is string => typeof x === 'string')
    : []
  return {
    startDate: o.startDate,
    endDate: o.endDate,
    connectionIds,
    productIds,
    v: FILTERS_VERSION,
  }
}

function fmtCompact(value: number, currency: string, lang: Language): string {
  const abs = Math.abs(value)
  const narrow = lang === 'es' ? 'es-MX' : 'en-US'

  if (abs >= 1_000_000) {
    const m = value / 1_000_000
    const part = m.toLocaleString(narrow, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
    return `${part}M`
  }
  if (abs >= 1_000) {
    const k = value / 1_000
    const part = k.toLocaleString(narrow, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
    return lang === 'es' ? `${part} mil` : `${part} K`
  }
  return new Intl.NumberFormat(narrow, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function platformDisplayName(platform: string): string {
  const trimmed = platform.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function DashboardHomeLoadingSkeleton({ chartRegionLabel }: { chartRegionLabel: string }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
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
    return {
      startDate: toYmd(thirtyDaysAgo),
      endDate: toYmd(today),
      connectionIds: [],
      productIds: [],
      v: FILTERS_VERSION,
    }
  }, [])

  const [filters, setFilters] = useTenantPersistedJson(
    tenantId,
    FILTERS_KEY,
    defaultFilters,
    parseHomeFilters,
  )

  const { startDate, endDate, connectionIds, productIds } = filters

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

  // Default to "all enabled" when no persisted selection exists. Preserves
  // the legacy single-connection behaviour without forcing the user to
  // open the picker on first visit.
  const activeConnectionIds = useMemo(() => {
    if (connections.length === 0) return [] as string[]
    if (connectionIds.length === 0) return connections.map((c) => c.id)
    const valid = new Set(connections.map((c) => c.id))
    const filtered = connectionIds.filter((id) => valid.has(id))
    return filtered.length > 0 ? filtered : connections.map((c) => c.id)
  }, [connections, connectionIds])

  const channelOptions = useMemo(
    () =>
      connections.map((c) => ({
        value: c.id,
        label: platformDisplayName(c.platform),
      })),
    [connections],
  )

  const prevPeriod = useMemo(() => computePreviousPeriod(startDate, endDate), [startDate, endDate])

  const [revenueGranularity, setRevenueGranularity] = useState<RevenueSeriesGranularity>('month')

  const revenuePrevPeriod = useMemo(() => {
    if (revenueGranularity === 'month') return computePreviousPeriod(startDate, endDate)
    return computeShiftedPreviousPeriod(startDate, endDate)
  }, [startDate, endDate, revenueGranularity])

  const revenueTrendSubtitle = useMemo(() => {
    if (revenueGranularity === 'week') return t('dashboardRevenueTrendSubtitleWeek')
    if (revenueGranularity === 'day') return t('dashboardRevenueTrendSubtitleDay')
    return t('dashboardRevenueTrendSubtitleMonth')
  }, [revenueGranularity, t])

  const revenueGranularityOptions = useMemo(
    () => [
      { value: 'month', label: t('dashboardRevenueGranularityMonth') },
      { value: 'week', label: t('dashboardRevenueGranularityWeek') },
      { value: 'day', label: t('dashboardRevenueGranularityDay') },
    ],
    [t],
  )

  const productMode = productIds.length > 0

  // Order-level KPIs (no product selected)
  const { data: kpi, isLoading: kpiLoading } = useReports({
    connectionIds: activeConnectionIds,
    startDate,
    endDate,
    enabled: !productMode,
  })
  const { data: kpiPrev, isLoading: kpiPrevLoading } = useReports({
    connectionIds: activeConnectionIds,
    startDate: prevPeriod?.start ?? '',
    endDate: prevPeriod?.end ?? '',
    enabled: !productMode && Boolean(prevPeriod),
  })

  // Product-scoped KPIs (single product selected)
  const { data: pkpi, isLoading: pkpiLoading } = useProductReports({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    enabled: productMode,
  })
  const { data: pkpiPrev, isLoading: pkpiPrevLoading } = useProductReports({
    connectionIds: activeConnectionIds,
    productIds,
    startDate: prevPeriod?.start ?? '',
    endDate: prevPeriod?.end ?? '',
    enabled: productMode && Boolean(prevPeriod),
  })

  const { data: monthlyCurrent, isLoading: monthlyRevenueLoading, isError: monthlyRevenueError } =
    useMonthlyRevenueSeries({
      connectionIds: activeConnectionIds,
      startDate,
      endDate,
      granularity: revenueGranularity,
      enabled: activeConnectionIds.length > 0,
    })

  const { data: monthlyPrev, isLoading: monthlyPrevLoading } = useMonthlyRevenueSeries({
    connectionIds: activeConnectionIds,
    startDate: revenuePrevPeriod?.start ?? '',
    endDate: revenuePrevPeriod?.end ?? '',
    granularity: revenueGranularity,
    enabled: activeConnectionIds.length > 0 && Boolean(revenuePrevPeriod),
  })

  const { data: channelBreakdown, isLoading: channelLoading } = useChannelBreakdown({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    enabled: activeConnectionIds.length > 0,
  })

  const {
    data: channelTimeSeries,
    isLoading: channelTimeSeriesLoading,
    isError: channelTimeSeriesError,
  } = useChannelTimeSeries({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    granularity: revenueGranularity,
    enabled: activeConnectionIds.length > 0,
  })

  const { data: topProducts, isLoading: topProductsLoading } = useTopProducts({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    limit: 10,
    enabled: activeConnectionIds.length > 0,
  })

  const { format: formatMoney, convert: convertMoney, effectiveDisplayCurrency, baseCurrency } =
    useMoney()

  const displayKpi = useMemo((): KpiResponse | null => {
    if (productMode) return null
    if (connectorsLoading) return null
    if (activeConnectionIds.length > 0 && kpiLoading) return null
    return kpi ?? zeroKpiResponse(baseCurrency)
  }, [productMode, connectorsLoading, activeConnectionIds, kpiLoading, kpi, baseCurrency])

  const displayProductKpi = useMemo((): ProductKpiResponse | null => {
    if (!productMode) return null
    if (connectorsLoading) return null
    if (activeConnectionIds.length > 0 && pkpiLoading) return null
    return pkpi ?? zeroProductKpi(baseCurrency)
  }, [productMode, connectorsLoading, activeConnectionIds, pkpiLoading, pkpi, baseCurrency])

  const currency = displayKpi?.currency ?? displayProductKpi?.currency ?? baseCurrency
  const convertFromBase = useMemo(
    () => (n: number) => convertMoney(n, { nativeCurrency: currency }).amount,
    [convertMoney, currency],
  )
  const formatInDisplay = useMemo(
    () => (n: number) =>
      formatMoney(n, { nativeCurrency: effectiveDisplayCurrency }),
    [formatMoney, effectiveDisplayCurrency],
  )
  const formatCompactInDisplay = useMemo(
    () => (n: number) => fmtCompact(n, effectiveDisplayCurrency, lang),
    [effectiveDisplayCurrency, lang],
  )

  const orders = displayKpi?.order_count ?? 0
  const aov = orders > 0 && displayKpi ? displayKpi.net_revenue / orders : null

  const previousReady = Boolean(prevPeriod) && (productMode ? !pkpiPrevLoading : !kpiPrevLoading)

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

  function deltaBlock(
    current: number,
    previous: number | undefined,
    fmt: 'currency' | 'count' | 'percent',
  ) {
    const priorUnavailable = !previousReady || previous === undefined
    const priorDisplay =
      priorUnavailable || previous === undefined
        ? null
        : fmt === 'currency'
          ? formatMoney(previous, { nativeCurrency: currency })
          : fmt === 'percent'
            ? `${previous.toFixed(1)}%`
            : previous.toLocaleString()
    // Zero-prior handling: pctVersusPrevious returns null when prior=0 and
    // current>0; we surface "new" via the unavailable path so the trend
    // arrow doesn't show a misleading 100%.
    const delta =
      previous !== undefined && previousReady ? pctVersusPrevious(current, previous) : null
    return {
      priorDisplay,
      pct: delta?.pct ?? null,
      trend: delta?.trend ?? ('flat' as const),
      unavailable: priorUnavailable,
    }
  }

  // Order-level deltas
  const net = displayKpi ? deltaBlock(displayKpi.net_revenue, kpiPrev?.net_revenue, 'currency') : null
  const ebitda = displayKpi ? deltaBlock(displayKpi.ebitda, kpiPrev?.ebitda, 'currency') : null
  const margin = displayKpi
    ? deltaBlock(displayKpi.gross_margin_pct, kpiPrev?.gross_margin_pct, 'percent')
    : null
  const ord = displayKpi ? deltaBlock(displayKpi.order_count, kpiPrev?.order_count, 'count') : null
  const aovCur = aov ?? 0
  const aovPrev =
    kpiPrev && kpiPrev.order_count > 0 ? kpiPrev.net_revenue / kpiPrev.order_count : undefined
  const aovDelta = displayKpi && aov !== null ? deltaBlock(aovCur, aovPrev, 'currency') : null

  // Product-scoped deltas
  const pGross = displayProductKpi
    ? deltaBlock(displayProductKpi.gross_revenue, pkpiPrev?.gross_revenue, 'currency')
    : null
  const pCogs = displayProductKpi
    ? deltaBlock(displayProductKpi.cogs, pkpiPrev?.cogs, 'currency')
    : null
  const pProfit = displayProductKpi
    ? deltaBlock(displayProductKpi.gross_profit, pkpiPrev?.gross_profit, 'currency')
    : null
  const pMargin = displayProductKpi
    ? deltaBlock(displayProductKpi.gross_margin_pct, pkpiPrev?.gross_margin_pct, 'percent')
    : null
  const pUnits = displayProductKpi
    ? deltaBlock(displayProductKpi.units_sold, pkpiPrev?.units_sold, 'count')
    : null

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
    activeConnectionIds.length > 0 &&
    (monthlyRevenueLoading || (Boolean(revenuePrevPeriod) && monthlyPrevLoading))

  const pairedChartBodyPx = useMemo(() => getTopProductsChartHeightPx(), [])

  const showTopProducts = true

  const isInitialLoad = displayKpi === null && displayProductKpi === null

  return (
    <DashboardPage className="flex flex-1 flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-4xl">
            {t('navHome')}
          </h1>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2">
          <div className="min-w-[15rem]">
            <FilterDates
              strings={pickerStrings}
              startValue={startDate}
              endValue={endDate}
              onStartChange={(v) => v && setFilters({ startDate: v })}
              onEndChange={(v) => v && setFilters({ endDate: v })}
              label={t('filterDateTimeLabel')}
              clearAriaLabel={t('filterClear')}
              onClear={() =>
                setFilters({
                  startDate: defaultFilters.startDate,
                  endDate: defaultFilters.endDate,
                })
              }
            />
          </div>
          <FilterComboboxMulti
            label={t('homeFilterChannels')}
            options={channelOptions}
            values={connectionIds}
            onValuesChange={(next) => setFilters({ connectionIds: next })}
            applyLabel={t('datePickerApply')}
            searchPlaceholder={t('homeFilterChannelsSearch')}
            emptyLabel={t('homeFilterChannelsEmpty')}
            clearAriaLabel={t('filterClear')}
            selectAllLabel={t('homeFilterSelectAll')}
            deselectAllLabel={t('homeFilterDeselectAll')}
          />
          <HomeProductFilter
            values={productIds}
            onValuesChange={(next) => setFilters({ productIds: next })}
            label={t('homeFilterProduct')}
            applyLabel={t('datePickerApply')}
            searchPlaceholder={t('homeFilterProductSearch')}
            emptyLabel={t('homeFilterProductEmpty')}
            selectAllLabel={t('homeFilterSelectAll')}
            deselectAllLabel={t('homeFilterDeselectAll')}
            selectAllContainingLabel={t('homeFilterSelectAllContaining')}
            deselectAllContainingLabel={t('homeFilterDeselectAllContaining')}
            allContainingSummaryLabel={t('homeFilterAllContainingSummary')}
          />
          <div className="min-w-[10.5rem] shrink-0">
            <FilterComboboxSingle
              label={t('dashboardRevenueGranularityLabel')}
              options={revenueGranularityOptions}
              value={revenueGranularity}
              onValueChange={(v) => {
                if (v === 'month' || v === 'week' || v === 'day') setRevenueGranularity(v)
              }}
              applyLabel={t('datePickerApply')}
              searchPlaceholder={t('filterSearch')}
              emptyLabel={t('filterComingSoon')}
              allowClear={false}
            />
          </div>
        </div>
      </header>

      {isInitialLoad ? (
        <DashboardHomeLoadingSkeleton chartRegionLabel={t('shellHomeChartRegion')} />
      ) : (
        <>
          <MoneyDisclaimer />
          {productMode && displayProductKpi ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <KpiCard
                label={t('reportsGrossRevenue')}
                value={formatMoney(displayProductKpi.gross_revenue, { nativeCurrency: currency })}
                vsPriorLabel={vsPrior}
                priorValueDisplay={pGross!.priorDisplay}
                pct={pGross!.pct}
                trend={pGross!.trend}
                comparisonUnavailable={pGross!.unavailable}
              />
              <KpiCard
                label={t('homeProductKpiCogs')}
                value={formatMoney(displayProductKpi.cogs, { nativeCurrency: currency })}
                vsPriorLabel={vsPrior}
                priorValueDisplay={pCogs!.priorDisplay}
                pct={pCogs!.pct}
                trend={pCogs!.trend}
                comparisonUnavailable={pCogs!.unavailable}
              />
              <KpiCard
                label={t('reportsGrossProfit')}
                value={formatMoney(displayProductKpi.gross_profit, { nativeCurrency: currency })}
                vsPriorLabel={vsPrior}
                priorValueDisplay={pProfit!.priorDisplay}
                pct={pProfit!.pct}
                trend={pProfit!.trend}
                comparisonUnavailable={pProfit!.unavailable}
              />
              <KpiCard
                label={t('reportsKpiMargenBrutoPct')}
                value={`${displayProductKpi.gross_margin_pct.toFixed(1)}%`}
                vsPriorLabel={vsPrior}
                priorValueDisplay={pMargin!.priorDisplay}
                pct={pMargin!.pct}
                trend={pMargin!.trend}
                comparisonUnavailable={pMargin!.unavailable}
              />
              <KpiCard
                label={t('homeProductKpiUnits')}
                value={displayProductKpi.units_sold.toLocaleString()}
                vsPriorLabel={vsPrior}
                priorValueDisplay={pUnits!.priorDisplay}
                pct={pUnits!.pct}
                trend={pUnits!.trend}
                comparisonUnavailable={pUnits!.unavailable}
              />
            </div>
          ) : displayKpi ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <KpiCard
                label={t('reportsNetRevenue')}
                helpText={t('reportsKpiHelpNetRevenue')}
                value={formatMoney(displayKpi.net_revenue, { nativeCurrency: currency })}
                vsPriorLabel={vsPrior}
                priorValueDisplay={net!.priorDisplay}
                pct={net!.pct}
                trend={net!.trend}
                comparisonUnavailable={net!.unavailable}
              />
              <KpiCard
                label={t('reportsEbitda')}
                helpText={t('reportsKpiHelpEbitda')}
                value={formatMoney(displayKpi.ebitda, { nativeCurrency: currency })}
                vsPriorLabel={vsPrior}
                priorValueDisplay={ebitda!.priorDisplay}
                pct={ebitda!.pct}
                trend={ebitda!.trend}
                comparisonUnavailable={ebitda!.unavailable}
              />
              <KpiCard
                label={t('reportsKpiMargenBrutoPct')}
                helpText={t('reportsKpiHelpMargenBrutoPct')}
                value={`${displayKpi.gross_margin_pct.toFixed(1)}%`}
                vsPriorLabel={vsPrior}
                priorValueDisplay={margin!.priorDisplay}
                pct={margin!.pct}
                trend={margin!.trend}
                comparisonUnavailable={margin!.unavailable}
              />
              <KpiCard
                label={t('reportsOrders')}
                helpText={t('reportsKpiHelpOrders')}
                value={displayKpi.order_count.toLocaleString()}
                vsPriorLabel={vsPrior}
                priorValueDisplay={ord!.priorDisplay}
                pct={ord!.pct}
                trend={ord!.trend}
                comparisonUnavailable={ord!.unavailable}
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
          ) : null}

          <div
            className={
              showTopProducts
                ? 'mt-2 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch'
                : 'mt-2 grid grid-cols-1 gap-5'
            }
          >
            <section className={showTopProducts ? 'flex min-h-0 lg:h-full' : undefined}>
              <SectionContainer className="flex h-full min-h-0 flex-1 flex-col overflow-visible">
                <SectionHeader
                  title={t('homeChannelDonutTitle')}
                  description={t('homeChannelDonutSubtitle')}
                />
                {channelLoading ? (
                  <Skeleton
                    className="w-full flex-1 rounded-md"
                    style={{ minHeight: pairedChartBodyPx }}
                  />
                ) : (
                  <HomeChannelDonutChart
                    rows={channelBreakdown?.items ?? []}
                    convertValue={convertFromBase}
                    formatValue={formatInDisplay}
                    t={t}
                    minBodyHeightPx={showTopProducts ? pairedChartBodyPx : undefined}
                  />
                )}
              </SectionContainer>
            </section>
            {showTopProducts ? (
              <section className="flex min-h-0 lg:h-full">
                <SectionContainer className="flex h-full min-h-0 flex-1 flex-col overflow-visible">
                  <SectionHeader
                    title={t('homeTopProductsTitle')}
                    description={t('homeTopProductsSubtitle').replace(
                      '{count}',
                      String(topProducts?.items.length ?? 10),
                    )}
                  />
                  {topProductsLoading ? (
                    <Skeleton
                      className="w-full flex-1 rounded-md"
                      style={{ minHeight: pairedChartBodyPx }}
                    />
                  ) : (
                    <HomeTopProductsChart
                      rows={topProducts?.items ?? []}
                      convertValue={convertFromBase}
                      formatValue={formatInDisplay}
                      formatCompact={formatCompactInDisplay}
                      t={t}
                    />
                  )}
                </SectionContainer>
              </section>
            ) : null}
          </div>

          <div
            className="mt-2 flex min-w-0 flex-1 flex-col gap-5"
            aria-label={t('shellHomeChartRegion')}
          >
            <section>
              <SectionContainer className="overflow-visible">
                <SectionHeader
                  title={t('dashboardRevenueTrendTitle')}
                  description={revenueTrendSubtitle}
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
                    prevStart={revenuePrevPeriod?.start ?? ''}
                    prevEnd={revenuePrevPeriod?.end ?? ''}
                    granularity={revenueGranularity}
                    rowsCurrent={monthlyCurrent?.months ?? []}
                    rowsPrev={monthlyPrev?.months ?? []}
                    comparePrevious={Boolean(revenuePrevPeriod)}
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
                  title={t('dashboardChannelSalesTitle')}
                  description={t('dashboardChannelSalesSubtitle')}
                />
                {channelTimeSeriesLoading ? (
                  <Skeleton className="h-[24rem] w-full rounded-md" />
                ) : channelTimeSeriesError ? (
                  <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
                    {t('reportsMonthlyLoadError')}
                  </p>
                ) : (
                  <DashboardChannelSalesChart
                    startDate={startDate}
                    endDate={endDate}
                    granularity={revenueGranularity}
                    rows={channelTimeSeries?.rows ?? []}
                    currency={effectiveDisplayCurrency}
                    convertValue={convertFromBase}
                    formatValue={formatInDisplay}
                    dateLocale={dateLocale}
                    t={t}
                  />
                )}
              </SectionContainer>
            </section>
            <section>
              <SectionContainer className="overflow-visible">
                <SectionHeader
                  title={t('dashboardProfitMarginTitle')}
                  description={t('dashboardProfitMarginSubtitle')}
                />
                {channelTimeSeriesLoading ? (
                  <Skeleton className="h-[24rem] w-full rounded-md" />
                ) : channelTimeSeriesError ? (
                  <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
                    {t('reportsMonthlyLoadError')}
                  </p>
                ) : (
                  <DashboardProfitMarginChart
                    startDate={startDate}
                    endDate={endDate}
                    granularity={revenueGranularity}
                    rows={channelTimeSeries?.rows ?? []}
                    currency={effectiveDisplayCurrency}
                    convertValue={convertFromBase}
                    formatValue={formatInDisplay}
                    dateLocale={dateLocale}
                    t={t}
                  />
                )}
              </SectionContainer>
            </section>
            {!productMode && displayKpi ? (
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
                    formatPctOfGross={(pct) =>
                      t('reportsWaterfallPctOfGross').replace('{pct}', pct.toFixed(1))
                    }
                    finalBarCaption={t('reportsWaterfallFinalHint')}
                  />
                </SectionContainer>
              </section>
            ) : null}
          </div>
        </>
      )}
    </DashboardPage>
  )
}
