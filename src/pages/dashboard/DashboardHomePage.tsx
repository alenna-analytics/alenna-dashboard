import { useCallback, useMemo, useState } from 'react'

import { useAuth } from '@clerk/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { revenueTrendSubtitleForGranularity } from '@/pages/dashboard/revenue-trend-subtitle'
import { cn } from '@/lib/utils'
import { useModule } from '@/lib/modules/use-modules'
import { useSalesMetricBasis } from '@/hooks/use-sales-metric-basis'
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
import { KpiCard } from '@/ui/kpi-card'
import { SalesMetricBasisToggle } from '@/ui/sales-metric-basis-toggle'

import { DashboardChannelSalesChart } from './dashboard-channel-sales-chart'
import { DashboardProfitMarginChart } from './dashboard-profit-margin-chart'
import { DashboardRevenueTrendChart } from './dashboard-revenue-trend-chart'
import { HomeChannelDonutChart } from './home-channel-donut-chart'
import { HomeProductFilter } from './home-product-filter'
import { HomeTopProductsChart } from './home-top-products-chart'
import { getTopProductsChartHeightPx } from './home-top-products-chart-layout'
import { homeActiveAlertsKpiLabels } from './home-active-alerts-kpi-labels'
import { HomeActiveAlertsKpi } from './home-active-alerts-kpi'
import { HomeNoIntegrationsState } from './home-no-integrations-state'
import { invalidateAlertsQueries, useAlertsSummaryQuery } from './use-alerts-queries'
import { useAlertsSheet } from '@/shell/alerts/alerts-sheet-context'
import type { ReactNode } from 'react'
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
        <h2 className="text-xl font-semibold text-text-primary">{heading}</h2>
      ) : null}
      {children}
    </section>
  )
}

function DashboardHomeLoadingSkeleton() {
  return (
    <>
      <div className="overflow-hidden rounded-md border border-border-default" aria-hidden>
        <div className="flex divide-x divide-border-default">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-0 flex-1 p-4">
              <div className="flex flex-col gap-2">
                <div className="flex w-full min-w-0 items-start justify-between gap-2">
                  <Skeleton className="h-4 w-20 max-w-[65%]" />
                  <Skeleton className="size-4 shrink-0 rounded-full" />
                </div>
                <Skeleton className="h-7 w-28 max-w-full" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-5 w-10 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex divide-x divide-border-default border-t border-border-default">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="min-w-0 flex-1 p-3">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-20" />
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-9 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PageSection>
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <SectionContainer key={i} className="overflow-visible">
              <div className="mb-4 space-y-2" aria-hidden>
                <Skeleton className="h-6 w-48 max-w-[80%]" />
                <Skeleton className="h-4 w-full max-w-xl" />
              </div>
              <Skeleton className="h-64 w-full rounded-md" />
            </SectionContainer>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <Skeleton className="h-5 w-28" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <SectionContainer key={i} className="overflow-visible">
              <div className="mb-4 space-y-2" aria-hidden>
                <Skeleton className="h-6 w-56 max-w-[85%]" />
                <Skeleton className="h-4 w-full max-w-2xl" />
              </div>
              <Skeleton className="h-80 w-full rounded-md" />
            </SectionContainer>
          ))}
        </div>
      </PageSection>
    </>
  )
}

