import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { enUS } from 'date-fns/locale/en-US'
import { es as esLocale } from 'date-fns/locale/es'

import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'
import { ChannelsSettlementTable } from '@/pages/channels/channels-settlement-table'
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { AppSeriesChartViewToggle } from '@/pages/dashboard/app-chart-view-toggle'
import { buildSettlementWaterfallSegments } from '@/pages/reports/settlement-waterfall-segments'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { EmptyState } from '@/ui/empty-state'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import type { FilterOption } from '@/ui/filters/types'
import { Skeleton } from '@/ui/skeleton'
import type { SeriesChartView } from '@/ui/chart-view-toggle'

import {
  connectionIdsForPlatform,
  PRODUCT_DETAIL_ALL_CHANNELS,
} from './product-detail-analytics-filter'
import { ProductDetailInsightKpiTile } from './product-detail-insight-kpi-tile'
import { ProductDetailInventoryByChannel } from './product-detail-inventory-by-channel'
import { ProductDetailTrendChart } from './product-detail-trend-chart'
import { ProductDetailWaterfallBlock } from './product-detail-waterfall-block'
import {
  platformSettlementFilterOptions,
  resolveProductPlatformSettlement,
} from './product-detail-settlement-by-platform'
import {
  isProductDetailTrendMetricChartable,
  PRODUCT_DETAIL_METRIC_COLORS,
  toggleProductDetailTrendMetric,
  type ProductDetailTrendMetricId,
} from './product-detail-trend-metrics'
import { productPlatformLabel } from './product-platform-label'
import {
  productSettlementByPlatformMetrics,
  settlementPlatformsFromProduct,
} from './product-settlement-channel-metrics'

type VistaBKpiKey =
  | 'gross-sales'
  | 'net-sales'
  | 'payout'
  | 'payout-pct'
  | 'discounts'
  | 'returns'
  | 'fees'
  | 'shipping'

const VISTA_B_TREND_METRIC: Partial<Record<VistaBKpiKey, ProductDetailTrendMetricId>> = {
  'gross-sales': 'gross-sales',
  'net-sales': 'net-sales',
}

type ProductDetailPlatformPaymentSectionProps = {
  productId: string
  lang: string
  detail: ProductDetailApi
  isFetching: boolean
  t: (key: ShellStringKey) => string
  fmtBase: (value: number) => string
  fmtCard: (value: number) => string
  currencyCode: string
  insightStart: string
  insightEnd: string
  setInsightStart: (value: string) => void
  setInsightEnd: (value: string) => void
  pickerStrings: DateRangePickerStrings
  showInsightValues?: boolean
  insightKpi?: (value: ReactNode) => ReactNode
}

