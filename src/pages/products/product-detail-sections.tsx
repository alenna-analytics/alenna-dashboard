import type { ReactNode } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { Skeleton } from '@/ui/skeleton'
import { cn } from '@/lib/utils'

import { ProductDetailChannelsTable } from './product-detail-channels-table'
import { ProductDetailVariantsTable } from './product-detail-variants-table'
import { ProductDetailConfigSection } from './product-detail-config-section'
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
  costAmountWithBaseCode: (formatted: string, baseCurrency: string, codeClassName: string) => ReactNode
  fmtBase: (value: number) => string
  insightStart: string
  insightEnd: string
  setInsightStart: (value: string) => void
  setInsightEnd: (value: string) => void
  onInsightRangeClear: () => void
  pickerStrings: DateRangePickerStrings
  showInsightValues: boolean
  insightKpi: (value: ReactNode) => ReactNode
  insightsFetching: boolean
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
  insightsFetching,
  onEditCost,
}: ProductDetailSectionsProps) {
  const hasVariants = (detail.variants?.length ?? 0) > 0

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
    <div className="flex flex-col gap-8">
      {detail.has_listing_currency_mismatch ? (
        <Card size="sm" variant="solid">
          <CardContent className="py-3 text-xs text-text-secondary">
            {t('productsDetailListingCurrencyCallout')}
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-none border-none p-0 shadow-none hover:shadow-none">
        <CardHeader className="flex flex-col gap-4 p-0 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{t('productsDetailSectionInsightsTitle')}</CardTitle>
            <CardDescription className="text-xs">
              {t('productsDetailSectionInsightsDescription')}
            </CardDescription>
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
        <CardContent className="p-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {insightKpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-md border border-border-subtle bg-muted/20 px-3 py-2.5"
              >
                <p className="text-xs font-medium text-text-secondary">{kpi.label}</p>
                <p className={kpiClass(showInsightValues)}>
                  {insightsFetching ? (
                    <Skeleton className="mt-0.5 h-6 w-24 max-w-full" aria-hidden />
                  ) : (
                    kpi.value
                  )}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {hasVariants ? (
        <ProductDetailVariantsTable
          detail={detail}
          t={t}
          baseCurrency={baseCurrency}
          fmtBase={fmtBase}
        />
      ) : (
        <Card
          id="product-channels-table"
          className="scroll-mt-24 rounded-none border-none p-0 shadow-none hover:shadow-none"
        >
          <CardHeader className="p-0">
            <CardTitle className="text-md">{t('productsDetailSectionChannelsTitle')}</CardTitle>
            <CardDescription className="text-xs">
              {t('productsDetailSectionChannelsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ProductDetailChannelsTable
              listings={detail.listings}
              isLoading={false}
              isFetching={insightsFetching}
              t={t}
              fmtBase={fmtBase}
              emptyContent={
                <p className="py-8 text-center text-sm text-text-tertiary">
                  {t('productsDetailChannelsEmpty')}
                </p>
              }
            />
          </CardContent>
        </Card>
      )}

      {!hasVariants ? (
        <ProductDetailConfigSection
          t={t}
          baseCurrency={baseCurrency}
          bigCostFormatted={bigCostFormatted}
          updatedBadge={updatedBadge}
          effectiveSinceLabel={effectiveSinceLabel}
          avgHistory={avgHistory}
          chartData={chartData}
          costAmountWithBaseCode={costAmountWithBaseCode}
          fmtBase={fmtBase}
          updatedAtIso={detail.updated_at}
          onEditCost={onEditCost}
        />
      ) : null}
    </div>
  )
}
