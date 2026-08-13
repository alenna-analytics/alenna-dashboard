import type { ReactNode } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { EmptyState } from '@/ui/empty-state'
import type { DateRangePickerStrings } from '@/ui/date-range-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import { ProductDetailAnalyticsSection } from './product-detail-analytics-section'
import { ProductDetailChannelsTable } from './product-detail-channels-table'
import { ProductDetailPlatformPaymentSection } from './product-detail-platform-payment-section'
import { ProductDetailVariantsTable } from './product-detail-variants-table'
import { ProductDetailConfigSection } from './product-detail-config-section'
import type { ProductCostPriceChartData } from './product-cost-chart-points'

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
  const showVariantsTab = hasVariants
  const showCogsTab = !hasVariants
  const periodLabel =
    detail.period_start && detail.period_end
      ? `${detail.period_start} — ${detail.period_end}`
      : null

  return (
    <div className="flex flex-col gap-4">
      {detail.has_listing_currency_mismatch ? (
        <Card size="sm" variant="solid">
          <CardContent className="py-3 text-xs text-text-secondary">
            {t('productsDetailListingCurrencyCallout')}
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="analytics">
        <TabsList variant="line">
          <TabsTrigger value="analytics">{t('productsDetailTabAnalytics')}</TabsTrigger>
          {showVariantsTab ? (
            <TabsTrigger value="variants">{t('productsDetailTabVariants')}</TabsTrigger>
          ) : null}
          {showCogsTab ? (
            <TabsTrigger value="cogs">{t('productsDetailTabCogs')}</TabsTrigger>
          ) : null}
          <TabsTrigger value="platform-payment">{t('productsDetailTabPlatformPayment')}</TabsTrigger>
        </TabsList>

        <div className="relative mt-6 grid w-full grid-cols-1 overflow-hidden">
        <TabsContent value="analytics">
          <div className="flex flex-col gap-8">
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
              showSectionTitle={false}
            />

            {!hasVariants ? (
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
                <CardContent className="p-0 pt-4">
                  <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                    <ProductDetailChannelsTable
                      listings={detail.listings}
                      isLoading={false}
                      isFetching={insightsFetching}
                      t={t}
                      fmtBase={fmtBase}
                      periodLabel={periodLabel}
                      emptyContent={
                        <EmptyState title={t('productsDetailChannelsEmpty')} />
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>

        {showVariantsTab ? (
          <TabsContent value="variants">
            <ProductDetailVariantsTable
              variants={detail.variants}
              t={t}
              fmtBase={fmtBase}
              onOpenCostEditor={onOpenVariantCostEditor}
              showSectionTitle={false}
            />
          </TabsContent>
        ) : null}

        {showCogsTab ? (
          <TabsContent value="cogs">
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
              showSectionTitle={false}
            />
          </TabsContent>
        ) : null}

        <TabsContent value="platform-payment">
          <ProductDetailPlatformPaymentSection
            detail={detail}
            isFetching={insightsFetching}
            t={t}
            fmtBase={fmtBase}
            insightStart={insightStart}
            insightEnd={insightEnd}
            setInsightStart={setInsightStart}
            setInsightEnd={setInsightEnd}
            pickerStrings={pickerStrings}
          />
        </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
