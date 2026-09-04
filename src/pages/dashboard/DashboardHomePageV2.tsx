import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { ChevronsDown, ChevronsUp, ListRestart } from 'lucide-react'
import { enUS, es as esLocale } from 'date-fns/locale'

import { useCurrentTenant } from '@/auth/hooks'
import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { useMoney } from '@/hooks/use-money'
import { formatCompactNumber } from '@/lib/format/compact-number'
import { useSalesMetricBasis } from '@/hooks/use-sales-metric-basis'
import { apiFetch } from '@/lib/api'
import { usePnlAwareT } from '@/pages/configuration/pnl-terms/use-pnl-labels-queries'
import {
  homeSalesHelpKey,
  orderKpiProfit,
  orderKpiSales,
  productKpiProfit,
  productKpiSales,
  profitHelpKey,
  profitLabelKey,
  salesLabelKey,
} from '@/lib/sales-metric-basis'
import type { PlatformConnection } from '@/lib/types/connectors'
import type { KpiResponse, ProductKpiResponse, RevenueSeriesGranularity } from '@/lib/types/reports'
import { zeroSettlementBreakdown } from '@/lib/settlement-utils'
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { HomeChannelShareSection } from '@/pages/dashboard/home-channel-donut-chart'
import { HomeMatchSuggestionAlerts } from '@/pages/dashboard/home-match-suggestion-alerts'
import { HomeNoIntegrationsState } from '@/pages/dashboard/home-no-integrations-state'
import { resolveHomePermissionFlags } from '@/pages/dashboard/home-permission-flags'
import { HomeProductFilter } from '@/pages/dashboard/home-product-filter'
import { HomeTopProductsChart } from '@/pages/dashboard/home-top-products-chart'
import { getTopProductsChartHeightPx } from '@/pages/dashboard/home-top-products-chart-layout'
import { useAlertsSummaryQuery } from '@/pages/dashboard/use-alerts-queries'
import {
  HOME_V2_KPI_DEFAULT_ORDER,
  HOME_V2_KPI_ORDER_KEY,
  HOME_V2_KPI_ORDER_VERSION,
  homeV2KpiSparklineExpandable,
  parseHomeV2KpiOrderState,
  type HomeV2KpiCardId,
  type HomeV2KpiOrderState,
} from '@/pages/dashboard/home-v2-kpi-card-order'
import { HomeV2KpiSortableGrid } from '@/pages/dashboard/home-v2-kpi-sortable-grid'
import { HomeV2KpiSparklineCard } from '@/pages/dashboard/home-v2-kpi-sparkline-card'
import {
  HomeV2SalesTrendChart,
  type HomeV2SalesTrendChartType,
} from '@/pages/dashboard/home-v2-sales-trend-chart'
import { AppSeriesChartViewToggle } from '@/pages/dashboard/app-chart-view-toggle'
import { HomeV2SalesTrendMetricFilters } from '@/pages/dashboard/home-v2-sales-trend-metric-filters'
import {
  formatHomeV2TrendMetricValue,
  homeV2TrendMetricLabel,
  homeV2TrendMetricValue,
  resolveHomeV2TrendMetric,
  type HomeV2TrendMetricId,
} from '@/pages/dashboard/home-v2-trend-metrics'
import { mergeRevenueSeriesRows } from '@/pages/reports/monthly-revenue-chart'
import {
  computePreviousPeriod,
  pctVersusPrevious,
} from '@/pages/reports/reports-ui-helpers'
import { SectionContainer, ChartSectionHeader } from '@/pages/reports/report-ui'
import { buildSettlementWaterfallSegments } from '@/pages/reports/settlement-waterfall-segments'
import { WaterfallChart } from '@/pages/reports/waterfall-chart'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'
import { useProductReports } from '@/pages/reports/use-product-reports'
import { filterEcommerceConnections, resolveAdsApiScope } from '@/lib/integrations/ads-scope'
import { AdsTrendChart } from '@/pages/ads/ads-trend-chart'
import { useAdsKpis, useAdsSeries } from '@/pages/ads/use-ads-kpis'
import { useReports } from '@/pages/reports/use-reports'
import { useChannelBreakdown } from '@/pages/reports/use-channel-breakdown'
import { useTopProducts } from '@/pages/reports/use-top-products'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useAlertsSheet } from '@/shell/alerts/alerts-sheet-context'
import { useLanguage, type Language } from '@/shell/providers/language-provider'
import { FilterComboboxMulti } from '@/ui/filters/filter-combobox-multi'
import { FilterDates } from '@/ui/filters/filter-dates'
import { dateRangePickerStrings, presetDateRangeYmd } from '@/ui/date-range-picker'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'
import { SalesMetricBasisToggle } from '@/ui/sales-metric-basis-toggle'
import { chromeIconButtonClassName } from '@/ui/surface'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'
import { buttonVariants } from '@/ui/button'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Link } from 'react-router-dom'

type HomeV2FiltersState = {
  startDate: string
  endDate: string
  connectionIds: string[]
  productIds: string[]
  v: number
}

const FILTERS_VERSION = 3
const FILTERS_KEY = 'alenna.home-v2.filters.v1'

function parseHomeV2Filters(raw: unknown): HomeV2FiltersState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.v !== FILTERS_VERSION) return null
  if (typeof o.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.startDate)) return null
  if (typeof o.endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.endDate)) return null
  if (!Array.isArray(o.connectionIds)) return null
  const connectionIds = o.connectionIds.filter((x): x is string => typeof x === 'string')
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
    settlement: zeroSettlementBreakdown(),
  }
}

