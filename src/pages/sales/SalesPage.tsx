import { useCallback, useMemo, useState } from 'react'

import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { enUS, es as esLocale } from 'date-fns/locale'

import { useCurrentTenant } from '@/auth/hooks'
import { useMoney } from '@/hooks/use-money'
import { apiFetch } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
import type { PlatformConnection } from '@/lib/types/connectors'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { HomeNoIntegrationsState } from '@/pages/dashboard/home-no-integrations-state'
import { HomeProductFilter } from '@/pages/dashboard/home-product-filter'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import {
  computeCalendarMomPeriod,
  computeShiftedPreviousPeriod,
  computeYoyPeriod,
  pctVersusPrevious,
} from '@/pages/reports/reports-ui-helpers'
import { useChannelTimeSeries } from '@/pages/reports/use-channel-time-series'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'
import { useProductReports } from '@/pages/reports/use-product-reports'
import { useReports } from '@/pages/reports/use-reports'
import { useTopProducts } from '@/pages/reports/use-top-products'
import { SalesChannelNetBarsChart } from '@/pages/sales/sales-channel-net-bars-chart'
import { SalesDeductionsBlock } from '@/pages/sales/sales-deductions-block'
import { SalesKpiSection } from '@/pages/sales/sales-kpi-section'
import { productToSalesKpiSource, toSalesKpiSource } from '@/pages/sales/sales-kpi-source'
import { SalesProductsTable } from '@/pages/sales/sales-products-table'
import { SalesYoyChart } from '@/pages/sales/sales-yoy-chart'
import { useSalesPageFilters } from '@/pages/sales/use-sales-page-filters'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { FilterComboboxMulti } from '@/ui/filters/filter-combobox-multi'
import { FilterDates } from '@/ui/filters/filter-dates'
import { Skeleton } from '@/ui/skeleton'
import { cn } from '@/lib/utils'

const TOP_PRODUCTS_LIMIT = 50

function platformDisplayName(platform: string): string {
  const trimmed = platform.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function SalesLoadingSkeleton() {
  return (
    <div className="space-y-12">
      <SectionContainer>
        <div className="mb-4 space-y-2" aria-hidden>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-md" />
          ))}
        </div>
      </SectionContainer>
      <div className="flex flex-col gap-12">
        {Array.from({ length: 2 }).map((_, i) => (
          <SectionContainer key={i}>
            <Skeleton className="mb-4 h-6 w-48" />
            <Skeleton className="h-80 w-full rounded-md" />
          </SectionContainer>
        ))}
      </div>
    </div>
  )
}

