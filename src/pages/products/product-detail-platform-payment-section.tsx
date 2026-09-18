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
import { useTaxRatesQuery } from '@/pages/configuration/tax-rates/use-tax-rates-queries'
import {
  computeShiftedPreviousPeriod,
  pctVersusPrevious,
} from '@/pages/reports/reports-ui-helpers'
import { buildSettlementWaterfallSegments } from '@/pages/reports/settlement-waterfall-segments'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { EmptyState } from '@/ui/empty-state'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import type { FilterOption } from '@/ui/filters/types'
import { Skeleton } from '@/ui/skeleton'
import type { SeriesChartView } from '@/ui/chart-view-toggle'

import { calendarYearToDateRange } from './calendar-year-to-date'
import {
  connectionIdsForPlatform,
  PRODUCT_DETAIL_ALL_CHANNELS,
} from './product-detail-analytics-filter'
import { ProductCobroTaxMatrix } from './product-cobro-tax-matrix'
import { ProductCobroTimingTable } from './product-cobro-timing-table'
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
  estimateSettlementTaxByPlatform,
  resolveRetainedSat,
  settlementWithEstimatedTax,
} from './product-pnl-tax-estimates'
import {
  productSettlementByPlatformMetrics,
  settlementPlatformsFromProduct,
} from './product-settlement-channel-metrics'
import { useProductDetailQuery } from './use-catalog-queries'

type VistaBKpiKey = 'net-sales' | 'retained-sat' | 'payout' | 'payout-pct'

