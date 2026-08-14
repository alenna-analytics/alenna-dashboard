import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { enUS } from 'date-fns/locale/en-US'
import { es as esLocale } from 'date-fns/locale/es'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import type { FilterOption } from '@/ui/filters/types'
import { Skeleton } from '@/ui/skeleton'
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'

import {
  connectionIdsForPlatform,
  filteredProductDetailPeriod,
  platformSlugsFromDetail,
  PRODUCT_DETAIL_ALL_CHANNELS,
} from './product-detail-analytics-filter'
import { formatInventoryDays } from './product-detail-format-inventory-days'
import { ProductDetailInsightKpiTile } from './product-detail-insight-kpi-tile'
import { ProductDetailTrendChart } from './product-detail-trend-chart'
import { productPlatformLabel } from './product-platform-label'
import {
  isProductDetailTrendMetricChartable,
  PRODUCT_DETAIL_METRIC_COLORS,
  PRODUCT_DETAIL_TREND_METRIC_IDS,
  productDetailTrendMetricHelp,
  productDetailTrendMetricLabel,
  productDetailTrendPeriodValueFromFiltered,
  toggleProductDetailTrendMetric,
  type ProductDetailTrendMetricId,
  type ProductDetailPeriodView,
} from './product-detail-trend-metrics'

type ProductDetailAnalyticsSectionProps = {
  productId: string
  lang: string
  detail: ProductDetailApi
  t: (key: ShellStringKey) => string
  baseCurrency: string
  fmtBase: (value: number) => string
  fmtCard: (value: number) => string
  insightStart: string
  insightEnd: string
  setInsightStart: (value: string) => void
  setInsightEnd: (value: string) => void
  pickerStrings: DateRangePickerStrings
  showInsightValues: boolean
  insightKpi: (value: ReactNode) => ReactNode
  insightsFetching: boolean
  showSectionTitle?: boolean
}

function filteredPeriodAsDetailShape(
  filtered: ReturnType<typeof filteredProductDetailPeriod>,
): ProductDetailPeriodView {
  return {
    period_gross_sales: filtered.period_gross_sales,
    period_net_sales: filtered.period_net_sales,
    period_gross_profit: filtered.period_gross_profit,
    gross_profit: filtered.gross_profit,
    contribution_margin: filtered.contribution_margin,
    contribution_margin_pct: filtered.contribution_margin_pct,
    gross_margin_pct: filtered.gross_margin_pct,
    cm_incomplete: filtered.cm_incomplete,
    period_gross_units_sold: filtered.period_units_sold,
    period_units_sold: filtered.period_units_sold,
    period_orders: filtered.period_orders,
    inventory_days: filtered.inventory_days,
  }
}

