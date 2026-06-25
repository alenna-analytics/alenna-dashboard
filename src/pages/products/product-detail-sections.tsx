import { useCallback, type ReactNode } from 'react'

import { useSalesMetricBasis } from '@/hooks/use-sales-metric-basis'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  productDetailProfitValue,
  productDetailSalesValue,
  productDetailUnitsValue,
  productPlatformSalesValue,
  productPlatformUnitsValue,
  productProfitHelpKey,
  productSalesHelpKey,
  profitLabelKey,
  salesLabelKey,
  unitsLabelKey,
} from '@/lib/sales-metric-basis'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { SalesMetricBasisToggle } from '@/ui/sales-metric-basis-toggle'
import { Skeleton } from '@/ui/skeleton'
import { ProductDetailChannelsTable } from './product-detail-channels-table'
import { ProductDetailVariantsTable } from './product-detail-variants-table'
import { ProductDetailConfigSection } from './product-detail-config-section'
import type { ProductCostPriceChartData } from './product-cost-chart-points'
import { formatInventoryDays } from './product-detail-format-inventory-days'
import { ProductDetailInsightKpiTile } from './product-detail-insight-kpi-tile'
import { ProductDetailKpiPlatformBreakdown } from './product-detail-kpi-platform-breakdown'
import { ProductDetailWeeklyNetSalesChart } from './product-detail-weekly-net-sales-chart'

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
  onOpenVariantCostEditor: (productId: string) => void
  dateLocale: string
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
  onOpenVariantCostEditor,
  dateLocale,
}: ProductDetailSectionsProps) {
  const [salesMetricBasis, setSalesMetricBasis] = useSalesMetricBasis()
  const hasVariants = (detail.variants?.length ?? 0) > 0
  const isVariantChild = Boolean(detail.parent_product_id)

  const weekLabelFor = useCallback(
    (weekStart: string) => {
      const d = new Date(`${weekStart}T12:00:00`)
      return d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })
    },
    [dateLocale],
  )

  const weeklyChartSubtitle = isVariantChild
    ? t('productsDetailWeeklyNetSalesSubtitleVariant')
    : hasVariants
      ? t('productsDetailWeeklyNetSalesSubtitleParent')
      : t('productsDetailWeeklyNetSalesSubtitle')

  const kpiSkeleton = <Skeleton className="mt-0.5 h-6 w-24 max-w-full" aria-hidden />

  const periodByPlatform = detail.period_by_platform ?? []

  const platformSalesBreakdown =
    periodByPlatform.length > 0 ? (
      <ProductDetailKpiPlatformBreakdown
        rows={periodByPlatform}
        t={t}
        formatValue={(row) => fmtBase(productPlatformSalesValue(row, salesMetricBasis))}
      />
    ) : undefined

  const platformUnitsBreakdown =
    periodByPlatform.length > 0 ? (
      <ProductDetailKpiPlatformBreakdown
        rows={periodByPlatform}
        t={t}
        formatValue={(row) =>
          productPlatformUnitsValue(row, salesMetricBasis).toLocaleString()
        }
      />
    ) : undefined

  const salesValue = productDetailSalesValue(detail, salesMetricBasis)
  const profitValue = productDetailProfitValue(detail, salesMetricBasis)
  const unitsValue = productDetailUnitsValue(detail, salesMetricBasis)

  const insightKpis = [
    {
      key: 'sales',
      label: t(salesLabelKey(salesMetricBasis)),
      helpText: t(productSalesHelpKey(salesMetricBasis)),
      value: insightKpi(
        costAmountWithBaseCode(fmtBase(salesValue), baseCurrency, 'text-xs'),
      ),
      breakdown: platformSalesBreakdown,
    },
    {
      key: 'profit',
      label: t(profitLabelKey(salesMetricBasis)),
      helpText: t(productProfitHelpKey(salesMetricBasis)),
      value: insightKpi(
        costAmountWithBaseCode(fmtBase(profitValue), baseCurrency, 'text-xs'),
      ),
    },
    {
      key: 'units',
      label: t(unitsLabelKey(salesMetricBasis)),
      value: insightKpi(unitsValue.toLocaleString()),
      breakdown: platformUnitsBreakdown,
    },
    {
      key: 'margin',
      label: t('productsDetailKpiContributionMarginPct'),
      helpText: t('productsDetailKpiContributionMarginPctHelp'),
      value: insightKpi(`${Number(detail.gross_margin_pct).toFixed(1)}%`),
    },
    {
      key: 'inventory-days',
      label: t('productsDetailKpiInventoryDays'),
      helpText: t('productsDetailKpiInventoryDaysHelp'),
      footer: t('productsDetailKpiInventoryDaysWindow'),
      value: insightKpi(formatInventoryDays(detail, t)),
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
          <SalesMetricBasisToggle
            basis={salesMetricBasis}
            onBasisChange={setSalesMetricBasis}
            t={t}
            className="mb-3"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {insightKpis.map((kpi) => (
              <ProductDetailInsightKpiTile
                key={kpi.key}
                label={kpi.label}
                helpText={kpi.helpText}
                footer={kpi.footer}
                breakdown={kpi.breakdown}
                showValues={showInsightValues}
                isFetching={insightsFetching}
                skeleton={kpiSkeleton}
                value={kpi.value}
              />
            ))}
          </div>
          <div className="mt-4 border-t border-border-subtle/60 pt-4">
            <p className="text-sm font-semibold text-text-primary">
              {t('productsDetailWeeklyNetSalesTitle')}
            </p>
            <p className="mb-3 text-xs text-text-secondary">
              {weeklyChartSubtitle}
            </p>
            <ProductDetailWeeklyNetSalesChart
              points={detail.weekly_net_sales ?? []}
              weekLabelFor={weekLabelFor}
              formatValue={fmtBase}
              ariaLabel={t('productsDetailWeeklyNetSalesAria')}
              tooltipLabels={{
                week: t('productsDetailWeeklyNetSalesTooltipWeek'),
                sales: t('productsDetailWeeklyNetSalesTooltipSales'),
              }}
            />
          </div>
        </CardContent>
      </Card>

      {hasVariants ? (
        <ProductDetailVariantsTable
          variants={detail.variants}
          t={t}
          fmtBase={fmtBase}
          onOpenCostEditor={onOpenVariantCostEditor}
        />
      ) : (
        <Card
          id="product-channels-table"
          className="scroll-mt-24 rounded-none border-none p-0 shadow-none hover:shadow-none"
        >
          <CardHeader className="p-0">
            <CardTitle className="text-xl">{t('productsDetailSectionChannelsTitle')}</CardTitle>
            <CardDescription className="text-xs">
              {t('productsDetailSectionChannelsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ProductDetailChannelsTable
              listings={detail.listings}
              isLoading={false}
              isFetching={false}
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
