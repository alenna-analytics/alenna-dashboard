import type { ReactNode } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import type { DateRangePickerStrings } from '@/ui/date-range-picker'
import { ProductDetailAnalyticsSection } from './product-detail-analytics-section'
import { ProductDetailChannelsTable } from './product-detail-channels-table'
import { ProductDetailVariantsTable } from './product-detail-variants-table'
import { ProductDetailConfigSection } from './product-detail-config-section'
import type { ProductCostPriceChartData } from './product-cost-chart-points'
import { ProductDetailSettlementSection } from './product-detail-settlement-section'

type ProductDetailSectionsProps = {
  productId: string
  lang: string
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
  pickerStrings: DateRangePickerStrings
  showInsightValues: boolean
  insightKpi: (value: ReactNode) => ReactNode
  insightsFetching: boolean
  onEditCost: () => void
  onOpenVariantCostEditor: (productId: string) => void
}

export function ProductDetailSections({
  productId,
  lang,
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
  pickerStrings,
  showInsightValues,
  insightKpi,
  insightsFetching,
  onEditCost,
  onOpenVariantCostEditor,
}: ProductDetailSectionsProps) {
  const hasVariants = (detail.variants?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-8">
      {detail.has_listing_currency_mismatch ? (
        <Card size="sm" variant="solid">
          <CardContent className="py-3 text-xs text-text-secondary">
            {t('productsDetailListingCurrencyCallout')}
          </CardContent>
        </Card>
      ) : null}

      <ProductDetailAnalyticsSection
        productId={productId}
        lang={lang}
        detail={detail}
        t={t}
        baseCurrency={baseCurrency}
        fmtBase={fmtBase}
        costAmountWithBaseCode={costAmountWithBaseCode}
        insightStart={insightStart}
        insightEnd={insightEnd}
        setInsightStart={setInsightStart}
        setInsightEnd={setInsightEnd}
        pickerStrings={pickerStrings}
        showInsightValues={showInsightValues}
        insightKpi={insightKpi}
        insightsFetching={insightsFetching}
      />

      <ProductDetailSettlementSection
        detail={detail}
        t={t}
        fmtBase={fmtBase}
        showValues={showInsightValues}
        isFetching={insightsFetching}
        costAmountWithBaseCode={costAmountWithBaseCode}
        baseCurrency={baseCurrency}
      />

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
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
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
            </div>
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
