import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { differenceInCalendarDays } from 'date-fns'
import { enUS, es as esLocale } from 'date-fns/locale'

import { useCurrentTenant } from '@/auth/hooks'
import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { useMoney } from '@/hooks/use-money'
import { useSalesMetricBasis } from '@/hooks/use-sales-metric-basis'
import { apiFetch } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
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
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { HomeChannelDonutChart } from '@/pages/dashboard/home-channel-donut-chart'
import { HomeNoIntegrationsState } from '@/pages/dashboard/home-no-integrations-state'
import { HomeProductFilter } from '@/pages/dashboard/home-product-filter'
import { HomeTopProductsChart } from '@/pages/dashboard/home-top-products-chart'
import { getTopProductsChartHeightPx } from '@/pages/dashboard/home-top-products-chart-layout'
import {
  HOME_V2_KPI_DEFAULT_ORDER,
  HOME_V2_KPI_ORDER_KEY,
  HOME_V2_KPI_ORDER_VERSION,
  parseHomeV2KpiOrderState,
  type HomeV2KpiCardId,
  type HomeV2KpiOrderState,
} from '@/pages/dashboard/home-v2-kpi-card-order'
import { HomeV2KpiSortableGrid } from '@/pages/dashboard/home-v2-kpi-sortable-grid'
import { HomeV2KpiSparklineCard } from '@/pages/dashboard/home-v2-kpi-sparkline-card'
import { HomeV2SalesTrendChart } from '@/pages/dashboard/home-v2-sales-trend-chart'
import { mergeRevenueSeriesRows } from '@/pages/reports/monthly-revenue-chart'
import {
  computePreviousPeriod,
  parseLocalYmd,
  pctVersusPrevious,
} from '@/pages/reports/reports-ui-helpers'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'
import { useProductReports } from '@/pages/reports/use-product-reports'
import { useReports } from '@/pages/reports/use-reports'
import { useChannelBreakdown } from '@/pages/reports/use-channel-breakdown'
import { useTopProducts } from '@/pages/reports/use-top-products'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage, type Language } from '@/shell/providers/language-provider'
import { FilterComboboxMulti } from '@/ui/filters/filter-combobox-multi'
import { FilterDates } from '@/ui/filters/filter-dates'
import { presetDateRangeYmd } from '@/ui/date-range-picker'
import { Skeleton } from '@/ui/skeleton'
import { SalesMetricBasisToggle } from '@/ui/sales-metric-basis-toggle'
import { Button } from '@/ui/button'
import { cn } from '@/lib/utils'

type HomeV2FiltersState = {
  startDate: string
  endDate: string
  connectionIds: string[]
  productIds: string[]
  v: number
}

const FILTERS_VERSION = 1
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

function sparklineGranularity(startDate: string, endDate: string): RevenueSeriesGranularity {
  const lo = parseLocalYmd(startDate)
  const hi = parseLocalYmd(endDate)
  const days = differenceInCalendarDays(hi, lo) + 1
  if (days <= 45) return 'day'
  if (days <= 120) return 'week'
  return 'month'
}

