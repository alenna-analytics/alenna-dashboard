import { useCallback, useMemo, useState } from 'react'
import { enUS } from 'date-fns/locale/en-US'
import { es as esLocale } from 'date-fns/locale/es'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { SalesMetricBasis } from '@/lib/sales-metric-basis'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'
import { cn } from '@/lib/utils'
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { HomeV2SalesTrendChart } from '@/pages/dashboard/home-v2-sales-trend-chart'
import {
  homeV2TrendMetricLabel,
  resolveHomeV2TrendMetric,
  type HomeV2TrendMetricId,
} from '@/pages/dashboard/home-v2-trend-metrics'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'

const PRODUCT_TREND_METRIC_IDS: HomeV2TrendMetricId[] = [
  'net-sales',
  'net-profit',
  'units',
  'orders',
]

type ProductDetailMetricsTrendSectionProps = {
  productId: string
  insightStart: string
  insightEnd: string
  salesMetricBasis: SalesMetricBasis
  fmtBase: (value: number) => string
  baseCurrency: string
  lang: string
  t: (key: ShellStringKey) => string
}

function toggleTrendMetric(
  selected: HomeV2TrendMetricId[],
  id: HomeV2TrendMetricId,
): HomeV2TrendMetricId[] {
  if (selected.includes(id)) {
    const next = selected.filter((m) => m !== id)
    return next.length > 0 ? next : selected
  }
  if (selected.length >= 2) return [selected[1], id]
  return [...selected, id]
}

export function ProductDetailMetricsTrendSection({
  productId,
  insightStart,
  insightEnd,
  salesMetricBasis,
  fmtBase,
  baseCurrency,
  lang,
  t,
}: ProductDetailMetricsTrendSectionProps) {
  const [granularity, setGranularity] = useState<RevenueSeriesGranularity>('week')
  const [selectedMetrics, setSelectedMetrics] = useState<HomeV2TrendMetricId[]>([
    'net-sales',
    'net-profit',
  ])

  const dateLocale = lang === 'en' ? enUS : esLocale

  const trendMetricContext = useMemo(
    () => ({
      salesMetricBasis,
      productMode: true,
      convertValue: (value: number) => value,
      profitSparklineScale: 1,
      contributionSparklineScale: 1,
      ebitdaSparklineScale: 1,
    }),
    [salesMetricBasis],
  )

  const primaryMetric = useMemo(
    () =>
      resolveHomeV2TrendMetric(
        selectedMetrics[0] ?? 'net-sales',
        trendMetricContext,
        'net-sales',
      ),
    [selectedMetrics, trendMetricContext],
  )
  const secondaryMetric = useMemo(
    () =>
      resolveHomeV2TrendMetric(
        selectedMetrics[1] ?? 'net-profit',
        trendMetricContext,
        'net-profit',
      ),
    [selectedMetrics, trendMetricContext],
  )

  const { data: series, isError } = useMonthlyRevenueSeries({
    productIds: [productId],
    startDate: insightStart,
    endDate: insightEnd,
    granularity,
    enabled: Boolean(productId && insightStart && insightEnd),
  })

  const onMetricCardClick = useCallback((id: HomeV2TrendMetricId) => {
    setSelectedMetrics((prev) => toggleTrendMetric(prev, id))
  }, [])

  return (
    <Card className="rounded-none border-none p-0 shadow-none hover:shadow-none">
      <CardHeader className="flex flex-col gap-4 p-0 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl">{t('homeMetricsTrendTitle')}</CardTitle>
          <CardDescription className="text-xs">
            {t('productsDetailMetricsTrendDescription')}
          </CardDescription>
        </div>
        <ChartGranularityFilter value={granularity} onChange={setGranularity} t={t} />
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRODUCT_TREND_METRIC_IDS.map((id) => {
            const active = selectedMetrics.includes(id)
            const isPrimary = selectedMetrics[0] === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onMetricCardClick(id)}
                className={cn(
                  'rounded-md border px-3 py-2.5 text-left transition-colors',
                  active
                    ? 'border-[var(--country-green-base)] bg-[var(--country-green-base)]/10'
                    : 'border-border-subtle bg-muted/20 hover:bg-muted/35',
                )}
                aria-pressed={active}
              >
                <p className="text-xs font-medium text-text-secondary">
                  {homeV2TrendMetricLabel(id, trendMetricContext, t)}
                </p>
                {active ? (
                  <p className="mt-0.5 text-[0.65rem] text-text-tertiary">
                    {isPrimary
                      ? t('productsDetailMetricsTrendPrimary')
                      : t('productsDetailMetricsTrendSecondary')}
                  </p>
                ) : null}
              </button>
            )
          })}
        </div>
        {isError ? (
          <p className="text-sm text-destructive">{t('reportsMonthlyLoadError')}</p>
        ) : (
          <HomeV2SalesTrendChart
            startDate={insightStart}
            endDate={insightEnd}
            granularity={granularity}
            rows={series?.months ?? []}
            currency={baseCurrency}
            formatValue={fmtBase}
            dateLocale={dateLocale}
            primaryMetric={primaryMetric}
            secondaryMetric={secondaryMetric}
            metricContext={trendMetricContext}
            t={t}
          />
        )}
      </CardContent>
    </Card>
  )
}
