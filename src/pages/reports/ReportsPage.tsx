import { useCallback, useMemo, useState } from 'react'

import { AlertTriangle, Package, type LucideIcon } from 'lucide-react'

import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { enUS, es as esLocale } from 'date-fns/locale'

import { useCurrentTenant } from '@/auth/hooks'
import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { useMoney } from '@/hooks/use-money'
import { apiFetch } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
import type { PlatformConnection } from '@/lib/types/connectors'
import type { KpiResponse, RevenueSeriesGranularity } from '@/lib/types/reports'
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { DashboardProfitMarginChart } from '@/pages/dashboard/dashboard-profit-margin-chart'
import { HomeNoIntegrationsState } from '@/pages/dashboard/home-no-integrations-state'
import { HomeProductFilter } from '@/pages/dashboard/home-product-filter'
import { buildBenchmarkRows } from '@/pages/reports/reports-benchmarks'
import { ReportsBenchmarksTable } from '@/pages/reports/reports-benchmarks-table'
import { ReportsHeroKpis } from '@/pages/reports/reports-hero-kpis'
import { buildProductPnlRows, buildTenantPnlRows } from '@/pages/reports/reports-pnl-rows'
import { ReportsPnlTable } from '@/pages/reports/reports-pnl-table'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import {
  computeCalendarMomPeriod,
  computeShiftedPreviousPeriod,
  computeYoyPeriod,
  pctVersusPrevious,
} from '@/pages/reports/reports-ui-helpers'
import { buildWaterfallSegments } from '@/pages/reports/waterfall-segments'
import { buildSettlementWaterfallSegments } from '@/pages/reports/settlement-waterfall-segments'
import { WaterfallChart } from '@/pages/reports/waterfall-chart'
import { zeroSettlementBreakdown } from '@/lib/settlement-utils'
import { useChannelTimeSeries } from '@/pages/reports/use-channel-time-series'
import { useProductReports } from '@/pages/reports/use-product-reports'
import { useReports } from '@/pages/reports/use-reports'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { includesAmazonWithUnavailableFees } from '@/lib/integrations/amazon-fees-notice'
import { FilterComboboxMulti } from '@/ui/filters/filter-combobox-multi'
import { FilterDates } from '@/ui/filters/filter-dates'
import { presetDateRangeYmd } from '@/ui/date-range-picker'
import { ContextAlertCard, ContextAlertsGroup, type ContextAlertTone } from '@/ui/context-alert'
import { Skeleton } from '@/ui/skeleton'
import { cn } from '@/lib/utils'

type ReportsFiltersState = {
  startDate: string
  endDate: string
  connectionIds: string[]
  productIds: string[]
  v: number
}

const FILTERS_VERSION = 1
const FILTERS_KEY = 'alenna.reports.page.filters.v1'

function parseReportsFilters(raw: unknown): ReportsFiltersState | null {
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

function platformDisplayName(platform: string): string {
  const trimmed = platform.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function ReportsLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-md" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-md" />
      <div className="flex flex-col gap-12">
        {Array.from({ length: 2 }).map((_, i) => (
          <SectionContainer key={i}>
            <div className="mb-4 space-y-2" aria-hidden>
              <Skeleton className="h-6 w-48 max-w-[80%]" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </div>
            <Skeleton className="h-80 w-full rounded-md" />
          </SectionContainer>
        ))}
      </div>
    </div>
  )
}

