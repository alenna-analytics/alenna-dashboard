import { Pencil } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { cn } from '@/lib/utils'

import { ProductDetailChannelsTable } from './product-detail-channels-table'
import { ProductCostOverTimeChart } from './product-cost-over-time-chart'
import type { ProductCostPriceChartData } from './product-cost-chart-points'

const NUM = 'font-numeric tabular-nums'

type ProductDetailSectionsProps = {
  detail: ProductDetailApi
  t: (key: ShellStringKey) => string
  baseCurrency: string
  bigCostFormatted: string
  updatedBadge: string
  effectiveSinceLabel: string
  avgHistory: number | null
  chartData: ProductCostPriceChartData
  costAmountWithBaseCode: (formatted: string, baseCurrency: string, codeClassName: string) => React.ReactNode
  fmtBase: (value: number) => string
  insightStart: string
  insightEnd: string
  setInsightStart: (value: string) => void
  setInsightEnd: (value: string) => void
  onInsightRangeClear: () => void
  pickerStrings: DateRangePickerStrings
  showInsightValues: boolean
  insightKpi: (value: React.ReactNode) => React.ReactNode
  isFetching: boolean
  onEditCost: () => void
}

export function ProductDetailSections({
  detail,
  t,
  baseCurrency,
  bigCostFormatted,
  updatedBadge,
  effectiveSinceLabel,
  avgHistory,
  chartData,
  costAmountWithBaseCode,
  fmtBase,
  insightStart,
  insightEnd,
  setInsightStart,
  setInsightEnd,
  onInsightRangeClear,
  pickerStrings,
  showInsightValues,
  insightKpi,
  isFetching,
  onEditCost,
}: ProductDetailSectionsProps) {
  const kpiClass = (hasValue: boolean) =>
    cn(
      'text-lg font-semibold sm:text-xl',
      hasValue ? 'text-text-primary' : 'text-text-tertiary',
      NUM,
    )

  const insightKpis = [
    {
      label: t('productsDetailKpiSales'),
      value: insightKpi(
        costAmountWithBaseCode(fmtBase(detail.period_sales), baseCurrency, 'text-xs'),
      ),
    },
    {
      label: t('productsDetailKpiOrders'),
      value: insightKpi(String(detail.period_orders)),
    },
    {
      label: t('productsDetailKpiUnitsSold'),
      value: insightKpi(String(detail.period_units_sold)),
    },
    {
      label: t('productsDetailKpiCogsTotal'),
      value: insightKpi(
        costAmountWithBaseCode(fmtBase(detail.period_cogs), baseCurrency, 'text-xs'),
      ),
    },
  ]

  return (
    <>
      {detail.has_listing_currency_mismatch ? (
        <Card size="sm" variant="solid">
          <CardContent className="py-3 text-xs text-text-secondary">
            {t('productsDetailListingCurrencyCallout')}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-text-primary">
            {t('productsDetailSectionProductConfigTitle')}
          </h2>
          <Button type="button" variant="outline" size="default" onClick={onEditCost}>
            <Pencil className="size-3.5" />
            {t('productsDetailEditAria')}
          </Button>
        </div>

        <Card className='p-0 border-none shadow-none hover:shadow-none'>
          <CardContent className="grid gap-4 lg:grid-cols-3 lg:items-stretch p-0">
            <div className="flex flex-col gap-3 lg:col-span-1">
              <Card size="sm" className="flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-text-secondary">
                    {t('productsDetailKpiCurrentCost')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-0">
                  <p className={cn('text-2xl font-semibold text-text-primary sm:text-3xl', NUM)}>
                    {costAmountWithBaseCode(bigCostFormatted, baseCurrency, 'text-sm sm:text-base')}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {t('productsDetailEffectiveSince')}{' '}
                    <span className={cn('font-medium text-text-secondary', NUM)}>{effectiveSinceLabel}</span>
                  </p>
                  <Badge variant="info" className={cn('font-normal', NUM)}>
                    {updatedBadge}
                  </Badge>
                </CardContent>
              </Card>
              <Card size="sm" className="flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-text-secondary">
                    {t('productsDetailKpiAvgCost')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <p className={cn('text-2xl font-semibold text-text-primary sm:text-3xl', NUM)}>
                    {costAmountWithBaseCode(
                      avgHistory != null ? fmtBase(avgHistory) : '—',
                      baseCurrency,
                      'text-sm sm:text-base',
                    )}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {t('productsDetailLastSyncedLabel')}{' '}
                    <span className={cn('font-medium text-text-secondary', NUM)}>
                      {new Date(detail.updated_at).toLocaleString()}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="flex min-w-0 flex-col lg:col-span-2">
              <p className="mb-2 text-xs font-medium text-text-secondary">
                {t('productsDetailCostVsPriceOverTimeTitle')}
              </p>
              <div className="min-h-64 flex-1">
                <ProductCostOverTimeChart data={chartData.points} series={chartData.series} t={t} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='p-0 border-none shadow-none hover:shadow-none rounded-none'>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between p-0">
          <div className="space-y-1">
            <CardTitle className='text-xl'>{t('productsDetailSectionInsightsTitle')}</CardTitle>
            <CardDescription className="text-xs">{t('productsDetailSectionInsightsDescription')}</CardDescription>
          </div>
          <DateRangePicker
            strings={pickerStrings}
            startValue={insightStart}
            endValue={insightEnd}
            onStartChange={(v) => v && setInsightStart(v)}
            onEndChange={(v) => v && setInsightEnd(v)}
            filterLabel={t('filterDateTimeLabel')}
            clearAriaLabel={t('filterClear')}
            onClear={onInsightRangeClear}
            className="w-full max-w-md shrink-0"
          />
        </CardHeader>
        <CardContent className='p-0'>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {insightKpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-md border border-border-subtle bg-muted/20 px-3 py-2.5"
              >
                <p className="text-xs font-medium text-text-secondary">{kpi.label}</p>
                <p className={kpiClass(showInsightValues)}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className='p-0 border-none shadow-none hover:shadow-none rounded-none'>
        <CardHeader className='p-0'>
          <CardTitle className='text-md'>{t('productsDetailSectionChannelsTitle')}</CardTitle>
          <CardDescription className="text-xs">{t('productsDetailSectionChannelsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <ProductDetailChannelsTable
            listings={detail.listings}
            isLoading={false}
            isFetching={isFetching}
            t={t}
            fmtBase={fmtBase}
            emptyContent={
              <p className="py-8 text-center text-sm text-text-tertiary">{t('productsDetailChannelsEmpty')}</p>
            }
          />
        </CardContent>
      </Card>
    </>
  )
}
