import { useState, type ReactNode } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import type { DateRangePickerStrings } from '@/ui/date-range-picker'
import { Card, CardContent } from '@/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import { ProductDetailAnalysisView } from './product-detail-analysis-view'
import { PRODUCT_DETAIL_ALL_CHANNELS } from './product-detail-analytics-filter'
import { ProductDetailRentabilidadView } from './product-detail-rentabilidad-view'
import { ProductDetailVariantsTable } from './product-detail-variants-table'
import { ProductDetailConfigSection } from './product-detail-config-section'
import { ProductDetailRelatedSection } from './product-detail-related-section'
import type { ProductCostPriceChartData } from './product-cost-chart-points'

type ProductDetailTabId =
  | 'analytics'
  | 'variants'
  | 'channels'
  | 'cogs'
  | 'related'
  | 'platform-payment'

function isProductDetailTabId(value: string | number | null): value is ProductDetailTabId {
  return (
    value === 'analytics' ||
    value === 'variants' ||
    value === 'channels' ||
    value === 'cogs' ||
    value === 'related' ||
    value === 'platform-payment'
  )
}

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
  insightStart,
  insightEnd,
  setInsightStart,
  setInsightEnd,
  pickerStrings,
  insightsFetching,
  onEditCost,
  onOpenVariantCostEditor,
}: ProductDetailSectionsProps) {
  const hasVariants = (detail.variants?.length ?? 0) > 0
  const showVariantsTab = hasVariants
  const showCogsTab = !hasVariants
  const showRelatedTab = Boolean(detail.link_group_id)
  const [tab, setTab] = useState<ProductDetailTabId>('analytics')
  const [channelFilter, setChannelFilter] = useState(PRODUCT_DETAIL_ALL_CHANNELS)
  const visibleTabs: ProductDetailTabId[] = [
    'analytics',
    'platform-payment',
    ...(showVariantsTab ? (['variants'] as const) : []),
    ...(showCogsTab ? (['cogs'] as const) : []),
    ...(showRelatedTab ? (['related'] as const) : []),
  ]
  const activeTab = visibleTabs.includes(tab) ? tab : 'analytics'

  return (
    <div className="flex flex-col gap-4">
      {detail.has_listing_currency_mismatch ? (
        <Card size="sm" variant="solid">
          <CardContent className="py-3 text-xs text-text-secondary">
            {t('productsDetailListingCurrencyCallout')}
          </CardContent>
        </Card>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (isProductDetailTabId(value)) setTab(value)
        }}
      >
        <TabsList variant="line">
          <TabsTrigger value="analytics">{t('productsDetailTabAnalytics')}</TabsTrigger>
          <TabsTrigger value="platform-payment">{t('productsDetailTabPlatformPayment')}</TabsTrigger>
          {showVariantsTab ? (
            <TabsTrigger value="variants">{t('productsDetailTabVariants')}</TabsTrigger>
          ) : null}
          {showCogsTab ? (
            <TabsTrigger value="cogs">{t('productsDetailTabCogs')}</TabsTrigger>
          ) : null}
          {showRelatedTab ? (
            <TabsTrigger value="related">{t('productsDetailTabRelated')}</TabsTrigger>
          ) : null}
        </TabsList>

        <div className="relative mt-6 grid w-full grid-cols-1 overflow-hidden">
        <TabsContent value="analytics">
          <div className="flex flex-col gap-8">
            <ProductDetailAnalysisView
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
              channelFilter={channelFilter}
              setChannelFilter={setChannelFilter}
              pickerStrings={pickerStrings}
              insightsFetching={insightsFetching}
            />
          </div>
        </TabsContent>

        <TabsContent value="platform-payment">
          <ProductDetailRentabilidadView
            productId={productId}
            lang={lang}
            detail={detail}
            t={t}
            baseCurrency={baseCurrency}
            fmtCard={fmtCard}
            insightStart={insightStart}
            insightEnd={insightEnd}
            setInsightStart={setInsightStart}
            setInsightEnd={setInsightEnd}
            channelFilter={channelFilter}
            setChannelFilter={setChannelFilter}
            pickerStrings={pickerStrings}
            insightsFetching={insightsFetching}
          />
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
        </div>
      </Tabs>
    </div>
  )
}