export function ProductDetailPlatformPaymentSection({
  productId,
  lang,
  detail,
  isFetching,
  t,
  fmtBase,
  fmtCard,
  currencyCode,
  insightStart,
  insightEnd,
  setInsightStart,
  setInsightEnd,
  pickerStrings,
  showInsightValues = true,
  insightKpi = (value) => value,
}: ProductDetailPlatformPaymentSectionProps) {
  const [granularity, setGranularity] = useState<RevenueSeriesGranularity>('week')
  const [trendChartType, setTrendChartType] = useState<SeriesChartView>('line')
  const [selectedMetrics, setSelectedMetrics] = useState<ProductDetailTrendMetricId[]>([
    'net-sales',
  ])
  const [channelFilter, setChannelFilter] = useState(PRODUCT_DETAIL_ALL_CHANNELS)
  const connectionsQuery = usePlatformConnectionsQuery()

  const platformSlugs = useMemo(
    () =>
      platformSettlementFilterOptions(detail.period_settlement_by_platform, detail.listings),
    [detail.period_settlement_by_platform, detail.listings],
  )

  const activeChannel =
    channelFilter === PRODUCT_DETAIL_ALL_CHANNELS || platformSlugs.includes(channelFilter)
      ? channelFilter
      : PRODUCT_DETAIL_ALL_CHANNELS

  const channelOptions = useMemo((): FilterOption[] => {
    const allOption: FilterOption = {
      value: PRODUCT_DETAIL_ALL_CHANNELS,
      label: t('homeFilterChannelsAll'),
    }
    const platformOptions = platformSlugs.map((slug) => {
      const sourceSlug =
        detail.period_settlement_by_platform.find(
          (row) => row.platform.trim().toLowerCase() === slug,
        )?.platform ??
        detail.listings.find((listing) => listing.platform.trim().toLowerCase() === slug)
          ?.platform ??
        slug
      return {
        value: slug,
        label: productPlatformLabel(sourceSlug, t),
      }
    })
    return [allOption, ...platformOptions]
  }, [detail.listings, detail.period_settlement_by_platform, platformSlugs, t])

  const settlement = useMemo(
    () =>
      resolveProductPlatformSettlement({
        channelFilter: activeChannel,
        periodSettlement: detail.period_settlement,
        periodSettlementByPlatform: detail.period_settlement_by_platform,
        listings: detail.listings,
      }),
    [
      activeChannel,
      detail.listings,
      detail.period_settlement,
      detail.period_settlement_by_platform,
    ],
  )

  const settlementSegments = useMemo(
    () =>
      settlement
        ? buildSettlementWaterfallSegments(settlement, t, { includeTaxWithholdings: false })
        : [],
    [settlement, t],
  )

  const chartConnectionIds = useMemo(
    () => connectionIdsForPlatform(connectionsQuery.data, activeChannel),
    [connectionsQuery.data, activeChannel],
  )

  const { data: series, isError } = useMonthlyRevenueSeries({
    productIds: [productId],
    connectionIds: chartConnectionIds,
    startDate: insightStart,
    endDate: insightEnd,
    granularity,
    enabled: Boolean(productId && insightStart && insightEnd),
  })

  const platforms = useMemo(() => settlementPlatformsFromProduct(detail, t), [detail, t])
  const settlementMetrics = useMemo(
    () => productSettlementByPlatformMetrics(detail, platforms),
    [detail, platforms],
  )

  const dateLocale = lang === 'en' ? enUS : esLocale
  const kpiSkeleton = <Skeleton className="mt-0.5 h-6 w-24 max-w-full" aria-hidden />

  const onVistaBClick = useCallback((key: VistaBKpiKey) => {
    const metricId = VISTA_B_TREND_METRIC[key]
    if (!metricId || !isProductDetailTrendMetricChartable(metricId)) return
    setSelectedMetrics((prev) => toggleProductDetailTrendMetric(prev, metricId))
  }, [])

  function vistaBTileProps(key: VistaBKpiKey) {
    const metricId = VISTA_B_TREND_METRIC[key]
    const selectable = Boolean(metricId && isProductDetailTrendMetricChartable(metricId))
    return {
      selectable,
      selected: Boolean(metricId && selectedMetrics.includes(metricId)),
      accentColor: metricId ? PRODUCT_DETAIL_METRIC_COLORS[metricId] : undefined,
      onSelect: selectable ? () => onVistaBClick(key) : undefined,
    }
  }

  if (!isFetching && !settlement) {
    return <EmptyState size="sm" icon="products" title={t('productsDetailPlatformPaymentEmpty')} />
  }

  const payoutPct =
    settlement && settlement.net_revenue > 0
      ? (settlement.estimated_payout / settlement.net_revenue) * 100
      : null

  const vistaBPrimary: Array<{
    key: VistaBKpiKey
    label: string
    helpText?: string
    value: ReactNode
    currencyCode?: string
    numericValue?: number
    ratePct?: number | null
  }> = settlement
    ? [
        {
          key: 'gross-sales',
          label: t('reportsGrossRevenue'),
          value: insightKpi(fmtCard(settlement.gross_revenue)),
          currencyCode,
          numericValue: settlement.gross_revenue,
        },
        {
          key: 'net-sales',
          label: t('productsDetailPlatformPaymentNetSales'),
          helpText: t('productsDetailPlatformPaymentGrossSalesHelp'),
          value: insightKpi(fmtCard(settlement.net_revenue)),
          currencyCode,
          numericValue: settlement.net_revenue,
        },
        {
          key: 'payout',
          label: t('productsDetailPlatformPaymentTotalPayout'),
          helpText: t('productsDetailPlatformPaymentTotalPayoutHelp'),
          value: insightKpi(fmtCard(settlement.estimated_payout)),
          currencyCode,
          numericValue: settlement.estimated_payout,
        },
        {
          key: 'payout-pct',
          label: t('productsDetailPlatformPaymentPayoutPct'),
          helpText: t('productsDetailPlatformPaymentPayoutPctHelp'),
          value: insightKpi(payoutPct == null ? '—' : `${payoutPct.toFixed(1)}%`),
        },
      ]
    : []

  const vistaBSecondary: Array<{
    key: VistaBKpiKey
    label: string
    value: ReactNode
    currencyCode?: string
    numericValue?: number
  }> = settlement
    ? [
        {
          key: 'discounts',
          label: t('settlementWfDiscounts'),
          value: insightKpi(fmtCard(settlement.discounts)),
          currencyCode,
          numericValue: settlement.discounts,
        },
        {
          key: 'returns',
          label: t('settlementWfReturns'),
          value: insightKpi(fmtCard(settlement.returns)),
          currencyCode,
          numericValue: settlement.returns,
        },
        {
          key: 'fees',
          label: t('settlementWfMarketplaceFees'),
          value: insightKpi(fmtCard(settlement.marketplace_fees)),
          currencyCode,
          numericValue: settlement.marketplace_fees,
        },
        {
          key: 'shipping',
          label: t('settlementWfShippingCharges'),
          value: insightKpi(fmtCard(settlement.shipping_charges)),
          currencyCode,
          numericValue: settlement.shipping_charges,
        },
      ]
    : []

  return (
    <div className="flex flex-col gap-8">
      <Card className="rounded-none border-none p-0 shadow-none hover:shadow-none">
        <CardHeader className="flex flex-col gap-3 p-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <DateRangePicker
              strings={pickerStrings}
              startValue={insightStart}
              endValue={insightEnd}
              onStartChange={(value) => value && setInsightStart(value)}
              onEndChange={(value) => value && setInsightEnd(value)}
              className="w-full max-w-md"
            />
            <FilterComboboxSingle
              label={t('homeFilterChannels')}
              options={channelOptions}
              value={activeChannel}
              onValueChange={setChannelFilter}
              searchPlaceholder={t('homeFilterChannelsSearch')}
              emptyLabel={t('homeFilterChannelsEmpty')}
              allowClear={false}
              triggerClassName="w-full sm:w-auto sm:min-w-[12rem]"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-0 pt-4">
          <div className="grid grid-cols-1 items-stretch gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {isFetching && !settlement
              ? Array.from({ length: 4 }).map((_, index) => (
                  <ProductDetailInsightKpiTile
                    key={`sk-p-${index}`}
                    label="—"
                    value=""
                    showValues={false}
                    isFetching
                    skeleton={kpiSkeleton}
                  />
                ))
              : vistaBPrimary.map((kpi) => (
                  <ProductDetailInsightKpiTile
                    key={kpi.key}
                    label={kpi.label}
                    helpText={kpi.helpText}
                    showValues={showInsightValues}
                    isFetching={isFetching}
                    skeleton={kpiSkeleton}
                    numericValue={kpi.numericValue}
                    currencyCode={kpi.currencyCode}
                    value={kpi.value}
                    {...vistaBTileProps(kpi.key)}
                  />
                ))}
          </div>
          <div className="grid grid-cols-1 items-stretch gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {isFetching && !settlement
              ? Array.from({ length: 4 }).map((_, index) => (
                  <ProductDetailInsightKpiTile
                    key={`sk-s-${index}`}
                    label="—"
                    value=""
                    showValues={false}
                    isFetching
                    skeleton={kpiSkeleton}
                  />
                ))
              : vistaBSecondary.map((kpi) => (
                  <ProductDetailInsightKpiTile
                    key={kpi.key}
                    label={kpi.label}
                    showValues={showInsightValues}
                    isFetching={isFetching}
                    skeleton={kpiSkeleton}
                    numericValue={kpi.numericValue}
                    currencyCode={kpi.currencyCode}
                    value={kpi.value}
                    {...vistaBTileProps(kpi.key)}
                  />
                ))}
          </div>
          <div className="flex justify-end gap-2">
            <ChartGranularityFilter value={granularity} onChange={setGranularity} t={t} />
            <AppSeriesChartViewToggle
              value={trendChartType}
              onChange={setTrendChartType}
              t={t}
            />
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

      {settlement ? (
        <ProductDetailWaterfallBlock
          title={t('productsDetailSettlementTitle')}
          description={t('reportsSectionSettlementSubtitle')}
          segments={settlementSegments}
          currency={detail.base_currency}
          grossRevenue={settlement.gross_revenue}
          t={t}
          finalBarCaption={t('reportsSettlementFinalHint')}
          isLoading={isFetching}
        />
      ) : (
        <Skeleton className="h-72 w-full" aria-hidden />
      )}

      {platforms.length > 0 ? (
        <ChannelsSettlementTable
          metrics={settlementMetrics}
          platforms={platforms}
          formatMoney={fmtBase}
          t={t}
          includeTaxWithholdings={false}
        />
      ) : null}

      <ProductDetailInventoryByChannel
        detail={detail}
        t={t}
        isFetching={isFetching}
      />
    </div>
  )
}