export function ReportsPage() {
  const { lang } = useLanguage()
  const dateLocale = lang === 'en' ? enUS : esLocale
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const t = useCallback(
    (k: Parameters<typeof shellT>[1]) => shellT(lang, k),
    [lang],
  )

  const defaultFilters = useMemo((): ReportsFiltersState => {
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
    parseReportsFilters,
  )

  const { startDate, endDate, connectionIds, productIds } = filters
  const productMode = productIds.length > 0
  const [profitMarginGranularity, setProfitMarginGranularity] =
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
  const activeConnections = useMemo(
    () =>
      connections.filter(
        (c) => c.status === 'active' && c.connection_status === 'active',
      ),
    [connections],
  )
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

  const queriesEnabled = activeConnectionIds.length > 0
  const showAmazonFeesNotice = includesAmazonWithUnavailableFees(
    activeConnections,
    activeConnectionIds,
  )
  const prevPeriod = useMemo(
    () => computeShiftedPreviousPeriod(startDate, endDate),
    [startDate, endDate],
  )
  const momPeriod = useMemo(() => computeCalendarMomPeriod(endDate), [endDate])
  const yoyPeriod = useMemo(
    () => computeYoyPeriod(startDate, endDate),
    [startDate, endDate],
  )

  const {
    data: kpi,
    isLoading: kpiLoading,
    isSuccess: kpiReady,
  } = useReports({
    connectionIds: activeConnectionIds,
    startDate,
    endDate,
    enabled: queriesEnabled && !productMode,
  })

  const { data: kpiPrev, isLoading: kpiPrevLoading } = useReports({
    connectionIds: activeConnectionIds,
    startDate: prevPeriod?.start ?? '',
    endDate: prevPeriod?.end ?? '',
    enabled: queriesEnabled && !productMode && Boolean(prevPeriod) && kpiReady,
  })

  const {
    data: pkpi,
    isLoading: pkpiLoading,
    isSuccess: pkpiReady,
  } = useProductReports({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    enabled: queriesEnabled && productMode,
  })

  const { data: pkpiPrev, isLoading: pkpiPrevLoading } = useProductReports({
    connectionIds: activeConnectionIds,
    productIds,
    startDate: prevPeriod?.start ?? '',
    endDate: prevPeriod?.end ?? '',
    enabled: queriesEnabled && productMode && Boolean(prevPeriod) && pkpiReady,
  })

  const { data: momCurrent, isLoading: momCurrentLoading } = useReports({
    connectionIds: activeConnectionIds,
    startDate: momPeriod?.current.start ?? '',
    endDate: momPeriod?.current.end ?? '',
    enabled: queriesEnabled && !productMode && Boolean(momPeriod),
  })
  const { data: momPrevious, isLoading: momPreviousLoading } = useReports({
    connectionIds: activeConnectionIds,
    startDate: momPeriod?.previous.start ?? '',
    endDate: momPeriod?.previous.end ?? '',
    enabled: queriesEnabled && !productMode && Boolean(momPeriod) && Boolean(momCurrent),
  })

  const { data: momProductCurrent, isLoading: momProductCurrentLoading } = useProductReports({
    connectionIds: activeConnectionIds,
    productIds,
    startDate: momPeriod?.current.start ?? '',
    endDate: momPeriod?.current.end ?? '',
    enabled: queriesEnabled && productMode && Boolean(momPeriod),
  })
  const { data: momProductPrevious, isLoading: momProductPreviousLoading } = useProductReports({
    connectionIds: activeConnectionIds,
    productIds,
    startDate: momPeriod?.previous.start ?? '',
    endDate: momPeriod?.previous.end ?? '',
    enabled:
      queriesEnabled && productMode && Boolean(momPeriod) && Boolean(momProductCurrent),
  })

  const { data: yoyPrevious, isLoading: yoyPreviousLoading } = useReports({
    connectionIds: activeConnectionIds,
    startDate: yoyPeriod?.start ?? '',
    endDate: yoyPeriod?.end ?? '',
    enabled: queriesEnabled && !productMode && Boolean(yoyPeriod) && kpiReady,
  })

  const { data: yoyProductPrevious, isLoading: yoyProductPreviousLoading } = useProductReports({
    connectionIds: activeConnectionIds,
    productIds,
    startDate: yoyPeriod?.start ?? '',
    endDate: yoyPeriod?.end ?? '',
    enabled: queriesEnabled && productMode && Boolean(yoyPeriod) && pkpiReady,
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

  const { format: formatMoney, convert: convertMoney, effectiveDisplayCurrency, baseCurrency } =
    useMoney()

  const displayKpi = useMemo((): KpiResponse | null => {
    if (productMode) return null
    if (connectorsLoading) return null
    if (activeConnectionIds.length > 0 && kpiLoading) return null
    return kpi ?? zeroKpiResponse(baseCurrency)
  }, [productMode, connectorsLoading, activeConnectionIds, kpiLoading, kpi, baseCurrency])

  const pageAlerts = useMemo(() => {
    type PageAlertItem = {
      key: string
      title: string
      icon: LucideIcon
      tone: ContextAlertTone
    }
    const items: PageAlertItem[] = []
    if (showAmazonFeesNotice) {
      items.push({
        key: 'amazon-fees',
        title: t('integrationAmazonFeesUnavailableBanner'),
        icon: AlertTriangle,
        tone: 'warning',
      })
    }
    if (!productMode && displayKpi?.cogs_incomplete) {
      items.push({
        key: 'cogs-incomplete',
        title: t('reportsCogsIncompleteWarning'),
        icon: Package,
        tone: 'warning',
      })
    }
    return items
  }, [showAmazonFeesNotice, productMode, displayKpi?.cogs_incomplete, t])

  const currency =
    (productMode ? pkpi?.currency : displayKpi?.currency) ?? baseCurrency
  const convertFromBase = useMemo(
    () => (n: number) => convertMoney(n, { nativeCurrency: currency }).amount,
    [convertMoney, currency],
  )
  const formatInDisplay = useMemo(
    () => (n: number) => formatMoney(n, { nativeCurrency: effectiveDisplayCurrency }),
    [formatMoney, effectiveDisplayCurrency],
  )
  const formatConverted = useCallback(
    (n: number) => formatInDisplay(convertFromBase(n)),
    [formatInDisplay, convertFromBase],
  )

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

  const settlementSource = productMode ? pkpi?.settlement : displayKpi?.settlement

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

  const previousReady = Boolean(prevPeriod) && (productMode ? !pkpiPrevLoading : !kpiPrevLoading)

  const momReady = productMode
    ? Boolean(momPeriod) && !momProductCurrentLoading && !momProductPreviousLoading
    : Boolean(momPeriod) && !momCurrentLoading && !momPreviousLoading

  const yoyReady = productMode
    ? Boolean(yoyPeriod) && pkpiReady && !yoyProductPreviousLoading
    : Boolean(yoyPeriod) && kpiReady && !yoyPreviousLoading

  const momPct = useMemo(() => {
    if (!momReady) return null
    const cur = productMode
      ? momProductCurrent?.net_revenue
      : momCurrent?.net_revenue
    const prev = productMode
      ? momProductPrevious?.net_revenue
      : momPrevious?.net_revenue
    if (cur === undefined || prev === undefined) return null
    return pctVersusPrevious(cur, prev)?.pct ?? null
  }, [
    momReady,
    productMode,
    momProductCurrent,
    momProductPrevious,
    momCurrent,
    momPrevious,
  ])

  const yoyPct = useMemo(() => {
    if (!yoyReady) return null
    const cur = productMode ? pkpi?.net_revenue : kpi?.net_revenue
    const prev = productMode
      ? yoyProductPrevious?.net_revenue
      : yoyPrevious?.net_revenue
    if (cur === undefined || prev === undefined) return null
    return pctVersusPrevious(cur, prev)?.pct ?? null
  }, [yoyReady, productMode, pkpi, kpi, yoyProductPrevious, yoyPrevious])

  const pnlRows = useMemo(() => {
    if (productMode) {
      if (!pkpi) return []
      return buildProductPnlRows(pkpi, pkpiPrev ?? null, yoyProductPrevious ?? null)
    }
    if (!displayKpi) return []
    return buildTenantPnlRows(displayKpi, kpiPrev ?? null, yoyPrevious ?? null)
  }, [productMode, pkpi, pkpiPrev, yoyProductPrevious, displayKpi, kpiPrev, yoyPrevious])

  const benchmarkRows = useMemo(() => {
    if (productMode || !displayKpi) return []
    return buildBenchmarkRows({
      grossMarginPct: displayKpi.gross_margin_pct,
      contributionMarginPct: displayKpi.contribution_margin_pct,
      adsSpend: displayKpi.ads_spend,
      netRevenue: displayKpi.net_revenue,
      ebitdaMarginPct: displayKpi.ebitda_margin_pct,
    })
  }, [productMode, displayKpi])

  const isInitialLoad =
    connectorsLoading ||
    (queriesEnabled &&
      (productMode ? pkpiLoading && !pkpi : kpiLoading && displayKpi === null))

  const pickerStrings = {
    applyLabel: t('datePickerApply'),
    todayLabel: t('datePickerToday'),
    placeholder: t('datePickerPlaceholder'),
    presetLast7Days: t('datePickerLast7Days'),
    presetLast30Days: t('datePickerLast30Days'),
    presetLast3Months: t('datePickerLast3Months'),
    presetLast6Months: t('datePickerLast6Months'),
    presetLastYearRolling: t('datePickerLastYearRolling'),
    presetCurrentYear: t('datePickerCurrentYear'),
    presetPreviousYear: t('datePickerPreviousYear'),
  }

  return (
    <DashboardPage className={cn('flex flex-1 flex-col', hasNoIntegrations ? 'gap-0' : 'gap-8')}>
      {!hasNoIntegrations ? (
        <header className="flex flex-col gap-4">
          <div className="min-w-0">
            <h1 className="text-title font-semibold tracking-[-0.02em] text-text-primary">
              {t('reportsPageTitle')}
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
        <ReportsLoadingSkeleton />
      ) : (
        <div className="flex flex-col gap-12">
          {pageAlerts.length > 0 ? (
            <ContextAlertsGroup
              title={t('contextAlertsTitle').replace('{count}', String(pageAlerts.length))}
            >
              {pageAlerts.map((alert) => (
                <ContextAlertCard
                  key={alert.key}
                  title={alert.title}
                  icon={alert.icon}
                  tone={alert.tone}
                />
              ))}
            </ContextAlertsGroup>
          ) : null}
          <ReportsHeroKpis
            mode={productMode ? 'product' : 'tenant'}
            kpi={displayKpi}
            productKpi={pkpi ?? null}
            kpiPrev={kpiPrev ?? null}
            productKpiPrev={pkpiPrev ?? null}
            previousReady={previousReady}
            momPct={momPct}
            momReady={momReady}
            yoyPct={yoyPct}
            yoyReady={yoyReady}
            currency={currency}
            t={t}
          />

          {productMode ? (
            <p className="text-sm text-text-secondary">{t('reportsProductModeHint')}</p>
          ) : null}

          {pnlRows.length > 0 ? (
            <ReportsPnlTable
              rows={pnlRows}
              formatMoney={formatConverted}
              t={t}
            />
          ) : null}

          <div className="flex flex-col gap-12">
            {!productMode && displayKpi ? (
              <SectionContainer>
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
            ) : (
              <SectionContainer>
                <SectionHeader
                  title={t('reportsSectionRevenueBreakdown')}
                  description={t('reportsWaterfallSubtitle')}
                />
                <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
                  {productMode ? t('reportsProductModeHint') : t('reportsNoData')}
                </p>
              </SectionContainer>
            )}

            {settlementWaterfallSegments.length > 0 ? (
              <SectionContainer>
                <SectionHeader
                  title={t('reportsSectionSettlementTitle')}
                  description={t('reportsSectionSettlementSubtitle')}
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

            <SectionContainer>
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
          </div>

          {!productMode && benchmarkRows.length > 0 ? (
            <ReportsBenchmarksTable rows={benchmarkRows} t={t} />
          ) : null}
        </div>
      )}
    </DashboardPage>
  )
}
