import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { enUS } from 'date-fns/locale/en-US'
import { es as esLocale } from 'date-fns/locale/es'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'
import { SettingsSectionHeader, settingsDescriptionClassName } from '@/pages/configuration/settings-layout'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import type { FilterOption } from '@/ui/filters/types'
import { Skeleton } from '@/ui/skeleton'
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { AppSeriesChartViewToggle } from '@/pages/dashboard/app-chart-view-toggle'
import type { SeriesChartView } from '@/ui/chart-view-toggle'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'

import {
  connectionIdsForPlatform,
  filteredProductDetailPeriod,
  platformSlugsFromDetail,
  PRODUCT_DETAIL_ALL_CHANNELS,
} from './product-detail-analytics-filter'
import { ProductDetailInsightKpiTile } from './product-detail-insight-kpi-tile'
import { ProductDetailTrendChart } from './product-detail-trend-chart'
import { productPlatformLabel } from './product-platform-label'
import {
  isProductDetailTrendMetricChartable,
  PRODUCT_DETAIL_METRIC_COLORS,
  productDetailTrendMetricLabel,
  toggleProductDetailTrendMetric,
  type ProductDetailTrendMetricId,
} from './product-detail-trend-metrics'

type VistaAKpiKey =
  | 'net-sales'
  | 'gross-profit'
  | 'channel-margin'
  | 'cm'
  | 'units'
  | 'cm-unit'
  | 'avg-price'
  | 'unit-cogs'

