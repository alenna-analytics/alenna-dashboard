import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { enUS } from 'date-fns/locale/en-US'
import { es as esLocale } from 'date-fns/locale/es'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { Skeleton } from '@/ui/skeleton'
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'

import { formatInventoryDays } from './product-detail-format-inventory-days'
import { ProductDetailInsightKpiTile } from './product-detail-insight-kpi-tile'
import { ProductDetailKpiPlatformBreakdown } from './product-detail-kpi-platform-breakdown'
import { ProductDetailTrendChart } from './product-detail-trend-chart'
import {
  isProductDetailTrendMetricChartable,
  PRODUCT_DETAIL_METRIC_COLORS,
  PRODUCT_DETAIL_TREND_METRIC_IDS,
  productDetailPlatformSalesValue,
  productDetailPlatformUnitsValue,
  productDetailTrendMetricHelp,
  productDetailTrendMetricLabel,
  productDetailTrendPeriodValue,
  toggleProductDetailTrendMetric,
  type ProductDetailTrendMetricId,
} from './product-detail-trend-metrics'

type ProductDetailAnalyticsSectionProps = {
  productId: string
  lang: string
  detail: ProductDetailApi
  t: (key: ShellStringKey) => string
  baseCurrency: string
  fmtBase: (value: number) => string
  costAmountWithBaseCode: (formatted: string, baseCurrency: string, codeClassName: string) => ReactNode
  insightStart: string
  insightEnd: string
  setInsightStart: (value: string) => void
  setInsightEnd: (value: string) => void
  pickerStrings: DateRangePickerStrings
  showInsightValues: boolean
  insightKpi: (value: ReactNode) => ReactNode
  insightsFetching: boolean
}

export function ProductDetailAnalyticsSection({
  productId,
  lang,
  detail,
  t,
  baseCurrency,
  fmtBase,
  costAmountWithBaseCode,
  insightStart,
  insightEnd,
  setInsightStart,
  setInsightEnd,
  pickerStrings,
  showInsightValues,
  insightKpi,
  insightsFetching,
}: ProductDetailAnalyticsSectionProps) {
  const [granularity, setGranularity] = useState<RevenueSeriesGranularity>('week')
  const [selectedMetrics, setSelectedMetrics] = useState<ProductDetailTrendMetricId[]>([
    'net-sales',
  ])

  const dateLocale = lang === 'en' ? enUS : esLocale
  const kpiSkeleton = <Skeleton className="mt-0.5 h-6 w-24 max-w-full" aria-hidden />
  const periodByPlatform = useMemo(
    () => detail.period_by_platform ?? [],
    [detail.period_by_platform],
  )

  const platformSalesBreakdown = useMemo(
    () =>
      periodByPlatform.length > 0 ? (
        <ProductDetailKpiPlatformBreakdown
          rows={periodByPlatform}
          t={t}
          formatValue={(row) => fmtBase(productDetailPlatformSalesValue(row))}
        />
      ) : undefined,
    [periodByPlatform, t, fmtBase],
  )

  const platformUnitsBreakdown = useMemo(
    () =>
      periodByPlatform.length > 0 ? (
        <ProductDetailKpiPlatformBreakdown
          rows={periodByPlatform}
          t={t}
          formatValue={(row) => productDetailPlatformUnitsValue(row).toLocaleString()}
        />
      ) : undefined,
    [periodByPlatform, t],
  )

  const metricCards = useMemo(
    () =>
      PRODUCT_DETAIL_TREND_METRIC_IDS.map((id) => {
        const numericValue = productDetailTrendPeriodValue(detail, id)
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
          value = insightKpi(
            costAmountWithBaseCode(fmtBase(numericValue ?? 0), baseCurrency, 'text-xs'),
          )
        }
        return {
          id,
          label: productDetailTrendMetricLabel(id, t),
          helpText: productDetailTrendMetricHelp(id, t),
          footer: id === 'inventory-days' ? t('productsDetailKpiInventoryDaysWindow') : undefined,
          breakdown:
            id === 'gross-sales'
              ? platformSalesBreakdown
              : id === 'units'
                ? platformUnitsBreakdown
                : undefined,
          numericValue,
          value,
          selectable: isProductDetailTrendMetricChartable(id),
          accentColor: PRODUCT_DETAIL_METRIC_COLORS[id],
          selected: selectedMetrics.includes(id),
        }
      }),
    [
      detail,
      t,
      fmtBase,
      insightKpi,
      costAmountWithBaseCode,
      baseCurrency,
      platformSalesBreakdown,
      platformUnitsBreakdown,
      selectedMetrics,
    ],
  )

  const { data: series, isError } = useMonthlyRevenueSeries({
    productIds: [productId],
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
      <CardHeader className="flex flex-col gap-4 p-0 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl">{t('productsDetailSectionInsightsTitle')}</CardTitle>
          <CardDescription className="text-xs">
            {t('productsDetailSectionInsightsDescription')}
          </CardDescription>
        </div>
        <div className="flex w-full max-w-md flex-col gap-2 sm:ml-auto sm:items-end">
          <DateRangePicker
            strings={pickerStrings}
            startValue={insightStart}
            endValue={insightEnd}
            onStartChange={(v) => v && setInsightStart(v)}
            onEndChange={(v) => v && setInsightEnd(v)}
            className="w-full shrink-0"
          />
          <ChartGranularityFilter value={granularity} onChange={setGranularity} t={t} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-0 pt-4">
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((kpi) => (
            <ProductDetailInsightKpiTile
              key={kpi.id}
              label={kpi.label}
              helpText={kpi.helpText}
              footer={kpi.footer}
              breakdown={kpi.breakdown}
              showValues={showInsightValues}
              isFetching={insightsFetching}
              skeleton={kpiSkeleton}
              numericValue={kpi.numericValue}
              value={kpi.value}
              selectable={kpi.selectable}
              selected={kpi.selected}
              accentColor={kpi.accentColor}
              onSelect={kpi.selectable ? () => onMetricClick(kpi.id) : undefined}
            />
          ))}
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