function zeroProductKpi(currency: string): ProductKpiResponse {
  return {
    gross_revenue: 0,
    net_revenue: 0,
    cogs: 0,
    gross_profit: 0,
    gross_profit_on_gross: 0,
    gross_margin_pct: 0,
    units_sold: 0,
    order_count: 0,
    currency,
    settlement: zeroSettlementBreakdown(),
  }
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

function fmtCompact(value: number, currency: string, lang: Language): string {
  const abs = Math.abs(value)
  const narrow = lang === 'es' ? 'es-MX' : 'en-US'

  if (abs >= 1_000) {
    return formatCompactNumber(value, 1)
  }
  return new Intl.NumberFormat(narrow, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function PageSection({
  heading,
  children,
  className,
}: {
  heading?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      {heading ? (
        <h2 className="text-subtitle font-semibold text-text-primary">{heading}</h2>
      ) : null}
      {children}
    </section>
  )
}

function HomeV2LoadingSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-[148px] flex-col rounded-lg border border-border-card bg-white p-3"
            aria-hidden
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-7 w-32" />
            <Skeleton className="mt-auto h-14 w-full" />
          </div>
        ))}
      </div>
      <SectionContainer framed>
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="h-[280px] w-full rounded-md" />
      </SectionContainer>
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionContainer framed>
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="h-[288px] w-full rounded-md" />
        </SectionContainer>
        <SectionContainer framed>
          <Skeleton className="mb-4 h-5 w-44" />
          <Skeleton className="h-[288px] w-full rounded-md" />
        </SectionContainer>
      </div>
    </>
  )
}