const VISTA_B_TREND_METRIC: Partial<Record<VistaBKpiKey, ProductDetailTrendMetricId>> = {
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
  const taxRatesQuery = useTaxRatesQuery()

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

  const platforms = useMemo(() => settlementPlatformsFromProduct(detail, t), [detail, t])
  const settlementMetrics = useMemo(
    () => productSettlementByPlatformMetrics(detail, platforms),
    [detail, platforms],
  )

  const taxEstimates = useMemo(() => {
    const rates = taxRatesQuery.data?.settings
    if (!rates) return null
    return estimateSettlementTaxByPlatform(settlementMetrics, platforms, rates)
  }, [platforms, settlementMetrics, taxRatesQuery.data?.settings])

  const ytdRange = useMemo(() => calendarYearToDateRange(), [])
  const ytdDetailQuery = useProductDetailQuery(productId, {
    metricsStart: ytdRange.start,
    metricsEnd: ytdRange.end,
  })
  const yearWithheld = useMemo(() => {
    const rates = taxRatesQuery.data?.settings
    const ytdDetail = ytdDetailQuery.data
    if (!rates || !ytdDetail) return null
    const ytdPlatforms = settlementPlatformsFromProduct(ytdDetail, t)
    const ytdMetrics = productSettlementByPlatformMetrics(ytdDetail, ytdPlatforms)
    return estimateSettlementTaxByPlatform(ytdMetrics, ytdPlatforms, rates).total
      .withholding_total
  }, [t, taxRatesQuery.data?.settings, ytdDetailQuery.data])

  const retainedSat = useMemo(() => {
    if (!settlement) return 0
    return resolveRetainedSat(
      settlement.tax_withholdings,
      taxEstimates?.total?.withholding_total ?? 0,
    )
  }, [settlement, taxEstimates])

  const displaySettlement = useMemo(() => {
    if (!settlement) return null
    return settlementWithEstimatedTax(settlement, retainedSat)
  }, [retainedSat, settlement])

  const settlementSegments = useMemo(
    () =>
      displaySettlement
        ? buildSettlementWaterfallSegments(displaySettlement, t, {
            includeTaxWithholdings: true,
          })
        : [],
    [displaySettlement, t],
  )

  const previousRange = useMemo(
    () => computeShiftedPreviousPeriod(insightStart, insightEnd),
    [insightEnd, insightStart],
  )
  const prevDetailQuery = useProductDetailQuery(
    previousRange ? productId : undefined,
    previousRange
      ? {
          metricsStart: previousRange.start,
          metricsEnd: previousRange.end,
        }
      : undefined,
  )
  const prevSettlement = useMemo(() => {
    if (!prevDetailQuery.data) return null
    return resolveProductPlatformSettlement({
      channelFilter: activeChannel,
      periodSettlement: prevDetailQuery.data.period_settlement,
      periodSettlementByPlatform: prevDetailQuery.data.period_settlement_by_platform,
      listings: prevDetailQuery.data.listings,
    })
  }, [activeChannel, prevDetailQuery.data])

  const prevTaxEstimates = useMemo(() => {
    if (!prevDetailQuery.data || !taxRatesQuery.data?.settings) return null
    const prevPlatforms = settlementPlatformsFromProduct(prevDetailQuery.data, t)
    const prevMetrics = productSettlementByPlatformMetrics(
      prevDetailQuery.data,
      prevPlatforms,
    )
    return estimateSettlementTaxByPlatform(
      prevMetrics,
      prevPlatforms,
      taxRatesQuery.data.settings,
    )
  }, [prevDetailQuery.data, t, taxRatesQuery.data?.settings])

  const payoutGrowth = useMemo(() => {
    if (!displaySettlement || !prevSettlement) {
      return { pct: null as number | null, trend: 'flat' as const, unavailable: true }
    }
    const prevRetained = resolveRetainedSat(
      prevSettlement.tax_withholdings,
      prevTaxEstimates?.total?.withholding_total ?? 0,
    )
    const prevDisplay = settlementWithEstimatedTax(prevSettlement, prevRetained)
    const delta = pctVersusPrevious(
      displaySettlement.estimated_payout,
      prevDisplay.estimated_payout,
    )
    return {
      pct: delta?.pct ?? null,
      trend: delta?.trend ?? ('flat' as const),
      unavailable: !prevDetailQuery.isSuccess,
    }
  }, [
    displaySettlement,
    prevDetailQuery.isSuccess,
    prevSettlement,
    prevTaxEstimates,
  ])

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

  const pendingByPlatform = useMemo(() => {
    const out: Record<string, number> = {}
    for (const platform of platforms) {
      const estimate = taxEstimates?.[platform.slug]
      out[platform.slug] =
        estimate?.expected_net_cash ??
        settlementMetrics[platform.slug]?.estimated_payout ??
        0
    }
    return out
  }, [platforms, settlementMetrics, taxEstimates])

  if (!isFetching && !settlement) {
    return <EmptyState size="sm" icon="products" title={t('productsDetailPlatformPaymentEmpty')} />
  }

  const cobroNeto = displaySettlement?.estimated_payout ?? 0
  const payoutPct =
    displaySettlement && displaySettlement.net_revenue > 0
      ? (cobroNeto / displaySettlement.net_revenue) * 100
      : null

  const vistaBPrimary: Array<{
    key: VistaBKpiKey
    label: string
    helpText?: string
    value: ReactNode
    currencyCode?: string
    numericValue?: number
    footer?: ReactNode
    growthPct?: number | null
    growthTrend?: 'up' | 'down' | 'flat'
    growthUnavailable?: boolean
  }> = displaySettlement
    ? [
        {
          key: 'net-sales',
          label: t('productsDetailPlatformPaymentNetSales'),
          value: insightKpi(fmtCard(displaySettlement.net_revenue)),
          currencyCode,
          numericValue: displaySettlement.net_revenue,
        },
        {
          key: 'retained-sat',
          label: t('productsDetailPlatformPaymentRetainedSat'),
          helpText: t('productsDetailPlatformPaymentRetainedSatHelp'),
          value: insightKpi(fmtCard(retainedSat)),
          currencyCode,
          numericValue: retainedSat,
          footer: (
            <span className="text-[11px] text-text-tertiary">
              {t('productsDetailPlatformPaymentRetainedSatFooter')}
            </span>
          ),
        },
        {
          key: 'payout',
          label: t('productsDetailPlatformPaymentCobroNeto'),
          helpText: t('productsDetailPlatformPaymentTotalPayoutHelp'),
          value: insightKpi(fmtCard(cobroNeto)),
          currencyCode,
          numericValue: cobroNeto,
          growthPct: payoutGrowth.pct,
          growthTrend: payoutGrowth.trend,
          growthUnavailable: payoutGrowth.unavailable,
        },
        {
          key: 'payout-pct',
          label: t('productsDetailPlatformPaymentPayoutPct'),
          helpText: t('productsDetailPlatformPaymentPayoutPctHelp'),
          value: insightKpi(payoutPct == null ? '—' : `${payoutPct.toFixed(1)}%`),
          footer: (
            <span className="text-[11px] text-text-tertiary">
              {t('productsDetailPlatformPaymentPayoutPctFooter')}
            </span>
          ),
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
            {isFetching && !displaySettlement
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
                    footer={kpi.footer}
                    growthPct={kpi.growthPct}
                    growthTrend={kpi.growthTrend}
                    growthUnavailable={kpi.growthUnavailable ?? true}
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

      {displaySettlement ? (
        <ProductDetailWaterfallBlock
          title={t('productsDetailSettlementTitle')}
          description={t('reportsSectionSettlementSubtitle')}
          segments={settlementSegments}
          currency={detail.base_currency}
          grossRevenue={displaySettlement.gross_revenue}
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

      {platforms.length > 0 ? (
        <ProductCobroTaxMatrix
          metrics={settlementMetrics}
          platforms={platforms}
          taxRates={taxRatesQuery.data?.settings}
          formatMoney={fmtBase}
          t={t}
          currencyCode={currencyCode}
          yearWithheld={yearWithheld}
          yearWithheldLoading={ytdDetailQuery.isFetching}
        />
      ) : null}

      {platforms.length > 0 ? (
        <ProductCobroTimingTable
          platforms={platforms}
          metrics={settlementMetrics}
          pendingByPlatform={pendingByPlatform}
          formatMoney={fmtBase}
          t={t}
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