export function SalesPage() {
  const { lang } = useLanguage()
  const dateLocale = lang === 'en' ? enUS : esLocale
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const t = useCallback(
    (k: Parameters<typeof shellT>[1]) => shellT(lang, k),
    [lang],
  )

  const [filters, setFilters] = useSalesPageFilters(tenantId)
  const { startDate, endDate, connectionIds, productIds } = filters
  const productMode = productIds.length > 0

  const [channelGranularity, setChannelGranularity] =
    useState<RevenueSeriesGranularity>('month')
  const [yoyGranularity, setYoyGranularity] =
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

  const queriesEnabled = activeConnectionIds.length > 0

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

  const {
    data: momCurrent,
    isLoading: momCurrentLoading,
    isSuccess: momCurrentReady,
  } = useReports({
    connectionIds: activeConnectionIds,
    startDate: momPeriod?.current.start ?? '',
    endDate: momPeriod?.current.end ?? '',
    enabled: queriesEnabled && !productMode && Boolean(momPeriod),
  })
  const { data: momPrevious, isLoading: momPreviousLoading } = useReports({
    connectionIds: activeConnectionIds,
    startDate: momPeriod?.previous.start ?? '',
    endDate: momPeriod?.previous.end ?? '',
    enabled: queriesEnabled && !productMode && Boolean(momPeriod) && momCurrentReady,
  })

  const {
    data: momProductCurrent,
    isLoading: momProductCurrentLoading,
    isSuccess: momProductCurrentReady,
  } = useProductReports({
    connectionIds: activeConnectionIds,
    productIds,
    startDate: momPeriod?.current.start ?? '',
    endDate: momPeriod?.current.end ?? '',
    enabled: queriesEnabled && productMode && Boolean(momPeriod),
  })
  const { data: momProductPrevious, isLoading: momProductPreviousLoading } =
    useProductReports({
      connectionIds: activeConnectionIds,
      productIds,
      startDate: momPeriod?.previous.start ?? '',
      endDate: momPeriod?.previous.end ?? '',
      enabled:
        queriesEnabled && productMode && Boolean(momPeriod) && momProductCurrentReady,
    })

  const { data: yoyPrevious, isLoading: yoyPreviousLoading } = useReports({
    connectionIds: activeConnectionIds,
    startDate: yoyPeriod?.start ?? '',
    endDate: yoyPeriod?.end ?? '',
    enabled: queriesEnabled && !productMode && Boolean(yoyPeriod) && kpiReady,
  })

  const { data: yoyProductPrevious, isLoading: yoyProductPreviousLoading } =
    useProductReports({
      connectionIds: activeConnectionIds,
      productIds,
      startDate: yoyPeriod?.start ?? '',
      endDate: yoyPeriod?.end ?? '',
      enabled: queriesEnabled && productMode && Boolean(yoyPeriod) && pkpiReady,
    })

  const {
    data: channelTimeSeries,
    isError: channelTimeSeriesError,
    isLoading: channelTimeSeriesLoading,
  } = useChannelTimeSeries({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    granularity: channelGranularity,
    enabled: queriesEnabled,
  })

  const {
    data: yoySeriesCurrent,
    isError: yoySeriesCurrentError,
    isLoading: yoySeriesCurrentLoading,
  } = useMonthlyRevenueSeries({
    connectionIds: activeConnectionIds,
    productIds,
    startDate,
    endDate,
    granularity: yoyGranularity,
    enabled: queriesEnabled && Boolean(yoyPeriod),
  })

  const {
    data: yoySeriesPrev,
    isError: yoySeriesPrevError,
    isLoading: yoySeriesPrevLoading,
  } = useMonthlyRevenueSeries({
    connectionIds: activeConnectionIds,
    productIds,
    startDate: yoyPeriod?.start ?? '',
    endDate: yoyPeriod?.end ?? '',
    granularity: yoyGranularity,
    enabled: queriesEnabled && Boolean(yoyPeriod),
  })

  const {
    data: topProducts,
    isLoading: topProductsLoading,
    isFetching: topProductsFetching,
  } = useTopProducts({
    connectionIds: activeConnectionIds,
    productIds: productMode ? productIds : undefined,
    startDate,
    endDate,
    limit: TOP_PRODUCTS_LIMIT,
    enabled: queriesEnabled && !productMode,
  })

  const { format: formatMoney, convert: convertMoney, effectiveDisplayCurrency, baseCurrency } =
    useMoney()

  const salesKpi = useMemo(() => {
    if (productMode) return pkpi ? productToSalesKpiSource(pkpi) : null
    return kpi ? toSalesKpiSource(kpi) : null
  }, [productMode, pkpi, kpi])

  const salesKpiPrev = useMemo(() => {
    if (productMode) return pkpiPrev ? productToSalesKpiSource(pkpiPrev) : undefined
    return kpiPrev ? toSalesKpiSource(kpiPrev) : undefined
  }, [productMode, pkpiPrev, kpiPrev])

  const currency = salesKpi
    ? productMode
      ? (pkpi?.currency ?? baseCurrency)
      : (kpi?.currency ?? baseCurrency)
    : baseCurrency

  const convertFromBase = useMemo(
    () => (n: number) => convertMoney(n, { nativeCurrency: currency }).amount,
    [convertMoney, currency],
  )
  const formatInDisplay = useMemo(
    () => (n: number) => formatMoney(n, { nativeCurrency: effectiveDisplayCurrency }),
    [formatMoney, effectiveDisplayCurrency],
  )

  const previousReady = Boolean(prevPeriod) && (productMode ? !pkpiPrevLoading : !kpiPrevLoading)

  const momReady = productMode
    ? Boolean(momPeriod) && !momProductCurrentLoading && !momProductPreviousLoading
    : Boolean(momPeriod) && !momCurrentLoading && !momPreviousLoading
  const momPct = useMemo(() => {
    const cur = productMode ? momProductCurrent?.net_revenue : momCurrent?.net_revenue
    const prev = productMode ? momProductPrevious?.net_revenue : momPrevious?.net_revenue
    if (!momReady || cur === undefined || prev === undefined) return null
    return pctVersusPrevious(cur, prev)?.pct ?? null
  }, [
    productMode,
    momReady,
    momCurrent,
    momPrevious,
    momProductCurrent,
    momProductPrevious,
  ])

  const yoyReady = productMode
    ? Boolean(yoyPeriod) && pkpiReady && !yoyProductPreviousLoading
    : Boolean(yoyPeriod) && kpiReady && !yoyPreviousLoading
  const yoyPct = useMemo(() => {
    const cur = productMode ? pkpi?.net_revenue : kpi?.net_revenue
    const prev = productMode ? yoyProductPrevious?.net_revenue : yoyPrevious?.net_revenue
    if (!yoyReady || cur === undefined || prev === undefined) return null
    return pctVersusPrevious(cur, prev)?.pct ?? null
  }, [productMode, yoyReady, kpi, pkpi, yoyPrevious, yoyProductPrevious])

  const isInitialLoad =
    connectorsLoading ||
    (queriesEnabled &&
      ((productMode && pkpiLoading && !pkpi) || (!productMode && kpiLoading && !kpi)))

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

  const vsPrior = t('reportsVsPreviousPeriod')
  const comparisonUnavailable = t('reportsComparisonUnavailable')

  return (
    <DashboardPage className={cn('flex flex-1 flex-col', hasNoIntegrations ? 'gap-0' : 'gap-8')}>
      {!hasNoIntegrations ? (
        <header className="flex flex-col gap-4">
          <div className="min-w-0">
            <h1 className={pageTitleClassName}>
              {t('salesPageTitle')}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-text-secondary">
              {t('salesPageSubtitle')}
            </p>
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
        <SalesLoadingSkeleton />
      ) : !queriesEnabled ? (
        <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
          {t('reportsSelectConnection')}
        </p>
      ) : (
        <div className="space-y-12">
          {salesKpi ? (
            <SalesKpiSection
              kpi={salesKpi}
              kpiPrev={salesKpiPrev}
              currency={currency}
              previousReady={previousReady}
              vsPrior={vsPrior}
              comparisonUnavailable={comparisonUnavailable}
              momPct={momPct}
              momReady={momReady}
              yoyPct={yoyPct}
              yoyReady={yoyReady}
              showDeductions={!productMode}
              t={t}
            />
          ) : null}

          {!productMode && kpi ? (
            <SalesDeductionsBlock
              grossRevenue={kpi.gross_revenue}
              discounts={kpi.discounts}
              returns={kpi.returns}
              netRevenue={kpi.net_revenue}
              currency={currency}
              t={t}
            />
          ) : null}

          <div className="flex flex-col gap-12">
            <SectionContainer>
              <SectionHeader
                title={t('salesChannelNetBarsTitle')}
                description={t('salesChannelNetBarsSubtitle')}
                aside={
                  <ChartGranularityFilter
                    value={channelGranularity}
                    onChange={setChannelGranularity}
                    t={t}
                  />
                }
              />
              {channelTimeSeriesError ? (
                <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
                  {t('reportsMonthlyLoadError')}
                </p>
              ) : channelTimeSeriesLoading && !channelTimeSeries ? (
                <Skeleton className="h-80 w-full rounded-md" />
              ) : (
                <SalesChannelNetBarsChart
                  startDate={startDate}
                  endDate={endDate}
                  granularity={channelGranularity}
                  rows={channelTimeSeries?.rows ?? []}
                  currency={effectiveDisplayCurrency}
                  convertValue={convertFromBase}
                  formatValue={formatInDisplay}
                  dateLocale={dateLocale}
                  t={t}
                />
              )}
            </SectionContainer>

            <SectionContainer>
              <SectionHeader
                title={t('salesYoyChartTitle')}
                description={t('salesYoyChartSubtitle')}
                aside={
                  <ChartGranularityFilter
                    value={yoyGranularity}
                    onChange={setYoyGranularity}
                    t={t}
                  />
                }
              />
              {!yoyPeriod || yoySeriesCurrentError || yoySeriesPrevError ? (
                <p className="rounded-md px-2 py-6 text-sm text-text-secondary">
                  {t('reportsMonthlyLoadError')}
                </p>
              ) : (yoySeriesCurrentLoading || yoySeriesPrevLoading) &&
                !yoySeriesCurrent ? (
                <Skeleton className="h-80 w-full rounded-md" />
              ) : (
                <SalesYoyChart
                  startDate={startDate}
                  endDate={endDate}
                  prevStart={yoyPeriod.start}
                  prevEnd={yoyPeriod.end}
                  granularity={yoyGranularity}
                  rowsCurrent={yoySeriesCurrent?.months ?? []}
                  rowsPrev={yoySeriesPrev?.months ?? []}
                  currency={effectiveDisplayCurrency}
                  formatValue={formatInDisplay}
                  convertValue={convertFromBase}
                  dateLocale={dateLocale}
                  t={t}
                />
              )}
            </SectionContainer>
          </div>

          {!productMode ? (
            <SalesProductsTable
              rows={topProducts?.items ?? []}
              isLoading={topProductsLoading}
              isFetching={topProductsFetching}
              formatMoney={(v) =>
                formatMoney(v, { nativeCurrency: topProducts?.currency ?? currency })
              }
              t={t}
            />
          ) : null}
        </div>
      )}
    </DashboardPage>
  )
}