export function DashboardHomePageV2() {
  const { lang } = useLanguage()
  const dateLocale = lang === 'en' ? enUS : esLocale
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { me } = useWorkspace()
  const t = usePnlAwareT()
  const { openSheet } = useAlertsSheet()
  const [salesMetricBasis, setSalesMetricBasis] = useSalesMetricBasis()
  const {
    canSalesHome,
    canAdsHome,
    canChannelHome,
    canAlertsHome,
    canFetchConnectors,
    hasAnyHomeWidget,
  } = useMemo(() => resolveHomePermissionFlags(me), [me])
  const alertsSummaryQuery = useAlertsSummaryQuery()
  // informational_count is match_suggestion-only today (stock uses critical/low).
  const matchSuggestionCount = alertsSummaryQuery.data?.informational_count ?? 0

  const defaultKpiOrder = useMemo(
    (): HomeV2KpiOrderState => ({
      order: HOME_V2_KPI_DEFAULT_ORDER,
      v: HOME_V2_KPI_ORDER_VERSION,
    }),
    [],
  )

  const [kpiLayout, setKpiLayout] = useTenantPersistedJson(
    tenantId,
    HOME_V2_KPI_ORDER_KEY,
    defaultKpiOrder,
    parseHomeV2KpiOrderState,
  )

  const defaultFilters = useMemo((): HomeV2FiltersState => {
    const { start, end } = presetDateRangeYmd('last30')
    return {
      startDate: start,
      endDate: end,
      connectionIds: [],
      productIds: [],
      v: FILTERS_VERSION,
    }
  }, [])

  const [filters, setFilters] = useTenantPersistedJson(
    tenantId,
    FILTERS_KEY,
    defaultFilters,
    parseHomeV2Filters,
  )

  const { startDate, endDate, connectionIds, productIds } = filters
  const productMode = productIds.length > 0
  const [salesTrendGranularity, setSalesTrendGranularity] =
    useState<RevenueSeriesGranularity>('day')
  const [salesTrendPrimaryMetric, setSalesTrendPrimaryMetric] =
    useState<HomeV2TrendMetricId>('net-sales')
  const [salesTrendSecondaryMetric, setSalesTrendSecondaryMetric] =
    useState<HomeV2TrendMetricId>('net-profit')
  const [salesTrendChartType, setSalesTrendChartType] =
    useState<HomeV2SalesTrendChartType>('line')
  const [adsTrendGranularity, setAdsTrendGranularity] =
    useState<RevenueSeriesGranularity>('day')
  const [adsTrendChartType, setAdsTrendChartType] =
    useState<HomeV2SalesTrendChartType>('line')

  const connectionsQuery = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId) && canFetchConnectors,
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as PlatformConnection[]
    },
  })

  const connections = useMemo(() => connectionsQuery.data ?? [], [connectionsQuery.data])
  const ecommerceConnections = useMemo(
    () => filterEcommerceConnections(connections),
    [connections],
  )
  const connectorsLoading = Boolean(tenantId) && connectionsQuery.isLoading
  const hasNoIntegrations =
    !connectorsLoading && connectionsQuery.isSuccess && connections.length === 0

  const activeConnectionIds = useMemo(() => {
    if (ecommerceConnections.length === 0) return [] as string[]
    if (connectionIds.length === 0) return ecommerceConnections.map((c) => c.id)
    const valid = new Set(ecommerceConnections.map((c) => c.id))
    const filtered = connectionIds.filter((id) => valid.has(id))
    return filtered.length > 0 ? filtered : ecommerceConnections.map((c) => c.id)
  }, [ecommerceConnections, connectionIds])

  const channelOptions = useMemo(
    () =>
      ecommerceConnections.map((c) => ({
        value: c.id,
        label: platformDisplayName(c.platform),
      })),
    [ecommerceConnections],
  )

  const prevPeriod = useMemo(() => computePreviousPeriod(startDate, endDate), [startDate, endDate])
  const sparkGranularity: RevenueSeriesGranularity = 'day'

  const { data: kpi, isLoading: kpiLoading, isSuccess: kpiReady } = useReports({
    connectionIds: activeConnectionIds,
    startDate,
    endDate,
    enabled: canSalesHome && !productMode,
  })
  const { data: kpiPrev, isLoading: kpiPrevLoading } = useReports({
    connectionIds: activeConnectionIds,
    startDate: prevPeriod?.start ?? '',
    endDate: prevPeriod?.end ?? '',
    enabled: canSalesHome && !productMode && Boolean(prevPeriod) && kpiReady,
  })
  const adsScope = useMemo(
    () =>
      resolveAdsApiScope(
        connections,
        connectionIds.length > 0 ? activeConnectionIds : undefined,
      ),
    [connections, connectionIds.length, activeConnectionIds],
  )
  const { data: adsKpi } = useAdsKpis({
    connectionIds: adsScope.queryConnectionIds,
    startDate,
    endDate,
    enabled: canAdsHome && !productMode && adsScope.hasAdsConnections,
  })
  const adsSeriesEnabled = canAdsHome && !productMode && adsScope.hasAdsConnections
  const {
    data: adsSeries,
    isLoading: adsSeriesLoading,
    isError: adsSeriesError,
  } = useAdsSeries({
    connectionIds: adsScope.queryConnectionIds,
    startDate,
    endDate,
    enabled: adsSeriesEnabled,
  })

  const { data: pkpi, isLoading: pkpiLoading, isSuccess: pkpiReady } = useProductReports({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    enabled: canSalesHome && productMode,
  })
  const { data: pkpiPrev, isLoading: pkpiPrevLoading } = useProductReports({
    connectionIds: activeConnectionIds,
    productIds,
    startDate: prevPeriod?.start ?? '',
    endDate: prevPeriod?.end ?? '',
    enabled: canSalesHome && productMode && Boolean(prevPeriod) && pkpiReady,
  })

  const { data: sparklineSeries } = useMonthlyRevenueSeries({
    connectionIds: activeConnectionIds,
    productIds: productMode ? productIds : undefined,
    startDate,
    endDate,
    granularity: sparkGranularity,
    enabled: canSalesHome && activeConnectionIds.length > 0,
  })

  const { data: salesTrendSeries, isError: salesTrendError } = useMonthlyRevenueSeries({
    connectionIds: activeConnectionIds,
    productIds: productMode ? productIds : undefined,
    startDate,
    endDate,
    granularity: salesTrendGranularity,
    enabled: canSalesHome && activeConnectionIds.length > 0,
  })

  const { data: channelBreakdown, isPending: channelDonutPending } = useChannelBreakdown({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    enabled: canChannelHome && activeConnectionIds.length > 0,
  })

  const { data: topProducts, isPending: topProductsPending } = useTopProducts({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    limit: 10,
    enabled: canSalesHome && activeConnectionIds.length > 0,
  })

  const pairedChartBodyPx = useMemo(() => getTopProductsChartHeightPx(), [])

  const {
    format: formatMoney,
    formatKpi,
    convert: convertMoney,
    effectiveDisplayCurrency,
    baseCurrency,
  } = useMoney()

  const displayKpi = useMemo((): KpiResponse | null => {
    if (!canSalesHome) return null
    if (productMode) return null
    if (connectorsLoading) return null
    if (activeConnectionIds.length > 0 && kpiLoading) return null
    return kpi ?? zeroKpiResponse(baseCurrency)
  }, [
    canSalesHome,
    productMode,
    connectorsLoading,
    activeConnectionIds,
    kpiLoading,
    kpi,
    baseCurrency,
  ])

  const displayProductKpi = useMemo((): ProductKpiResponse | null => {
    if (!canSalesHome) return null
    if (!productMode) return null
    if (connectorsLoading) return null
    if (activeConnectionIds.length > 0 && pkpiLoading) return null
    return pkpi ?? zeroProductKpi(baseCurrency)
  }, [
    canSalesHome,
    productMode,
    connectorsLoading,
    activeConnectionIds,
    pkpiLoading,
    pkpi,
    baseCurrency,
  ])

  const showKpiCards = canSalesHome && Boolean(productMode ? displayProductKpi : displayKpi)
  const currency = displayKpi?.currency ?? displayProductKpi?.currency ?? baseCurrency

  const convertFromBase = useCallback(
    (n: number) => convertMoney(n, { nativeCurrency: currency }).amount,
    [convertMoney, currency],
  )

  const formatInDisplay = useCallback(
    (n: number) => formatMoney(n, { nativeCurrency: effectiveDisplayCurrency }),
    [formatMoney, effectiveDisplayCurrency],
  )

  const formatCompactInDisplay = useCallback(
    (n: number) => fmtCompact(n, effectiveDisplayCurrency, lang),
    [effectiveDisplayCurrency, lang],
  )

  const formatCardAmount = useCallback(
    (n: number) => formatKpi(n, { nativeCurrency: currency }),
    [formatKpi, currency],
  )

  const settlementSource = productMode ? displayProductKpi?.settlement : displayKpi?.settlement

  const settlementWaterfallSegments = useMemo(() => {
    if (!settlementSource) return []
    const segs = buildSettlementWaterfallSegments(settlementSource, t)
    return segs.map((s) => ({
      ...s,
      value: convertFromBase(s.value),
      stackedParts: s.stackedParts?.map((p) => ({
        ...p,
        value: convertFromBase(p.value),
      })),
    }))
  }, [settlementSource, t, convertFromBase])

  const salesCurrent = productMode
    ? productKpiSales(displayProductKpi ?? zeroProductKpi(currency), salesMetricBasis)
    : orderKpiSales(displayKpi ?? zeroKpiResponse(currency), salesMetricBasis)
  const profitCurrent = productMode
    ? productKpiProfit(displayProductKpi ?? zeroProductKpi(currency), salesMetricBasis)
    : orderKpiProfit(displayKpi ?? zeroKpiResponse(currency), salesMetricBasis)
  const contributionCurrent = productMode
    ? (displayProductKpi?.gross_profit ?? 0)
    : (displayKpi?.contribution_margin ?? 0)

  const salesPriorValue = productMode
    ? pkpiPrev
      ? productKpiSales(pkpiPrev, salesMetricBasis)
      : undefined
    : kpiPrev
      ? orderKpiSales(kpiPrev, salesMetricBasis)
      : undefined
  const profitPriorValue = productMode
    ? pkpiPrev
      ? productKpiProfit(pkpiPrev, salesMetricBasis)
      : undefined
    : kpiPrev
      ? orderKpiProfit(kpiPrev, salesMetricBasis)
      : undefined
  const contributionPriorValue = productMode
    ? pkpiPrev?.gross_profit
    : kpiPrev?.contribution_margin

  const orders = productMode
    ? (displayProductKpi?.order_count ?? 0)
    : (displayKpi?.order_count ?? 0)
  const unitsCurrent = productMode
    ? (displayProductKpi?.units_sold ?? 0)
    : (displayKpi?.units_sold ?? 0)
  const ebitdaCurrent = productMode ? null : (displayKpi?.ebitda ?? 0)
  const aov = orders > 0 ? salesCurrent / orders : null

  const unitsPriorValue = productMode ? pkpiPrev?.units_sold : kpiPrev?.units_sold
  const ordersPriorValue = productMode ? pkpiPrev?.order_count : kpiPrev?.order_count
  const ebitdaPriorValue = productMode ? undefined : kpiPrev?.ebitda
  const aovPriorValue = productMode
    ? pkpiPrev && (pkpiPrev.order_count ?? 0) > 0
      ? productKpiSales(pkpiPrev, salesMetricBasis) / pkpiPrev.order_count
      : undefined
    : kpiPrev && kpiPrev.order_count > 0
      ? orderKpiSales(kpiPrev, salesMetricBasis) / kpiPrev.order_count
      : undefined

  const previousReady = Boolean(prevPeriod) && (productMode ? !pkpiPrevLoading : !kpiPrevLoading)

  function deltaBlock(current: number, previous: number | undefined) {
    const priorUnavailable = !previousReady || previous === undefined
    const delta =
      previous !== undefined && previousReady ? pctVersusPrevious(current, previous) : null
    return {
      pct: delta?.pct ?? null,
      trend: delta?.trend ?? ('flat' as const),
      unavailable: priorUnavailable,
    }
  }

  const salesDelta = showKpiCards ? deltaBlock(salesCurrent, salesPriorValue) : null
  const profitDelta = showKpiCards ? deltaBlock(profitCurrent, profitPriorValue) : null
  const contributionDelta = showKpiCards
    ? deltaBlock(contributionCurrent, contributionPriorValue)
    : null
  const ebitdaDelta =
    showKpiCards && !productMode && ebitdaCurrent !== null
      ? deltaBlock(ebitdaCurrent, ebitdaPriorValue)
      : null
  const unitsDelta = showKpiCards ? deltaBlock(unitsCurrent, unitsPriorValue) : null
  const ordersDelta = showKpiCards ? deltaBlock(orders, ordersPriorValue) : null
  const aovDelta = showKpiCards && aov !== null ? deltaBlock(aov, aovPriorValue) : null

  const mergedSparkRows = useMemo(() => {
    if (!sparklineSeries?.months) return []
    return mergeRevenueSeriesRows(
      startDate,
      endDate,
      sparkGranularity,
      sparklineSeries.months,
      dateLocale,
    )
  }, [sparklineSeries, startDate, endDate, sparkGranularity, dateLocale])

  const profitSparklineScale = useMemo(() => {
    if (salesMetricBasis === 'net') return 1
    const kpi = productMode ? displayProductKpi : displayKpi
    if (!kpi) return 1
    const netField = kpi.gross_profit
    const grossProfit = productMode
      ? productKpiProfit(displayProductKpi ?? zeroProductKpi(currency), 'gross')
      : orderKpiProfit(displayKpi ?? zeroKpiResponse(currency), 'gross')
    return netField !== 0 ? grossProfit / netField : 1
  }, [salesMetricBasis, productMode, displayProductKpi, displayKpi, currency])

  const contributionSparklineScale = useMemo(() => {
    if (productMode) return 1
    const profit = orderKpiProfit(displayKpi ?? zeroKpiResponse(currency), salesMetricBasis)
    const cm = displayKpi?.contribution_margin ?? 0
    return profit !== 0 ? cm / profit : 1
  }, [productMode, displayKpi, currency, salesMetricBasis])

  const ebitdaSparklineScale = useMemo(() => {
    if (productMode || !displayKpi) return 1
    const gp = displayKpi.gross_profit
    return gp !== 0 ? displayKpi.ebitda / gp : 1
  }, [productMode, displayKpi])

  const trendMetricContext = useMemo(
    () => ({
      salesMetricBasis,
      productMode,
      convertValue: convertFromBase,
      profitSparklineScale,
      contributionSparklineScale,
      ebitdaSparklineScale,
      adsRoasAvailable: adsSeriesEnabled && !adsSeriesError,
    }),
    [
      salesMetricBasis,
      productMode,
      convertFromBase,
      profitSparklineScale,
      contributionSparklineScale,
      ebitdaSparklineScale,
      adsSeriesEnabled,
      adsSeriesError,
    ],
  )

  const effectiveSalesTrendPrimaryMetric = useMemo(
    () => resolveHomeV2TrendMetric(salesTrendPrimaryMetric, trendMetricContext, 'net-sales'),
    [salesTrendPrimaryMetric, trendMetricContext],
  )
  const effectiveSalesTrendSecondaryMetric = useMemo(
    () => resolveHomeV2TrendMetric(salesTrendSecondaryMetric, trendMetricContext, 'net-profit'),
    [salesTrendSecondaryMetric, trendMetricContext],
  )

  const buildSparklinePoints = useCallback(
    (metricId: HomeV2TrendMetricId) =>
      mergedSparkRows.map((row) => ({
        label: row.label,
        value: homeV2TrendMetricValue(row, metricId, trendMetricContext),
      })),
    [mergedSparkRows, trendMetricContext],
  )

  const formatSparklineForMetric = useCallback(
    (metricId: HomeV2TrendMetricId) => (value: number) =>
      formatHomeV2TrendMetricValue(metricId, value, formatInDisplay),
    [formatInDisplay],
  )

  const pickerStrings = dateRangePickerStrings(t)

  const isInitialLoad =
    connectorsLoading ||
    (canSalesHome &&
      (productMode
        ? activeConnectionIds.length > 0 && pkpiLoading
        : displayKpi === null))

  const isDefaultKpiOrder = useMemo(
    () =>
      kpiLayout.order.length === HOME_V2_KPI_DEFAULT_ORDER.length &&
      kpiLayout.order.every((id, index) => id === HOME_V2_KPI_DEFAULT_ORDER[index]),
    [kpiLayout.order],
  )

  const restoreDefaultKpiOrder = useCallback(() => {
    setKpiLayout({
      order: [...HOME_V2_KPI_DEFAULT_ORDER],
      v: HOME_V2_KPI_ORDER_VERSION,
    })
  }, [setKpiLayout])

  const [sparklineOpenById, setSparklineOpenById] = useState<
    Partial<Record<HomeV2KpiCardId, boolean>>
  >({})

  const expandableKpiIds = useMemo(
    () => HOME_V2_KPI_DEFAULT_ORDER.filter((id) => homeV2KpiSparklineExpandable(id, productMode)),
    [productMode],
  )
  const allSparklinesOpen =
    expandableKpiIds.length > 0 && expandableKpiIds.every((id) => sparklineOpenById[id])

  const toggleAllSparklines = useCallback(() => {
    const nextOpen = !allSparklinesOpen
    const next: Partial<Record<HomeV2KpiCardId, boolean>> = {}
    for (const id of expandableKpiIds) next[id] = nextOpen
    setSparklineOpenById(next)
  }, [allSparklinesOpen, expandableKpiIds])

  const kpiDeltaTooltip = t('homeKpiDeltaTooltip')

  const renderKpiCard = useCallback(
    (id: HomeV2KpiCardId, dragHandle: ReactNode) => {
      const sparklineControl = {
        sparklineOpen: Boolean(sparklineOpenById[id]),
        onSparklineOpenChange: (open: boolean) => {
          setSparklineOpenById((prev) => ({ ...prev, [id]: open }))
        },
      }
      switch (id) {
        case 'net-sales':
          return (
            <HomeV2KpiSparklineCard
              dragHandle={dragHandle}
              {...sparklineControl}
              label={t(salesLabelKey(salesMetricBasis))}
              helpText={t(homeSalesHelpKey(salesMetricBasis))}
              value={formatCardAmount(salesCurrent)}
              numericValue={salesCurrent}
              currencyCode={effectiveDisplayCurrency}
              pct={salesDelta!.pct}
              trend={salesDelta!.trend}
              comparisonUnavailable={salesDelta!.unavailable}
              deltaTooltip={kpiDeltaTooltip}
              sparklinePoints={buildSparklinePoints('net-sales')}
              sparklineMetricLabel={homeV2TrendMetricLabel('net-sales', trendMetricContext, t)}
              formatSparklineValue={formatSparklineForMetric('net-sales')}
            />
          )
        case 'net-profit':
          return (
            <HomeV2KpiSparklineCard
              dragHandle={dragHandle}
              {...sparklineControl}
              label={t(profitLabelKey(salesMetricBasis))}
              helpText={t(profitHelpKey(salesMetricBasis))}
              value={formatCardAmount(profitCurrent)}
              numericValue={profitCurrent}
              currencyCode={effectiveDisplayCurrency}
              pct={profitDelta!.pct}
              trend={profitDelta!.trend}
              comparisonUnavailable={profitDelta!.unavailable}
              deltaTooltip={kpiDeltaTooltip}
              sparklinePoints={buildSparklinePoints('net-profit')}
              sparklineMetricLabel={homeV2TrendMetricLabel('net-profit', trendMetricContext, t)}
              formatSparklineValue={formatSparklineForMetric('net-profit')}
            />
          )
        case 'roas': {
          const roasValue = adsKpi?.roas
          return (
            <HomeV2KpiSparklineCard
              dragHandle={dragHandle}
              {...sparklineControl}
              label={t('homeKpiRoasGlobal')}
              helpText={t('homeKpiRoasGlobalHelp')}
              value={roasValue == null ? '—' : roasValue.toFixed(2)}
              placeholder={roasValue == null}
              placeholderLabel={roasValue == null ? '—' : undefined}
              pct={null}
              trend="flat"
              comparisonUnavailable
              sparklineValues={[]}
            />
          )
        }
        case 'contribution':
          return (
            <HomeV2KpiSparklineCard
              dragHandle={dragHandle}
              {...sparklineControl}
              label={t('reportsContributionMargin')}
              helpText={t('reportsKpiHelpContributionMargin')}
              value={formatCardAmount(contributionCurrent)}
              numericValue={contributionCurrent}
              currencyCode={effectiveDisplayCurrency}
              pct={contributionDelta!.pct}
              trend={contributionDelta!.trend}
              comparisonUnavailable={contributionDelta!.unavailable}
              deltaTooltip={kpiDeltaTooltip}
              sparklinePoints={buildSparklinePoints('contribution')}
              sparklineMetricLabel={homeV2TrendMetricLabel('contribution', trendMetricContext, t)}
              formatSparklineValue={formatSparklineForMetric('contribution')}
            />
          )
        case 'ebitda':
          return (
            <HomeV2KpiSparklineCard
              dragHandle={dragHandle}
              {...sparklineControl}
              label={t('reportsEbitda')}
              helpText={t('reportsKpiHelpEbitda')}
              value={productMode ? '—' : formatCardAmount(ebitdaCurrent ?? 0)}
              numericValue={productMode ? null : (ebitdaCurrent ?? 0)}
              currencyCode={productMode ? undefined : effectiveDisplayCurrency}
              placeholder={productMode}
              placeholderLabel="—"
              pct={productMode ? null : ebitdaDelta!.pct}
              trend={productMode ? 'flat' : ebitdaDelta!.trend}
              comparisonUnavailable={productMode ? true : ebitdaDelta!.unavailable}
              deltaTooltip={kpiDeltaTooltip}
              sparklinePoints={productMode ? [] : buildSparklinePoints('ebitda')}
              sparklineMetricLabel={homeV2TrendMetricLabel('ebitda', trendMetricContext, t)}
              formatSparklineValue={formatSparklineForMetric('ebitda')}
            />
          )
        case 'units':
          return (
            <HomeV2KpiSparklineCard
              dragHandle={dragHandle}
              {...sparklineControl}
              label={t('reportsUnits')}
              helpText={t('reportsKpiHelpUnits')}
              value={unitsCurrent.toLocaleString()}
              numericValue={unitsCurrent}
              pct={unitsDelta!.pct}
              trend={unitsDelta!.trend}
              comparisonUnavailable={unitsDelta!.unavailable}
              deltaTooltip={kpiDeltaTooltip}
              sparklinePoints={buildSparklinePoints('units')}
              sparklineMetricLabel={homeV2TrendMetricLabel('units', trendMetricContext, t)}
              formatSparklineValue={formatSparklineForMetric('units')}
            />
          )
        case 'orders':
          return (
            <HomeV2KpiSparklineCard
              dragHandle={dragHandle}
              {...sparklineControl}
              label={t('reportsOrders')}
              helpText={t('reportsKpiHelpOrders')}
              value={orders.toLocaleString()}
              pct={ordersDelta!.pct}
              trend={ordersDelta!.trend}
              comparisonUnavailable={ordersDelta!.unavailable}
              deltaTooltip={kpiDeltaTooltip}
              sparklinePoints={buildSparklinePoints('orders')}
              sparklineMetricLabel={homeV2TrendMetricLabel('orders', trendMetricContext, t)}
              formatSparklineValue={formatSparklineForMetric('orders')}
            />
          )
        case 'aov':
          return (
            <HomeV2KpiSparklineCard
              dragHandle={dragHandle}
              {...sparklineControl}
              label={t('reportsKpiAov')}
              helpText={t('reportsKpiHelpAov')}
              value={aov === null ? '—' : formatCardAmount(aov)}
              numericValue={aov}
              currencyCode={aov === null ? undefined : effectiveDisplayCurrency}
              placeholder={aov === null}
              placeholderLabel="—"
              pct={aovDelta?.pct ?? null}
              trend={aovDelta?.trend ?? 'flat'}
              comparisonUnavailable={aovDelta?.unavailable ?? true}
              deltaTooltip={kpiDeltaTooltip}
              sparklineValues={[]}
            />
          )
        default:
          return null
      }
    },
    [
      t,
      salesMetricBasis,
      formatCardAmount,
      salesCurrent,
      effectiveDisplayCurrency,
      salesDelta,
      kpiDeltaTooltip,
      buildSparklinePoints,
      formatSparklineForMetric,
      trendMetricContext,
      profitCurrent,
      profitDelta,
      contributionCurrent,
      contributionDelta,
      productMode,
      ebitdaCurrent,
      ebitdaDelta,
      unitsCurrent,
      unitsDelta,
      orders,
      ordersDelta,
      aov,
      aovDelta,
      sparklineOpenById,
      adsKpi?.roas,
    ],
  )

  const showSalesTrend = canSalesHome
  const showAnalysis =
    (canChannelHome && activeConnectionIds.length > 0) || canSalesHome
  const showAdsEmpty =
    canAdsHome && !productMode && !adsScope.hasAdsConnections && !connectorsLoading
  const showRoleEmpty = !hasAnyHomeWidget

  return (
    <DashboardPage className={cn('flex flex-1 flex-col', hasNoIntegrations ? 'gap-0' : 'gap-4')}>
      {!hasNoIntegrations ? (
        <header className="flex flex-col gap-4">
          <div className="min-w-0">
            <h1 className={pageTitleClassName}>
              {t('navHome')}
            </h1>
          </div>
          {canSalesHome || canChannelHome || canAdsHome ? (
            <div className="flex w-full flex-wrap items-center gap-2">
              <FilterDates
                strings={pickerStrings}
                startValue={startDate}
                endValue={endDate}
                onStartChange={(v) => v && setFilters({ startDate: v })}
                onEndChange={(v) => v && setFilters({ endDate: v })}
              />
              {canSalesHome || canChannelHome ? (
                <FilterComboboxMulti
                  label={t('homeFilterChannels')}
                  options={channelOptions}
                  values={connectionIds}
                  onValuesChange={(next) => setFilters({ connectionIds: next })}
                  searchPlaceholder={t('homeFilterChannelsSearch')}
                  emptyLabel={t('homeFilterChannelsEmpty')}
                  clearAriaLabel={t('filterClear')}
                  selectAllLabel={t('homeFilterSelectAll')}
                  deselectAllLabel={t('homeFilterDeselectAll')}
                />
              ) : null}
              {canSalesHome ? (
                <HomeProductFilter
                  values={productIds}
                  onValuesChange={(next) => setFilters({ productIds: next })}
                  label={t('homeFilterProduct')}
                  searchPlaceholder={t('homeFilterProductSearch')}
                  emptyLabel={t('homeFilterProductEmpty')}
                  loadingLabel={t('homeFilterProductLoading')}
                  selectAllLabel={t('homeFilterSelectAll')}
                  deselectAllLabel={t('homeFilterDeselectAll')}
                  selectAllContainingLabel={t('homeFilterSelectAllContaining')}
                  deselectAllContainingLabel={t('homeFilterDeselectAllContaining')}
                  allContainingSummaryLabel={t('homeFilterAllContainingSummary')}
                  selectAllClearsFilter
                />
              ) : null}
            </div>
          ) : null}
          {canAlertsHome ? (
            <HomeMatchSuggestionAlerts
              matchCount={matchSuggestionCount}
              onReview={() => openSheet({ kind: 'match_suggestion' })}
              t={t}
            />
          ) : null}
        </header>
      ) : null}

      {hasNoIntegrations ? (
        <HomeNoIntegrationsState lang={lang} />
      ) : isInitialLoad ? (
        <HomeV2LoadingSkeleton />
      ) : showRoleEmpty ? (
        <EmptyState
          icon="home"
          title={t('homeRoleEmptyTitle')}
          description={t('homeRoleEmptyDescription')}
        />
      ) : (
        <>
          {showKpiCards ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SalesMetricBasisToggle
                  basis={salesMetricBasis}
                  onBasisChange={setSalesMetricBasis}
                  t={t}
                />
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger
                      type="button"
                      className={cn(
                        chromeIconButtonClassName,
                        'cursor-pointer hover:bg-[var(--sidebar-accent)]',
                      )}
                      onClick={toggleAllSparklines}
                      aria-expanded={allSparklinesOpen}
                      aria-label={
                        allSparklinesOpen
                          ? t('homeKpiSparklineCollapseAll')
                          : t('homeKpiSparklineExpandAll')
                      }
                    >
                      {allSparklinesOpen ? (
                        <ChevronsUp className="size-4" aria-hidden />
                      ) : (
                        <ChevronsDown className="size-4" aria-hidden />
                      )}
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {allSparklinesOpen
                        ? t('homeKpiSparklineCollapseAll')
                        : t('homeKpiSparklineExpandAll')}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <button
                          type="button"
                          className={cn(
                            chromeIconButtonClassName,
                            'cursor-pointer hover:bg-[var(--sidebar-accent)] disabled:cursor-not-allowed disabled:opacity-60',
                          )}
                          onClick={restoreDefaultKpiOrder}
                          disabled={isDefaultKpiOrder}
                          aria-label={t('homeKpiRestoreDefaultOrder')}
                        >
                          <ListRestart className="size-4" aria-hidden />
                        </button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t('homeKpiRestoreDefaultOrder')}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <HomeV2KpiSortableGrid
                order={kpiLayout.order}
                onOrderChange={(order) => setKpiLayout({ order })}
                dragHandleAriaLabel={t('homeKpiDragHandleAria')}
                renderCard={renderKpiCard}
              />
            </div>
          ) : null}

          {showSalesTrend ? (
          <SectionContainer framed className="mt-6 mb-8">
            <ChartSectionHeader
              title={t('homeMetricsTrendTitle')}
              info={t('homeMetricsTrendSubtitle')}
              className="mb-5"
              aside={
                <>
                  <HomeV2SalesTrendMetricFilters
                    primaryMetric={effectiveSalesTrendPrimaryMetric}
                    secondaryMetric={effectiveSalesTrendSecondaryMetric}
                    onPrimaryMetricChange={setSalesTrendPrimaryMetric}
                    onSecondaryMetricChange={setSalesTrendSecondaryMetric}
                    metricContext={trendMetricContext}
                    t={t}
                  />
                  <ChartGranularityFilter
                    value={salesTrendGranularity}
                    onChange={setSalesTrendGranularity}
                    t={t}
                  />
                  <AppSeriesChartViewToggle
                    value={salesTrendChartType}
                    onChange={setSalesTrendChartType}
                    t={t}
                  />
                </>
              }
            />
            {salesTrendError ? (
              <p className="text-sm text-destructive">{t('reportsMonthlyLoadError')}</p>
            ) : (
              <HomeV2SalesTrendChart
                startDate={startDate}
                endDate={endDate}
                granularity={salesTrendGranularity}
                rows={salesTrendSeries?.months ?? []}
                currency={effectiveDisplayCurrency}
                formatValue={formatInDisplay}
                dateLocale={dateLocale}
                primaryMetric={effectiveSalesTrendPrimaryMetric}
                secondaryMetric={effectiveSalesTrendSecondaryMetric}
                metricContext={trendMetricContext}
                adsSeriesPoints={adsSeriesError ? [] : (adsSeries?.points ?? [])}
                chartType={salesTrendChartType}
                t={t}
              />
            )}
          </SectionContainer>
          ) : null}

          {showAnalysis ? (
          <PageSection heading={t('homeAnalysisSectionTitle')}>
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
              {canChannelHome ? (
              <div className="flex min-h-0 min-w-0 lg:h-full">
                <SectionContainer framed className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
                  <HomeChannelShareSection
                    title={t('homeChannelDonutTitle')}
                    info={t('homeChannelDonutSubtitle')}
                    rows={channelBreakdown?.items ?? []}
                    convertValue={convertFromBase}
                    formatValue={formatInDisplay}
                    formatCompact={formatCompactInDisplay}
                    t={t}
                    minBodyHeightPx={pairedChartBodyPx}
                    isLoading={channelDonutPending}
                  />
                </SectionContainer>
              </div>
              ) : null}
              {canSalesHome ? (
              <div className="flex min-h-0 min-w-0 lg:h-full">
                <SectionContainer framed className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
                  <ChartSectionHeader
                    title={t('homeTopProductsTitle')}
                    info={t('homeTopProductsSubtitle').replace(
                      '{count}',
                      String(topProducts?.items.length ?? 10),
                    )}
                  />
                  <div className="min-h-0 min-w-0 flex-1">
                    <HomeTopProductsChart
                      rows={topProducts?.items ?? []}
                      convertValue={convertFromBase}
                      formatValue={formatInDisplay}
                      formatCompact={formatCompactInDisplay}
                      t={t}
                      isLoading={topProductsPending}
                    />
                  </div>
                </SectionContainer>
              </div>
              ) : null}
            </div>
          </PageSection>
          ) : null}

          {showAdsEmpty ? (
            <EmptyState
              icon="ads"
              title={t('homeAdsEmptyOnHomeTitle')}
              description={t('homeAdsEmptyOnHomeDescription')}
              action={
                <Link
                  to="/dashboard/integrations/ads"
                  className={buttonVariants({ variant: 'accent', size: 'tiny' })}
                >
                  {t('homeAdsEmptyOnHomeCta')}
                </Link>
              }
            />
          ) : null}

          {adsSeriesEnabled ? (
            <SectionContainer framed className="mt-6 overflow-visible">
              <ChartSectionHeader
                title={t('homeAdsTrendTitle')}
                info={t('homeAdsTrendSubtitle')}
                aside={
                  <>
                    <ChartGranularityFilter
                      value={adsTrendGranularity}
                      onChange={setAdsTrendGranularity}
                      t={t}
                    />
                    <AppSeriesChartViewToggle
                      value={adsTrendChartType}
                      onChange={setAdsTrendChartType}
                      t={t}
                    />
                  </>
                }
              />
              <AdsTrendChart
                points={adsSeriesError ? [] : (adsSeries?.points ?? [])}
                lang={lang}
                formatValue={formatInDisplay}
                startDate={startDate}
                endDate={endDate}
                granularity={adsTrendGranularity}
                dateLocale={dateLocale}
                isLoading={adsSeriesLoading}
                chartType={adsTrendChartType}
              />
            </SectionContainer>
          ) : null}

          {canSalesHome && settlementWaterfallSegments.length > 0 ? (
            <SectionContainer framed className="mt-6 mb-8 overflow-visible">
              <ChartSectionHeader
                title={t('reportsSectionSettlementTitle')}
                info={t('reportsSectionSettlementSubtitle')}
              />
              <WaterfallChart
                segments={settlementWaterfallSegments}
                currency={effectiveDisplayCurrency}
                grossRevenue={convertFromBase(settlementSource?.gross_revenue ?? 0)}
                formatPctOfGross={(pct) =>
                  t('reportsWaterfallPctOfGross').replace('{pct}', pct.toFixed(1))
                }
                finalBarCaption={t('reportsSettlementFinalHint')}
              />
            </SectionContainer>
          ) : null}
        </>
      )}
    </DashboardPage>
  )
}
