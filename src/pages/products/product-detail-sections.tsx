import { useMemo, type ReactNode } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import { settingsDescriptionClassName } from '@/pages/configuration/settings-layout'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { EmptyState } from '@/ui/empty-state'
import type { DateRangePickerStrings } from '@/ui/date-range-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import { ProductDetailAnalyticsSection } from './product-detail-analytics-section'
import { ProductDetailChannelsTable } from './product-detail-channels-table'
import { ProductDetailPlatformPaymentSection } from './product-detail-platform-payment-section'
import { ProductDetailVariantsTable } from './product-detail-variants-table'
import { ProductDetailConfigSection } from './product-detail-config-section'
import { ProductDetailRelatedSection } from './product-detail-related-section'
import {
  buildProductPnlWaterfallSegments,
  productPnlWaterfallSourceFromDetail,
} from './product-detail-pnl-waterfall-segments'
import { ProductDetailWaterfallBlock } from './product-detail-waterfall-block'
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
  fmtCard: (value: number) => string
  displayCurrency: string
  insightStart: string
  insightEnd: string
  setInsightStart: (value: string) => void
  setInsightEnd: (value: string) => void
  pickerStrings: DateRangePickerStrings
  showInsightValues: boolean
  insightKpi: (value: ReactNode) => ReactNode
  insightsFetching: boolean
  onEditCost?: () => void
  onOpenVariantCostEditor?: (productId: string) => void
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
  fmtCard,
  displayCurrency,
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
  const showChannelsTab = !hasVariants
  const showCogsTab = !hasVariants
  const showRelatedTab = Boolean(detail.link_group_id)
  const periodLabel =
    detail.period_start && detail.period_end
      ? `${detail.period_start} — ${detail.period_end}`
      : null
  const pnlSegments = useMemo(
    () =>
      buildProductPnlWaterfallSegments(productPnlWaterfallSourceFromDetail(detail), t),
    [detail, t],
  )

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
          {showChannelsTab ? (
            <TabsTrigger value="channels">{t('productsDetailTabChannels')}</TabsTrigger>
          ) : null}
          {showCogsTab ? (
            <TabsTrigger value="cogs">{t('productsDetailTabCogs')}</TabsTrigger>
          ) : null}
          {showRelatedTab ? (
            <TabsTrigger value="related">{t('productsDetailTabRelated')}</TabsTrigger>
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
              fmtCard={fmtCard}
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

            <ProductDetailWaterfallBlock
              title={t('productsDetailPnlAnalyticsTitle')}
              description={t('productsDetailPnlAnalyticsDescription')}
              segments={pnlSegments}
              currency={baseCurrency}
              grossRevenue={detail.period_gross_sales}
              t={t}
              finalBarCaption={t('productsDetailPnlFinalHint')}
              isLoading={insightsFetching}
            />
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

        {showChannelsTab ? (
          <TabsContent value="channels">
            <Card
              id="product-channels-table"
              className="scroll-mt-24 rounded-none border-none p-0 shadow-none hover:shadow-none"
            >
              <CardHeader className="p-0">
                <p className={settingsDescriptionClassName}>
                  {t('productsDetailSectionChannelsDescription')}
                </p>
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
                      <EmptyState size="sm" icon="products" title={t('productsDetailChannelsEmpty')} />
                    }
                  />
                </div>
              </CardContent>
            </Card>
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
              fmtCard={fmtCard}
              updatedAtIso={detail.updated_at}
              onEditCost={onEditCost}
              showSectionTitle={false}
            />
          </TabsContent>
        ) : null}

        {showRelatedTab ? (
          <TabsContent value="related">
            <ProductDetailRelatedSection detail={detail} t={t} />
          </TabsContent>
        ) : null}

        <TabsContent value="platform-payment">
          <ProductDetailPlatformPaymentSection
            detail={detail}
            isFetching={insightsFetching}
            t={t}
            fmtBase={fmtBase}
            fmtCard={fmtCard}
            currencyCode={displayCurrency}
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