function formatKpiAmount(amount: number, currency: string, lang: Language): string {
  const locale = lang === 'es' ? 'es-MX' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-[148px] flex-col rounded-md border border-border-default bg-white p-4"
            aria-hidden
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-7 w-32" />
            <Skeleton className="mt-auto h-14 w-full" />
          </div>
        ))}
      </div>
      <SectionContainer>
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="h-[280px] w-full rounded-md" />
      </SectionContainer>
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionContainer className="p-4 sm:p-5">
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="h-[288px] w-full rounded-md" />
        </SectionContainer>
        <SectionContainer className="p-4 sm:p-5">
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
  const t = useCallback(
    (k: Parameters<typeof shellT>[1]) => shellT(lang, k),
    [lang],
  )
  const [salesMetricBasis, setSalesMetricBasis] = useSalesMetricBasis()

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
    useState<RevenueSeriesGranularity>('month')

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
  const hasNoIntegrations =
    !connectorsLoading && connectionsQuery.isSuccess && connections.length === 0

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
  const sparkGranularity = useMemo(
    () => sparklineGranularity(startDate, endDate),
    [startDate, endDate],
  )

  const { data: kpi, isLoading: kpiLoading, isSuccess: kpiReady } = useReports({
    connectionIds: activeConnectionIds,
    startDate,
    endDate,
    enabled: !productMode,
  })
  const { data: kpiPrev, isLoading: kpiPrevLoading } = useReports({
    connectionIds: activeConnectionIds,
    startDate: prevPeriod?.start ?? '',
    endDate: prevPeriod?.end ?? '',
    enabled: !productMode && Boolean(prevPeriod) && kpiReady,
  })

  const { data: pkpi, isLoading: pkpiLoading, isSuccess: pkpiReady } = useProductReports({
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
    enabled: productMode && Boolean(prevPeriod) && pkpiReady,
  })

  const { data: sparklineSeries } = useMonthlyRevenueSeries({
    connectionIds: activeConnectionIds,
    productIds: productMode ? productIds : undefined,
    startDate,
    endDate,
    granularity: sparkGranularity,
    enabled: activeConnectionIds.length > 0,
  })

  const { data: salesTrendSeries, isError: salesTrendError } = useMonthlyRevenueSeries({
    connectionIds: activeConnectionIds,
    productIds: productMode ? productIds : undefined,
    startDate,
    endDate,
    granularity: salesTrendGranularity,
    enabled: activeConnectionIds.length > 0,
  })

  const { data: channelBreakdown, isPending: channelDonutPending } = useChannelBreakdown({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    enabled: activeConnectionIds.length > 0,
  })

  const { data: topProducts, isPending: topProductsPending } = useTopProducts({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    limit: 10,
    enabled: activeConnectionIds.length > 0,
  })

  const pairedChartBodyPx = useMemo(() => getTopProductsChartHeightPx(), [])

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

  const showKpiCards = Boolean(productMode ? displayProductKpi : displayKpi)
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
    (n: number) => formatKpiAmount(convertFromBase(n), effectiveDisplayCurrency, lang),
    [convertFromBase, effectiveDisplayCurrency, lang],
  )

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

  const netSalesSparkline = useMemo(
    () =>
      mergedSparkRows.map((row) =>
        convertFromBase(salesMetricBasis === 'net' ? row.net_revenue : row.gross_revenue),
      ),
    [mergedSparkRows, convertFromBase, salesMetricBasis],
  )
  const profitSparkline = useMemo(
    () =>
      mergedSparkRows.map((row) => convertFromBase(row.gross_profit * profitSparklineScale)),
    [mergedSparkRows, convertFromBase, profitSparklineScale],
  )
  const contributionSparkline = useMemo(
    () =>
      mergedSparkRows.map((row) => {
        if (productMode) return convertFromBase(row.gross_profit)
        return convertFromBase(row.gross_profit * contributionSparklineScale)
      }),
    [mergedSparkRows, convertFromBase, productMode, contributionSparklineScale],
  )

  const ebitdaSparklineScale = useMemo(() => {
    if (productMode || !displayKpi) return 1
    const gp = displayKpi.gross_profit
    return gp !== 0 ? displayKpi.ebitda / gp : 1
  }, [productMode, displayKpi])

  const ebitdaSparkline = useMemo(
    () =>
      mergedSparkRows.map((row) => convertFromBase(row.gross_profit * ebitdaSparklineScale)),
    [mergedSparkRows, convertFromBase, ebitdaSparklineScale],
  )

  const pickerStrings = {
    applyLabel: t('datePickerApply'),
    todayLabel: t('datePickerToday'),
    placeholder: t('datePickerPlaceholder'),
    presetLast7Days: t('datePickerLast7Days'),
    presetLast30Days: t('datePickerLast30Days'),
    presetLast6Months: t('datePickerLast6Months'),
    presetLastYearRolling: t('datePickerLastYearRolling'),
    presetCurrentYear: t('datePickerCurrentYear'),
    presetPreviousYear: t('datePickerPreviousYear'),
  }

  const isInitialLoad =
    connectorsLoading ||
    (productMode
      ? activeConnectionIds.length > 0 && pkpiLoading
      : displayKpi === null)

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

  const kpiDeltaTooltip = t('homeKpiDeltaTooltip')

  const renderKpiCard = useCallback(
    (id: HomeV2KpiCardId, dragHandle: ReactNode) => {
      switch (id) {
        case 'net-sales':
          return (
            <HomeV2KpiSparklineCard
              sparklineId="net-sales"
              dragHandle={dragHandle}
              label={t(salesLabelKey(salesMetricBasis))}
              helpText={t(homeSalesHelpKey(salesMetricBasis))}
              value={formatCardAmount(salesCurrent)}
              currencyCode={effectiveDisplayCurrency}
              pct={salesDelta!.pct}
              trend={salesDelta!.trend}
              comparisonUnavailable={salesDelta!.unavailable}
              deltaTooltip={kpiDeltaTooltip}
              sparklineValues={netSalesSparkline}
            />
          )
        case 'net-profit':
          return (
            <HomeV2KpiSparklineCard
              sparklineId="net-profit"
              dragHandle={dragHandle}
              label={t(profitLabelKey(salesMetricBasis))}
              helpText={t(profitHelpKey(salesMetricBasis))}
              value={formatCardAmount(profitCurrent)}
              currencyCode={effectiveDisplayCurrency}
              pct={profitDelta!.pct}
              trend={profitDelta!.trend}
              comparisonUnavailable={profitDelta!.unavailable}
              deltaTooltip={kpiDeltaTooltip}
              sparklineValues={profitSparkline}
            />
          )
        case 'roas':
          return (
            <HomeV2KpiSparklineCard
              sparklineId="roas"
              dragHandle={dragHandle}
              label={t('homeKpiRoasGlobal')}
              helpText={t('homeKpiRoasGlobalHelp')}
              value="—"
              placeholder
              placeholderLabel={t('comingSoonBadge')}
              pct={null}
              trend="flat"
              comparisonUnavailable
              sparklineValues={[]}
            />
          )
        case 'contribution':
          return (
            <HomeV2KpiSparklineCard
              sparklineId="contribution"
              dragHandle={dragHandle}
              label={t('reportsContributionMargin')}
              helpText={t('reportsKpiHelpContributionMargin')}
              value={formatCardAmount(contributionCurrent)}
              currencyCode={effectiveDisplayCurrency}
              pct={contributionDelta!.pct}
              trend={contributionDelta!.trend}
              comparisonUnavailable={contributionDelta!.unavailable}
              deltaTooltip={kpiDeltaTooltip}
              sparklineValues={contributionSparkline}
            />
          )
        case 'ebitda':
          return (
            <HomeV2KpiSparklineCard
              sparklineId="ebitda"
              dragHandle={dragHandle}
              label={t('reportsEbitda')}
              helpText={t('reportsKpiHelpEbitda')}
              value={productMode ? '—' : formatCardAmount(ebitdaCurrent ?? 0)}
              currencyCode={productMode ? undefined : effectiveDisplayCurrency}
              placeholder={productMode}
              placeholderLabel="—"
              pct={productMode ? null : ebitdaDelta!.pct}
              trend={productMode ? 'flat' : ebitdaDelta!.trend}
              comparisonUnavailable={productMode ? true : ebitdaDelta!.unavailable}
              deltaTooltip={kpiDeltaTooltip}
              sparklineValues={productMode ? [] : ebitdaSparkline}
            />
          )
        case 'units':
          return (
            <HomeV2KpiSparklineCard
              sparklineId="units"
              dragHandle={dragHandle}
              label={t('reportsUnits')}
              helpText={t('reportsKpiHelpUnits')}
              value={unitsCurrent.toLocaleString()}
              pct={unitsDelta!.pct}
              trend={unitsDelta!.trend}
              comparisonUnavailable={unitsDelta!.unavailable}
              deltaTooltip={kpiDeltaTooltip}
              sparklineValues={[]}
            />
          )
        case 'orders':
          return (
            <HomeV2KpiSparklineCard
              sparklineId="orders"
              dragHandle={dragHandle}
              label={t('reportsOrders')}
              helpText={t('reportsKpiHelpOrders')}
              value={orders.toLocaleString()}
              pct={ordersDelta!.pct}
              trend={ordersDelta!.trend}
              comparisonUnavailable={ordersDelta!.unavailable}
              deltaTooltip={kpiDeltaTooltip}
              sparklineValues={[]}
            />
          )
        case 'aov':
          return (
            <HomeV2KpiSparklineCard
              sparklineId="aov"
              dragHandle={dragHandle}
              label={t('reportsKpiAov')}
              helpText={t('reportsKpiHelpAov')}
              value={aov === null ? '—' : formatCardAmount(aov)}
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
      netSalesSparkline,
      profitCurrent,
      profitDelta,
      profitSparkline,
      contributionCurrent,
      contributionDelta,
      contributionSparkline,
      productMode,
      ebitdaCurrent,
      ebitdaDelta,
      ebitdaSparkline,
      unitsCurrent,
      unitsDelta,
      orders,
      ordersDelta,
      aov,
      aovDelta,
    ],
  )

  return (
    <DashboardPage className={cn('flex flex-1 flex-col', hasNoIntegrations ? 'gap-0' : 'gap-4')}>
      {!hasNoIntegrations ? (
        <header className="flex flex-col gap-4">
          <div className="min-w-0">
            <h1 className="text-title font-semibold tracking-[-0.02em] text-text-primary">
              {t('navHome')}
            </h1>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2">
            <FilterDates
              strings={pickerStrings}
              startValue={startDate}
              endValue={endDate}
              onStartChange={(v) => v && setFilters({ startDate: v })}
              onEndChange={(v) => v && setFilters({ endDate: v })}
            />
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
            />
          </div>
        </header>
      ) : null}

      {hasNoIntegrations ? (
        <HomeNoIntegrationsState lang={lang} />
      ) : isInitialLoad ? (
        <HomeV2LoadingSkeleton />
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 text-text-secondary"
                  onClick={restoreDefaultKpiOrder}
                  disabled={isDefaultKpiOrder}
                >
                  {t('homeKpiRestoreDefaultOrder')}
                </Button>
              </div>
              <HomeV2KpiSortableGrid
                order={kpiLayout.order}
                onOrderChange={(order) => setKpiLayout({ order })}
                dragHandleAriaLabel={t('homeKpiDragHandleAria')}
                renderCard={renderKpiCard}
              />
            </div>
          ) : null}

          <SectionContainer>
            <SectionHeader
              title={t('dashboardRevenueTrendTitle')}
              aside={
                <ChartGranularityFilter
                  value={salesTrendGranularity}
                  onChange={setSalesTrendGranularity}
                  t={t}
                />
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
                convertValue={convertFromBase}
                dateLocale={dateLocale}
                t={t}
              />
            )}
          </SectionContainer>

          <PageSection heading={t('homeAnalysisSectionTitle')}>
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
              <div className="flex min-h-0 min-w-0 lg:h-full">
                <SectionContainer className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
                  <SectionHeader
                    title={t('homeChannelDonutTitle')}
                    description={t('homeChannelDonutSubtitle')}
                  />
                  <HomeChannelDonutChart
                    rows={channelBreakdown?.items ?? []}
                    convertValue={convertFromBase}
                    formatValue={formatInDisplay}
                    t={t}
                    minBodyHeightPx={pairedChartBodyPx}
                    isLoading={channelDonutPending}
                  />
                </SectionContainer>
              </div>
              <div className="flex min-h-0 min-w-0 lg:h-full">
                <SectionContainer className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
                  <SectionHeader
                    title={t('homeTopProductsTitle')}
                    description={t('homeTopProductsSubtitle').replace(
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
            </div>
          </PageSection>
        </>
      )}
    </DashboardPage>
  )
}