export function ProductDetailAnalyticsSection({
  productId,
  lang,
  detail,
  t,
  baseCurrency,
  fmtBase,
  fmtCard,
  insightStart,
  insightEnd,
  setInsightStart,
  setInsightEnd,
  pickerStrings,
  showInsightValues,
  insightKpi,
  insightsFetching,
  showSectionTitle = true,
}: ProductDetailAnalyticsSectionProps) {
  const [granularity, setGranularity] = useState<RevenueSeriesGranularity>('week')
  const [selectedMetrics, setSelectedMetrics] = useState<ProductDetailTrendMetricId[]>([
    'net-sales',
  ])
  const [channelFilter, setChannelFilter] = useState(PRODUCT_DETAIL_ALL_CHANNELS)

  const connectionsQuery = usePlatformConnectionsQuery()
  const platformSlugs = useMemo(() => platformSlugsFromDetail(detail), [detail])
  const activeChannel =
    channelFilter === PRODUCT_DETAIL_ALL_CHANNELS || platformSlugs.includes(channelFilter)
      ? channelFilter
      : PRODUCT_DETAIL_ALL_CHANNELS

  const channelOptions = useMemo((): FilterOption[] => {
    const allOption: FilterOption = {
      value: PRODUCT_DETAIL_ALL_CHANNELS,
      label: t('homeFilterChannelsAll'),
    }
    const platformOptions = platformSlugs.map((slug) => {
      const sourceSlug =
        detail.period_by_platform.find((row) => row.platform.trim().toLowerCase() === slug)
          ?.platform ??
        detail.listings.find((listing) => listing.platform.trim().toLowerCase() === slug)
          ?.platform ??
        slug
      return {
        value: slug,
        label: productPlatformLabel(sourceSlug, t),
      }
    })
    return [allOption, ...platformOptions]
  }, [detail.listings, detail.period_by_platform, platformSlugs, t])

  const filteredPeriod = useMemo(
    () => filteredProductDetailPeriod(detail, activeChannel),
    [detail, activeChannel],
  )
  const periodView = useMemo(
    () => filteredPeriodAsDetailShape(filteredPeriod),
    [filteredPeriod],
  )

  const chartConnectionIds = useMemo(
    () => connectionIdsForPlatform(connectionsQuery.data, activeChannel),
    [connectionsQuery.data, activeChannel],
  )

  const dateLocale = lang === 'en' ? enUS : esLocale
  const kpiSkeleton = <Skeleton className="mt-0.5 h-6 w-24 max-w-full" aria-hidden />

  const metricCards = useMemo(
    () =>
      PRODUCT_DETAIL_TREND_METRIC_IDS.map((id) => {
        const numericValue = productDetailTrendPeriodValueFromFiltered(periodView, id)
        const isMoney =
          id !== 'inventory-days' &&
          id !== 'contribution-margin-pct' &&
          id !== 'units' &&
          id !== 'orders'
        let value: ReactNode
        if (id === 'inventory-days') {
          value = insightKpi(formatInventoryDays(detail, t))
        } else if (id === 'contribution-margin-pct') {
          value = insightKpi(
            numericValue == null ? '—' : `${Number(numericValue).toFixed(1)}%`,
          )
        } else if (id === 'units' || id === 'orders') {
          value = insightKpi((numericValue ?? 0).toLocaleString())
        } else {
          value = insightKpi(fmtCard(numericValue ?? 0))
        }
        return {
          id,
          label: productDetailTrendMetricLabel(id, t),
          helpText: productDetailTrendMetricHelp(id, t),
          footer: id === 'inventory-days' ? t('productsDetailKpiInventoryDaysWindow') : undefined,
          numericValue,
          value,
          currencyCode: isMoney ? baseCurrency : undefined,
          selectable: isProductDetailTrendMetricChartable(id),
          accentColor: PRODUCT_DETAIL_METRIC_COLORS[id],
          selected: selectedMetrics.includes(id),
        }
      }),
    [
      periodView,
      detail,
      t,
      fmtCard,
      insightKpi,
      baseCurrency,
      selectedMetrics,
    ],
  )

  const { data: series, isError } = useMonthlyRevenueSeries({
    productIds: [productId],
    connectionIds: chartConnectionIds,
    startDate: insightStart,
    endDate: insightEnd,
    granularity,
    enabled: Boolean(productId && insightStart && insightEnd),
  })

  const onMetricClick = useCallback((id: ProductDetailTrendMetricId) => {
    if (!isProductDetailTrendMetricChartable(id)) return
    setSelectedMetrics((prev) => toggleProductDetailTrendMetric(prev, id))
  }, [])

  return (
    <Card className="rounded-none border-none p-0 shadow-none hover:shadow-none">
      <CardHeader className="flex flex-col gap-3 p-0">
        {showSectionTitle ? (
          <div className="space-y-1">
            <CardTitle className="text-xl">{t('productsDetailSectionInsightsTitle')}</CardTitle>
            <CardDescription className="text-xs">
              {t('productsDetailSectionInsightsDescription')}
            </CardDescription>
          </div>
        ) : (
          <CardDescription className="text-xs">
            {t('productsDetailSectionInsightsDescription')}
          </CardDescription>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <DateRangePicker
            strings={pickerStrings}
            startValue={insightStart}
            endValue={insightEnd}
            onStartChange={(v) => v && setInsightStart(v)}
            onEndChange={(v) => v && setInsightEnd(v)}
            className="w-full max-w-md"
          />
          <FilterComboboxSingle
            label={t('homeFilterChannels')}
            options={channelOptions}
            value={activeChannel}
            onValueChange={setChannelFilter}
            searchPlaceholder={t('homeFilterChannelsSearch')}
            emptyLabel={t('homeFilterChannelsEmpty')}
            allowClear={false}
            triggerClassName="w-full sm:w-auto sm:min-w-[12rem]"
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-0 pt-4">
        <div className="grid grid-cols-1 items-stretch gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((kpi) => (
            <ProductDetailInsightKpiTile
              key={kpi.id}
              label={kpi.label}
              helpText={kpi.helpText}
              footer={kpi.footer}
              showValues={showInsightValues}
              isFetching={insightsFetching}
              skeleton={kpiSkeleton}
              numericValue={kpi.numericValue}
              currencyCode={kpi.currencyCode}
              value={kpi.value}
              selectable={kpi.selectable}
              selected={kpi.selected}
              accentColor={kpi.accentColor}
              onSelect={kpi.selectable ? () => onMetricClick(kpi.id) : undefined}
            />
          ))}
        </div>
        <div className="flex justify-end">
          <ChartGranularityFilter value={granularity} onChange={setGranularity} t={t} />
        </div>
        {isError ? (
          <p className="text-sm text-destructive">{t('reportsMonthlyLoadError')}</p>
        ) : (
          <ProductDetailTrendChart
            startDate={insightStart}
            endDate={insightEnd}
            granularity={granularity}
            rows={series?.months ?? []}
            selectedMetrics={selectedMetrics}
            formatMoney={fmtBase}
            dateLocale={dateLocale}
            t={t}
          />
        )}
      </CardContent>
    </Card>
  )
}
