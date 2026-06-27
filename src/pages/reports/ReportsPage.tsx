import { useCallback, useMemo, useState } from 'react'

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
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { buildWaterfallSegments } from '@/pages/reports/waterfall-segments'
import { WaterfallChart } from '@/pages/reports/waterfall-chart'
import { useReports } from '@/pages/reports/use-reports'
import { useChannelTimeSeries } from '@/pages/reports/use-channel-time-series'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { FilterComboboxMulti } from '@/ui/filters/filter-combobox-multi'
import { FilterDates } from '@/ui/filters/filter-dates'
import { presetDateRangeYmd } from '@/ui/date-range-picker'
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <SectionContainer key={i} className="overflow-visible">
          <div className="mb-4 space-y-2" aria-hidden>
            <Skeleton className="h-6 w-48 max-w-[80%]" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-md" />
        </SectionContainer>
      ))}
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

  const { data: kpi, isLoading: kpiLoading } = useReports({
    connectionIds: activeConnectionIds,
    startDate,
    endDate,
    enabled: !productMode && activeConnectionIds.length > 0,
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

  const currency = displayKpi?.currency ?? baseCurrency
  const convertFromBase = useMemo(
    () => (n: number) => convertMoney(n, { nativeCurrency: currency }).amount,
    [convertMoney, currency],
  )
  const formatInDisplay = useMemo(
    () => (n: number) => formatMoney(n, { nativeCurrency: effectiveDisplayCurrency }),
    [formatMoney, effectiveDisplayCurrency],
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

  const isInitialLoad =
    connectorsLoading || (!productMode && activeConnectionIds.length > 0 && displayKpi === null)

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
    <DashboardPage className={cn('flex flex-1 flex-col', hasNoIntegrations ? 'gap-0' : 'gap-4')}>
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
          ) : (
            <SectionContainer className="overflow-visible">
              <SectionHeader
                title={t('reportsSectionRevenueBreakdown')}
                description={t('reportsWaterfallSubtitle')}
              />
              <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
                {t('reportsNoData')}
              </p>
            </SectionContainer>
          )}

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
        </div>
      )}
    </DashboardPage>
  )
}