export function DashboardHomePage() {
  const { lang } = useLanguage()
  const dateLocale = lang === 'en' ? enUS : esLocale
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()
  const { openSheet } = useAlertsSheet()
  const t = useCallback(
    (k: Parameters<typeof shellT>[1]) => shellT(lang, k),
    [lang],
  )
  const adsModule = useModule('ads')
  const [salesMetricBasis, setSalesMetricBasis] = useSalesMetricBasis()

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

  const productMode = productIds.length > 0

  const alertsSummaryQuery = useAlertsSummaryQuery()
  const alertsSummary = alertsSummaryQuery.data
  const inventoryAlertLowCount = alertsSummary?.low_count ?? 0
  const inventoryAlertOutCount = alertsSummary?.critical_count ?? 0

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

  const [revenueTrendGranularity, setRevenueTrendGranularity] =
    useState<RevenueSeriesGranularity>('month')
  const [channelSalesGranularity, setChannelSalesGranularity] =
    useState<RevenueSeriesGranularity>('month')
  const [profitMarginGranularity, setProfitMarginGranularity] =
    useState<RevenueSeriesGranularity>('month')

  const revenuePrevPeriod = useMemo(() => {
    if (revenueTrendGranularity === 'month') return computePreviousPeriod(startDate, endDate)
    return computeShiftedPreviousPeriod(startDate, endDate)
  }, [startDate, endDate, revenueTrendGranularity])

  const revenueTrendSubtitle = useMemo(
    () => revenueTrendSubtitleForGranularity(revenueTrendGranularity, t),
    [revenueTrendGranularity, t],
  )

  // Order-level KPIs (no product selected)
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

  // Product-scoped KPIs (single product selected)
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

  const {
    data: monthlyCurrent,
    isError: monthlyRevenueError,
    isSuccess: monthlyCurrentReady,
  } = useMonthlyRevenueSeries({
    connectionIds: activeConnectionIds,
    productIds: productMode ? productIds : undefined,
    startDate,
    endDate,
    granularity: revenueTrendGranularity,
    enabled: activeConnectionIds.length > 0,
  })

  const { data: monthlyPrev } = useMonthlyRevenueSeries({
    connectionIds: activeConnectionIds,
    productIds: productMode ? productIds : undefined,
    startDate: revenuePrevPeriod?.start ?? '',
    endDate: revenuePrevPeriod?.end ?? '',
    granularity: revenueTrendGranularity,
    enabled:
      activeConnectionIds.length > 0 && Boolean(revenuePrevPeriod) && monthlyCurrentReady,
  })

  const { data: channelBreakdown, isPending: channelDonutPending } = useChannelBreakdown({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    enabled: activeConnectionIds.length > 0,
  })

  const {
    data: channelSalesTimeSeries,
    isError: channelSalesTimeSeriesError,
  } = useChannelTimeSeries({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    granularity: channelSalesGranularity,
    enabled: activeConnectionIds.length > 0,
  })

  const {
    data: profitMarginTimeSeries,
    isError: profitMarginTimeSeriesError,
  } = useChannelTimeSeries({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    granularity: profitMarginGranularity,
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

  const orders = productMode
    ? (displayProductKpi?.order_count ?? 0)
    : (displayKpi?.order_count ?? 0)
  const salesCurrent = productMode
    ? productKpiSales(displayProductKpi ?? zeroProductKpi(currency), salesMetricBasis)
    : orderKpiSales(displayKpi ?? zeroKpiResponse(currency), salesMetricBasis)
  const profitCurrent = productMode
    ? productKpiProfit(displayProductKpi ?? zeroProductKpi(currency), salesMetricBasis)
    : orderKpiProfit(displayKpi ?? zeroKpiResponse(currency), salesMetricBasis)
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
  const aov =
    orders > 0
      ? salesCurrent / orders
      : null

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

  const salesDelta = showKpiCards
    ? deltaBlock(salesCurrent, salesPriorValue, 'currency')
    : null
  const profitDelta = showKpiCards
    ? deltaBlock(profitCurrent, profitPriorValue, 'currency')
    : null
  const ebitda =
    !productMode && displayKpi
      ? deltaBlock(displayKpi.ebitda, kpiPrev?.ebitda, 'currency')
      : null
  const unitsSold = showKpiCards
    ? deltaBlock(
        productMode
          ? (displayProductKpi?.units_sold ?? 0)
          : (displayKpi?.units_sold ?? 0),
        productMode ? pkpiPrev?.units_sold : kpiPrev?.units_sold,
        'count',
      )
    : null
  const cmPct = showKpiCards
    ? deltaBlock(
        productMode
          ? (displayProductKpi?.gross_margin_pct ?? 0)
          : (displayKpi?.contribution_margin_pct ?? 0),
        productMode
          ? pkpiPrev?.gross_margin_pct
          : kpiPrev?.contribution_margin_pct,
        'percent',
      )
    : null
  const ord = showKpiCards
    ? deltaBlock(
        productMode ? (displayProductKpi?.order_count ?? 0) : (displayKpi?.order_count ?? 0),
        productMode ? pkpiPrev?.order_count : kpiPrev?.order_count,
        'count',
      )
    : null
  const aovCur = aov ?? 0
  const aovPrev = productMode
    ? pkpiPrev && (pkpiPrev.order_count ?? 0) > 0
      ? productKpiSales(pkpiPrev, salesMetricBasis) / pkpiPrev.order_count
      : undefined
    : kpiPrev && kpiPrev.order_count > 0
      ? orderKpiSales(kpiPrev, salesMetricBasis) / kpiPrev.order_count
      : undefined
  const aovDelta = showKpiCards && aov !== null ? deltaBlock(aovCur, aovPrev, 'currency') : null

  const waterfallSegments = useMemo(() => {
    if (!displayKpi || productMode) return []
    const segs = buildWaterfallSegments(displayKpi, t)
    return segs.map((s) => ({
      ...s,
      value: convertFromBase(s.value),
      stackedParts: s.stackedParts?.map((p) => ({
        ...p,
        value: convertFromBase(p.value),
      })),
    }))
  }, [displayKpi, productMode, t, convertFromBase])

  const pairedChartBodyPx = useMemo(() => getTopProductsChartHeightPx(), [])

  const revenueComparePrevious = Boolean(revenuePrevPeriod && monthlyPrev)

  const showTopProducts = true

  const isInitialLoad =
    connectorsLoading ||
    (productMode
      ? activeConnectionIds.length > 0 && pkpiLoading
      : displayKpi === null)

  return (
    <DashboardPage className={cn('flex flex-1 flex-col', hasNoIntegrations ? 'gap-0' : 'gap-4')}>
      {!hasNoIntegrations ? (
        <header className="flex flex-col gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
              {t('navHome')}
            </h1>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2">
            <div className="min-w-60">
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
        <DashboardHomeLoadingSkeleton />
      ) : (
        <>
          {showKpiCards ? (
            <div className="flex flex-col gap-2">
              <SalesMetricBasisToggle
                basis={salesMetricBasis}
                onBasisChange={setSalesMetricBasis}
                t={t}
              />
              <section className="overflow-hidden rounded-md border border-border-default bg-bg-card-strong">
              <div className="flex divide-x divide-border-default">
                <div className="min-w-0 flex-1 p-4">
                  <KpiCard
                    bare
                    label={t(salesLabelKey(salesMetricBasis))}
                    helpText={t(homeSalesHelpKey(salesMetricBasis))}
                    value={formatMoney(salesCurrent, { nativeCurrency: currency })}
                    vsPriorLabel={vsPrior}
                    priorValueDisplay={salesDelta!.priorDisplay}
                    pct={salesDelta!.pct}
                    trend={salesDelta!.trend}
                    comparisonUnavailable={salesDelta!.unavailable}
                  />
                </div>
                {adsModule?.enabled ? (
                  <div className="min-w-0 flex-1 p-4">
                    <KpiCard
                      bare
                      label={t('homeKpiRoasGlobal')}
                      helpText={t('homeKpiRoasGlobalHelp')}
                      value="—"
                      placeholder
                      placeholderLabel={t('comingSoonBadge')}
                      vsPriorLabel={vsPrior}
                      priorValueDisplay={null}
                      pct={null}
                      trend="flat"
                      comparisonUnavailable
                      showComparison={false}
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1 p-4">
                  <KpiCard
                    bare
                    label={t('homeKpiContributionMarginPct')}
                    helpText={t('homeKpiContributionMarginPctHelp')}
                    value={`${(productMode
                      ? (displayProductKpi?.gross_margin_pct ?? 0)
                      : (displayKpi?.contribution_margin_pct ?? 0)
                    ).toFixed(1)}%`}
                    vsPriorLabel={vsPrior}
                    priorValueDisplay={cmPct!.priorDisplay}
                    pct={cmPct!.pct}
                    trend={cmPct!.trend}
                    comparisonUnavailable={cmPct!.unavailable}
                    negativeMetric
                  />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <HomeActiveAlertsKpi
                    bare
                    lowCount={inventoryAlertLowCount}
                    outCount={inventoryAlertOutCount}
                    onClick={() => {
                      invalidateAlertsQueries(queryClient, tenantId)
                      openSheet()
                    }}
                    {...homeActiveAlertsKpiLabels(t, vsPrior)}
                  />
                </div>
              </div>
              <div className="flex divide-x divide-border-default border-t border-border-default">
                <div className="min-w-0 flex-1 p-3">
                  <KpiCard
                    bare
                    compact
                    label={t(profitLabelKey(salesMetricBasis))}
                    helpText={t(profitHelpKey(salesMetricBasis))}
                    value={formatMoney(profitCurrent, { nativeCurrency: currency })}
                    vsPriorLabel={vsPrior}
                    priorValueDisplay={profitDelta!.priorDisplay}
                    pct={profitDelta!.pct}
                    trend={profitDelta!.trend}
                    comparisonUnavailable={profitDelta!.unavailable}
                  />
                </div>
                <div className="min-w-0 flex-1 p-3">
                  <KpiCard
                    bare
                    compact
                    label={t('reportsEbitda')}
                    helpText={t('reportsKpiHelpEbitda')}
                    value={
                      productMode
                        ? '—'
                        : formatMoney(displayKpi?.ebitda ?? 0, { nativeCurrency: currency })
                    }
                    vsPriorLabel={vsPrior}
                    priorValueDisplay={productMode ? null : ebitda!.priorDisplay}
                    pct={productMode ? null : ebitda!.pct}
                    trend={productMode ? 'flat' : ebitda!.trend}
                    comparisonUnavailable={productMode ? true : ebitda!.unavailable}
                    showComparison={!productMode}
                  />
                </div>
                <div className="min-w-0 flex-1 p-3">
                  <KpiCard
                    bare
                    compact
                    label={t('reportsUnits')}
                    helpText={t('reportsKpiHelpUnits')}
                    value={(productMode
                      ? (displayProductKpi?.units_sold ?? 0)
                      : (displayKpi?.units_sold ?? 0)
                    ).toLocaleString()}
                    vsPriorLabel={vsPrior}
                    priorValueDisplay={unitsSold!.priorDisplay}
                    pct={unitsSold!.pct}
                    trend={unitsSold!.trend}
                    comparisonUnavailable={unitsSold!.unavailable}
                  />
                </div>
                <div className="min-w-0 flex-1 p-3">
                  <KpiCard
                    bare
                    compact
                    label={t('reportsOrders')}
                    helpText={t('reportsKpiHelpOrders')}
                    value={orders.toLocaleString()}
                    vsPriorLabel={vsPrior}
                    priorValueDisplay={ord!.priorDisplay}
                    pct={ord!.pct}
                    trend={ord!.trend}
                    comparisonUnavailable={ord!.unavailable}
                    showComparison={orders > 0}
                  />
                </div>
                <div className="min-w-0 flex-1 p-3">
                  <KpiCard
                    bare
                    compact
                    label={t('reportsKpiAov')}
                    helpText={t('reportsKpiHelpAov')}
                    value={
                      aov === null ? '—' : formatMoney(aov, { nativeCurrency: currency })
                    }
                    vsPriorLabel={vsPrior}
                    priorValueDisplay={aovDelta?.priorDisplay ?? null}
                    pct={aovDelta?.pct ?? null}
                    trend={aovDelta?.trend ?? 'flat'}
                    comparisonUnavailable={aovDelta?.unavailable ?? true}
                    showComparison={orders > 0 && aov !== null}
                  />
                </div>
              </div>
            </section>
            </div>
          ) : null}

          <PageSection heading={t('homeAnalysisSectionTitle')}>
            <div
              className={
                showTopProducts
                  ? 'grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch'
                  : 'grid min-w-0 grid-cols-1 gap-4'
              }
            >
              <div className={showTopProducts ? 'flex min-h-0 min-w-0 lg:h-full' : 'min-w-0'}>
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
                    minBodyHeightPx={showTopProducts ? pairedChartBodyPx : undefined}
                    isLoading={channelDonutPending}
                  />
                </SectionContainer>
              </div>
              {showTopProducts ? (
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
              ) : null}
            </div>
          </PageSection>

          <PageSection
            heading={t('homeTrendsSectionTitle')}
            className="gap-4"
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SectionContainer className="overflow-visible">
                <SectionHeader
                  title={t('dashboardRevenueTrendTitle')}
                  description={revenueTrendSubtitle}
                  aside={
                    <ChartGranularityFilter
                      value={revenueTrendGranularity}
                      onChange={setRevenueTrendGranularity}
                      t={t}
                    />
                  }
                />
                {monthlyRevenueError ? (
                  <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
                    {t('reportsMonthlyLoadError')}
                  </p>
                ) : (
                  <DashboardRevenueTrendChart
                    startDate={startDate}
                    endDate={endDate}
                    prevStart={revenuePrevPeriod?.start ?? ''}
                    prevEnd={revenuePrevPeriod?.end ?? ''}
                    granularity={revenueTrendGranularity}
                    rowsCurrent={monthlyCurrent?.months ?? []}
                    rowsPrev={monthlyPrev?.months ?? []}
                    comparePrevious={revenueComparePrevious}
                    currency={effectiveDisplayCurrency}
                    formatValue={formatInDisplay}
                    convertValue={convertFromBase}
                    dateLocale={dateLocale}
                    t={t}
                  />
                )}
              </SectionContainer>
              <SectionContainer className="overflow-visible">
                <SectionHeader
                  title={t('dashboardChannelSalesTitle')}
                  description={t('dashboardChannelSalesSubtitle')}
                  aside={
                    <ChartGranularityFilter
                      value={channelSalesGranularity}
                      onChange={setChannelSalesGranularity}
                      t={t}
                    />
                  }
                />
                {channelSalesTimeSeriesError ? (
                  <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
                    {t('reportsMonthlyLoadError')}
                  </p>
                ) : (
                  <DashboardChannelSalesChart
                    startDate={startDate}
                    endDate={endDate}
                    granularity={channelSalesGranularity}
                    rows={channelSalesTimeSeries?.rows ?? []}
                    currency={effectiveDisplayCurrency}
                    convertValue={convertFromBase}
                    formatValue={formatInDisplay}
                    dateLocale={dateLocale}
                    t={t}
                  />
                )}
              </SectionContainer>
              <SectionContainer className="overflow-visible">
                <SectionHeader
                  title={t('dashboardProfitMarginTitle')}
                  description={t('dashboardProfitMarginSubtitle')}
                  aside={
                    <ChartGranularityFilter
                      value={profitMarginGranularity}
                      onChange={setProfitMarginGranularity}
                      t={t}
                    />
                  }
                />
                {profitMarginTimeSeriesError ? (
                  <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
                    {t('reportsMonthlyLoadError')}
                  </p>
                ) : (
                  <DashboardProfitMarginChart
                    startDate={startDate}
                    endDate={endDate}
                    granularity={profitMarginGranularity}
                    rows={profitMarginTimeSeries?.rows ?? []}
                    currency={effectiveDisplayCurrency}
                    convertValue={convertFromBase}
                    formatValue={formatInDisplay}
                    dateLocale={dateLocale}
                    t={t}
                  />
                )}
              </SectionContainer>
              {!productMode && displayKpi ? (
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
              ) : null}
            </div>
          </PageSection>
        </>
      )}
    </DashboardPage>
  )
}
