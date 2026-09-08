import { useCallback, useState, type ReactNode } from 'react'
import { enUS } from 'date-fns/locale/en-US'
import { es as esLocale } from 'date-fns/locale/es'

import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkGroupApi } from '@/lib/types/product-links'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { AppSeriesChartViewToggle } from '@/pages/dashboard/app-chart-view-toggle'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import { Label } from '@/ui/label'
import { Skeleton } from '@/ui/skeleton'
import { Switch } from '@/ui/switch'
import type { SeriesChartView } from '@/ui/chart-view-toggle'

import { ProductDetailInsightKpiTile } from '../product-detail-insight-kpi-tile'
import { ProductDetailTrendChart } from '../product-detail-trend-chart'
import {
  isProductDetailTrendMetricChartable,
  PRODUCT_DETAIL_METRIC_COLORS,
  productDetailTrendMetricLabel,
  toggleProductDetailTrendMetric,
  type ProductDetailTrendMetricId,
} from '../product-detail-trend-metrics'
import type { GroupInsightDimensionState } from './group-insight-dimension'

type ShellT = (key: ShellStringKey) => string

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

type VinculacionGroupAnalyticsProps = {
  group: ProductLinkGroupApi
  insight: GroupInsightDimensionState
  lang: string
  t: ShellT
  baseCurrency: string
  fmtBase: (value: number) => string
  fmtCard: (value: number) => string
  insightStart: string
  insightEnd: string
  setInsightStart: (value: string) => void
  setInsightEnd: (value: string) => void
  pickerStrings: DateRangePickerStrings
  insightsFetching: boolean
}

export function VinculacionGroupAnalytics({
  insight,
  lang,
  t,
  baseCurrency,
  fmtBase,
  fmtCard,
  insightStart,
  insightEnd,
  setInsightStart,
  setInsightEnd,
  pickerStrings,
  insightsFetching,
}: VinculacionGroupAnalyticsProps) {
  const [granularity, setGranularity] = useState<RevenueSeriesGranularity>('week')
  const [trendChartType, setTrendChartType] = useState<SeriesChartView>('line')
  const [selectedMetrics, setSelectedMetrics] = useState<ProductDetailTrendMetricId[]>(['net-sales'])
  const connectionsQuery = usePlatformConnectionsQuery()

  const chartConnectionIds = insight.connectionIdsForActive(connectionsQuery.data)
  const { period, chartProductIds } = insight

  const dateLocale = lang === 'en' ? enUS : esLocale
  const kpiSkeleton = <Skeleton className="mt-0.5 h-6 w-24 max-w-full" aria-hidden />
  const insightKpi = (value: ReactNode): ReactNode => value

  const units = period.units
  const cmPerUnit = units > 0 ? period.contribution_margin / units : 0
  const avgPrice = units > 0 ? period.period_net_sales / units : 0
  const unitCogs = units > 0 ? period.period_cogs / units : 0

  const { data: series, isError } = useMonthlyRevenueSeries({
    productIds: chartProductIds,
    connectionIds: chartConnectionIds,
    startDate: insightStart,
    endDate: insightEnd,
    granularity,
    enabled: chartProductIds.length > 0 && Boolean(insightStart && insightEnd),
  })

  const onVistaAClick = useCallback((key: VistaAKpiKey) => {
    const metricId = VISTA_A_TREND_METRIC[key]
    if (!metricId || !isProductDetailTrendMetricChartable(metricId)) return
    setSelectedMetrics((prev) => toggleProductDetailTrendMetric(prev, metricId))
  }, [])

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
      value: insightKpi(fmtCard(period.period_net_sales)),
      currencyCode: baseCurrency,
      numericValue: period.period_net_sales,
    },
    {
      key: 'gross-profit',
      label: t('reportsWfGrossProfit'),
      value: insightKpi(fmtCard(period.period_gross_profit)),
      currencyCode: baseCurrency,
      numericValue: period.period_gross_profit,
      ratePct: period.gross_margin_pct,
    },
    {
      key: 'channel-margin',
      label: t('productsDetailChannelMargin'),
      helpText: t('productsDetailChannelMarginHelp'),
      value: insightKpi(fmtCard(period.channel_margin)),
      currencyCode: baseCurrency,
      numericValue: period.channel_margin,
      ratePct: period.channel_margin_pct,
    },
    {
      key: 'cm',
      label: t('reportsNetProfit'),
      value: insightKpi(fmtCard(period.contribution_margin)),
      currencyCode: baseCurrency,
      numericValue: period.contribution_margin,
      ratePct: period.contribution_margin_pct,
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

  const byProduct = insight.dimension === 'product'

  return (
    <Card className="rounded-none border-none p-0 shadow-none hover:shadow-none">
      <CardHeader className="flex flex-col gap-3 p-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <DateRangePicker
            strings={pickerStrings}
            startValue={insightStart}
            endValue={insightEnd}
            onStartChange={(v) => v && setInsightStart(v)}
            onEndChange={(v) => v && setInsightEnd(v)}
            className="w-full max-w-md"
          />
          <div className="flex h-[33px] items-center gap-2 rounded-md border border-border-default bg-white px-2.5">
            <Label
              htmlFor="group-insight-dimension-analytics"
              className="cursor-pointer text-xs font-medium text-text-secondary"
            >
              {t('productsVinculacionViewByChannel')}
            </Label>
            <Switch
              id="group-insight-dimension-analytics"
              checked={byProduct}
              onCheckedChange={(checked) =>
                insight.setDimension(checked ? 'product' : 'channel')
              }
            />
            <Label
              htmlFor="group-insight-dimension-analytics"
              className="cursor-pointer text-xs font-medium text-text-secondary"
            >
              {t('productsVinculacionViewByProduct')}
            </Label>
          </div>
          {byProduct ? (
            <FilterComboboxSingle
              label={t('productsColProduct')}
              options={insight.productOptions}
              value={insight.productFilter}
              onValueChange={insight.setProductFilter}
              searchPlaceholder={t('productsSearchPlaceholder')}
              emptyLabel={t('productsVinculacionPickerEmpty')}
              allowClear={false}
              triggerClassName="w-full sm:w-auto sm:min-w-[12rem]"
            />
          ) : (
            <FilterComboboxSingle
              label={t('homeFilterChannels')}
              options={insight.channelOptions}
              value={insight.channelFilter}
              onValueChange={insight.setChannelFilter}
              searchPlaceholder={t('homeFilterChannelsSearch')}
              emptyLabel={t('homeFilterChannelsEmpty')}
              allowClear={false}
              triggerClassName="w-full sm:w-auto sm:min-w-[12rem]"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-0 pt-4">
        <div className="grid grid-cols-1 items-stretch gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {vistaAPrimary.map((kpi) => (
            <ProductDetailInsightKpiTile
              key={kpi.key}
              label={kpi.label}
              helpText={kpi.helpText}
              showValues
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
              showValues
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
          <AppSeriesChartViewToggle value={trendChartType} onChange={setTrendChartType} t={t} />
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