const VISTA_A_TREND_METRIC: Partial<Record<VistaAKpiKey, ProductDetailTrendMetricId>> = {
  'net-sales': 'net-sales',
  'gross-profit': 'gross-profit',
  cm: 'net-profit',
  units: 'units',
}

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
  const [trendChartType, setTrendChartType] = useState<SeriesChartView>('line')
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

  const chartConnectionIds = useMemo(
    () => connectionIdsForPlatform(connectionsQuery.data, activeChannel),
    [connectionsQuery.data, activeChannel],
  )

  const dateLocale = lang === 'en' ? enUS : esLocale
  const kpiSkeleton = <Skeleton className="mt-0.5 h-6 w-24 max-w-full" aria-hidden />

  const { data: series, isError } = useMonthlyRevenueSeries({
    productIds: [productId],
    connectionIds: chartConnectionIds,
    startDate: insightStart,
    endDate: insightEnd,
    granularity,
    enabled: Boolean(productId && insightStart && insightEnd),
  })

  const onVistaAClick = useCallback((key: VistaAKpiKey) => {
    const metricId = VISTA_A_TREND_METRIC[key]
    if (!metricId || !isProductDetailTrendMetricChartable(metricId)) return
    setSelectedMetrics((prev) => toggleProductDetailTrendMetric(prev, metricId))
  }, [])

  const feesForFilter =
    activeChannel === PRODUCT_DETAIL_ALL_CHANNELS
      ? detail.period_settlement.marketplace_fees
      : (detail.period_settlement_by_platform.find(
          (row) => row.platform.trim().toLowerCase() === activeChannel,
        )?.marketplace_fees ?? 0)
  const shippingForFilter =
    activeChannel === PRODUCT_DETAIL_ALL_CHANNELS
      ? detail.period_settlement.shipping_charges
      : (detail.period_settlement_by_platform.find(
          (row) => row.platform.trim().toLowerCase() === activeChannel,
        )?.shipping_charges ?? 0)
  const channelMargin = filteredPeriod.gross_profit - feesForFilter - shippingForFilter
  const channelMarginPct =
    filteredPeriod.period_net_sales > 0
      ? (channelMargin / filteredPeriod.period_net_sales) * 100
      : 0
  const units = filteredPeriod.period_units_sold || 0
  const cmPerUnit = units > 0 ? filteredPeriod.contribution_margin / units : 0
  const avgPrice = units > 0 ? filteredPeriod.period_net_sales / units : 0
  const unitCogs =
    units > 0
      ? (detail.period_cogs *
          (detail.period_net_sales > 0
            ? filteredPeriod.period_net_sales / detail.period_net_sales
            : 0)) /
        units
      : 0

  const vistaAPrimary: Array<{
    key: VistaAKpiKey
    label: string
    helpText?: string
    value: ReactNode
    currencyCode?: string
    numericValue?: number
    ratePct?: number
  }> = [
    {
      key: 'net-sales',
      label: t('productsDetailPlatformPaymentNetSales'),
      value: insightKpi(fmtCard(filteredPeriod.period_net_sales)),
      currencyCode: baseCurrency,
      numericValue: filteredPeriod.period_net_sales,
    },
    {
      key: 'gross-profit',
      label: t('reportsWfGrossProfit'),
      value: insightKpi(fmtCard(filteredPeriod.gross_profit)),
      currencyCode: baseCurrency,
      numericValue: filteredPeriod.gross_profit,
      ratePct: filteredPeriod.gross_margin_pct,
    },
    {
      key: 'channel-margin',
      label: t('productsDetailChannelMargin'),
      helpText: t('productsDetailChannelMarginHelp'),
      value: insightKpi(fmtCard(channelMargin)),
      currencyCode: baseCurrency,
      numericValue: channelMargin,
      ratePct: channelMarginPct,
    },
    {
      key: 'cm',
      label: t('reportsNetProfit'),
      value: insightKpi(fmtCard(filteredPeriod.contribution_margin)),
      currencyCode: baseCurrency,
      numericValue: filteredPeriod.contribution_margin,
      ratePct: filteredPeriod.contribution_margin_pct,
    },
  ]
  const vistaASecondary: Array<{
    key: VistaAKpiKey
    label: string
    value: ReactNode
    currencyCode?: string
    numericValue?: number
  }> = [
    {
      key: 'units',
      label: productDetailTrendMetricLabel('units', t),
      value: insightKpi(units.toLocaleString()),
    },
    {
      key: 'cm-unit',
      label: t('productsDetailCmPerUnit'),
      value: insightKpi(fmtCard(cmPerUnit)),
      currencyCode: baseCurrency,
      numericValue: cmPerUnit,
    },
    {
      key: 'avg-price',
      label: t('productsDetailAvgPrice'),
      value: insightKpi(fmtCard(avgPrice)),
      currencyCode: baseCurrency,
      numericValue: avgPrice,
    },
    {
      key: 'unit-cogs',
      label: t('productsDetailUnitCogs'),
      value: insightKpi(fmtCard(unitCogs)),
      currencyCode: baseCurrency,
      numericValue: unitCogs,
    },
  ]

  function vistaATileProps(key: VistaAKpiKey) {
    const metricId = VISTA_A_TREND_METRIC[key]
    const selectable = Boolean(metricId && isProductDetailTrendMetricChartable(metricId))
    return {
      selectable,
      selected: Boolean(metricId && selectedMetrics.includes(metricId)),
      accentColor: metricId ? PRODUCT_DETAIL_METRIC_COLORS[metricId] : undefined,
      onSelect: selectable ? () => onVistaAClick(key) : undefined,
    }
  }

  return (
    <Card className="rounded-none border-none p-0 shadow-none hover:shadow-none">
      <CardHeader className="flex flex-col gap-3 p-0">
        {showSectionTitle ? (
          <SettingsSectionHeader
            title={t('productsDetailSectionInsightsTitle')}
            description={t('productsDetailSectionInsightsDescription')}
          />
        ) : (
          <p className={settingsDescriptionClassName}>{t('productsDetailSectionInsightsDescription')}</p>
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
          {vistaAPrimary.map((kpi) => (
            <ProductDetailInsightKpiTile
              key={kpi.key}
              label={kpi.label}
              helpText={kpi.helpText}
              showValues={showInsightValues}
              isFetching={insightsFetching}
              skeleton={kpiSkeleton}
              numericValue={kpi.numericValue}
              currencyCode={kpi.currencyCode}
              ratePct={kpi.ratePct}
              value={kpi.value}
              {...vistaATileProps(kpi.key)}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 items-stretch gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {vistaASecondary.map((kpi) => (
            <ProductDetailInsightKpiTile
              key={kpi.key}
              label={kpi.label}
              showValues={showInsightValues}
              isFetching={insightsFetching}
              skeleton={kpiSkeleton}
              numericValue={kpi.numericValue}
              currencyCode={kpi.currencyCode}
              value={kpi.value}
              {...vistaATileProps(kpi.key)}
            />
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <ChartGranularityFilter value={granularity} onChange={setGranularity} t={t} />
          <AppSeriesChartViewToggle
            value={trendChartType}
            onChange={setTrendChartType}
            t={t}
          />
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
            chartType={trendChartType}
          />
        )}
      </CardContent>
    </Card>
  )
}
