import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { enUS } from 'date-fns/locale/en-US'
import { es as esLocale } from 'date-fns/locale/es'

import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkGroupApi } from '@/lib/types/product-links'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'
import { ChannelsSettlementTable } from '@/pages/channels/channels-settlement-table'
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { AppSeriesChartViewToggle } from '@/pages/dashboard/app-chart-view-toggle'
import { useTaxRatesQuery } from '@/pages/configuration/tax-rates/use-tax-rates-queries'
import { buildSettlementWaterfallSegments } from '@/pages/reports/settlement-waterfall-segments'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import { Skeleton } from '@/ui/skeleton'
import type { SeriesChartView } from '@/ui/chart-view-toggle'

import { ProductCobroTaxMatrix } from '../product-cobro-tax-matrix'
import { ProductCobroTimingTable } from '../product-cobro-timing-table'
import { ProductDetailInsightKpiTile } from '../product-detail-insight-kpi-tile'
import { GroupInventoryByChannel } from '../product-detail-inventory-by-channel'
import { ProductDetailTrendChart } from '../product-detail-trend-chart'
import { ProductDetailWaterfallBlock } from '../product-detail-waterfall-block'
import {
  isProductDetailTrendMetricChartable,
  PRODUCT_DETAIL_METRIC_COLORS,
  toggleProductDetailTrendMetric,
  type ProductDetailTrendMetricId,
} from '../product-detail-trend-metrics'
import {
  estimateSettlementTaxByPlatform,
  resolveRetainedSat,
  settlementWithEstimatedTax,
} from '../product-pnl-tax-estimates'
import {
  groupSettlementByPlatformMetrics,
  settlementPlatformsFromGroup,
} from '../product-settlement-channel-metrics'
import {
  groupProductPlatforms,
  groupProductSettlementMetrics,
} from './group-insight-dimension'
import { useGroupInsight } from './use-group-insight'
import { VinculacionInsightDimensionFilter } from './vinculacion-insight-dimension-filter'

type ShellT = (key: ShellStringKey) => string

type VistaBKpiKey = 'net-sales' | 'retained-sat' | 'payout' | 'payout-pct'

const VISTA_B_TREND_METRIC: Partial<Record<VistaBKpiKey, ProductDetailTrendMetricId>> = {
  'net-sales': 'net-sales',
}

type VinculacionGroupRentabilidadProps = {
  group: ProductLinkGroupApi
  lang: string
  t: ShellT
  baseCurrency: string
  fmtBase: (value: number) => string
  fmtCard: (value: number) => string
  insightStart: string
  insightEnd: string
  setInsightStart: (value: string) => void
  setInsightEnd: (value: string) => void
  pickerStrings: DateRangePickerStrings
  insightsFetching: boolean
}

export function VinculacionGroupRentabilidad({
  group,
  lang,
  t,
  baseCurrency,
  fmtBase,
  fmtCard,
  insightStart,
  insightEnd,
  setInsightStart,
  setInsightEnd,
  pickerStrings,
  insightsFetching,
}: VinculacionGroupRentabilidadProps) {
  const insight = useGroupInsight()
  const [granularity, setGranularity] = useState<RevenueSeriesGranularity>('week')
  const [trendChartType, setTrendChartType] = useState<SeriesChartView>('line')
  const [selectedMetrics, setSelectedMetrics] = useState<ProductDetailTrendMetricId[]>([
    'net-sales',
  ])
  const connectionsQuery = usePlatformConnectionsQuery()
  const taxRatesQuery = useTaxRatesQuery()

  const { settlement, chartProductIds } = insight
  const chartConnectionIds = insight.connectionIdsForActive(connectionsQuery.data)

  const byProduct = insight.dimension === 'product'
  const productPlatforms = useMemo(() => groupProductPlatforms(group), [group])
  const channelPlatforms = useMemo(() => settlementPlatformsFromGroup(group, t), [group, t])
  const settlementPlatforms = byProduct ? productPlatforms : channelPlatforms
  const settlementMetrics = useMemo(
    () =>
      byProduct
        ? groupProductSettlementMetrics(group, productPlatforms)
        : groupSettlementByPlatformMetrics(group, channelPlatforms),
    [byProduct, channelPlatforms, group, productPlatforms],
  )

  const taxEstimates = useMemo(() => {
    const rates = taxRatesQuery.data?.settings
    if (!rates) return null
    return estimateSettlementTaxByPlatform(
      settlementMetrics,
      settlementPlatforms.map((p) => p.slug),
      rates,
    )
  }, [settlementMetrics, settlementPlatforms, taxRatesQuery.data?.settings])

  const retainedSat = useMemo(
    () =>
      resolveRetainedSat(
        settlement.tax_withholdings,
        taxEstimates?.total?.withholding_total ?? 0,
      ),
    [settlement.tax_withholdings, taxEstimates],
  )

  const displaySettlement = useMemo(
    () => settlementWithEstimatedTax(settlement, retainedSat),
    [retainedSat, settlement],
  )

  const segments = useMemo(
    () =>
      buildSettlementWaterfallSegments(displaySettlement, t, {
        includeTaxWithholdings: true,
      }),
    [displaySettlement, t],
  )

  const pendingByPlatform = useMemo(() => {
    const out: Record<string, number> = {}
    for (const platform of settlementPlatforms) {
      const estimate = taxEstimates?.[platform.slug]
      out[platform.slug] =
        estimate?.expected_net_cash ??
        settlementMetrics[platform.slug]?.estimated_payout ??
        0
    }
    return out
  }, [settlementMetrics, settlementPlatforms, taxEstimates])

  const { data: series, isError } = useMonthlyRevenueSeries({
    productIds: chartProductIds,
    connectionIds: chartConnectionIds,
    startDate: insightStart,
    endDate: insightEnd,
    granularity,
    enabled: chartProductIds.length > 0 && Boolean(insightStart && insightEnd),
  })

  const dateLocale = lang === 'en' ? enUS : esLocale
  const kpiSkeleton = <Skeleton className="mt-0.5 h-6 w-24 max-w-full" aria-hidden />
  const insightKpi = (value: ReactNode): ReactNode => value

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

  const cobroNeto = displaySettlement.estimated_payout
  const payoutPct =
    displaySettlement.net_revenue > 0
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
  }> = [
    {
      key: 'net-sales',
      label: t('productsDetailPlatformPaymentNetSales'),
      value: insightKpi(fmtCard(displaySettlement.net_revenue)),
      currencyCode: baseCurrency,
      numericValue: displaySettlement.net_revenue,
    },
    {
      key: 'retained-sat',
      label: t('productsDetailPlatformPaymentRetainedSat'),
      helpText: t('productsDetailPlatformPaymentRetainedSatHelp'),
      value: insightKpi(fmtCard(retainedSat)),
      currencyCode: baseCurrency,
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
      currencyCode: baseCurrency,
      numericValue: cobroNeto,
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

  return (
    <div className="flex flex-col gap-8">
      <Card className="rounded-none border-none p-0 shadow-none hover:shadow-none">
        <CardHeader className="flex flex-col gap-3 p-0">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <DateRangePicker
                strings={pickerStrings}
                startValue={insightStart}
                endValue={insightEnd}
                onStartChange={(v) => v && setInsightStart(v)}
                onEndChange={(v) => v && setInsightEnd(v)}
                className="w-full max-w-md"
              />
              {byProduct ? (
                <FilterComboboxSingle
                  label={t('productsColProduct')}
                  options={insight.productOptions}
                  value={insight.productFilter}
                  onValueChange={insight.setProductFilter}
                  searchPlaceholder={t('productsSearchPlaceholder')}
                  emptyLabel={t('productsVinculacionPickerEmpty')}
                  allowClear={false}
                  triggerClassName="w-full sm:w-auto sm:min-w-[12rem]"
                />
              ) : (
                <FilterComboboxSingle
                  label={t('homeFilterChannels')}
                  options={insight.channelOptions}
                  value={insight.channelFilter}
                  onValueChange={insight.setChannelFilter}
                  searchPlaceholder={t('homeFilterChannelsSearch')}
                  emptyLabel={t('homeFilterChannelsEmpty')}
                  allowClear={false}
                  triggerClassName="w-full sm:w-auto sm:min-w-[12rem]"
                />
              )}
            </div>
            <VinculacionInsightDimensionFilter
              value={insight.dimension}
              onChange={insight.setDimension}
              t={t}
              switchId="group-insight-dimension-rentabilidad"
              className="shrink-0 self-end"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-0 pt-4">
          <div className="grid grid-cols-1 items-stretch gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {vistaBPrimary.map((kpi) => (
              <ProductDetailInsightKpiTile
                key={kpi.key}
                label={kpi.label}
                helpText={kpi.helpText}
                showValues
                isFetching={insightsFetching}
                skeleton={kpiSkeleton}
                numericValue={kpi.numericValue}
                currencyCode={kpi.currencyCode}
                value={kpi.value}
                footer={kpi.footer}
                {...vistaBTileProps(kpi.key)}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <ChartGranularityFilter value={granularity} onChange={setGranularity} t={t} />
            <AppSeriesChartViewToggle value={trendChartType} onChange={setTrendChartType} t={t} />
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

      <ProductDetailWaterfallBlock
        title={t('productsDetailSettlementTitle')}
        description={t('reportsSectionSettlementSubtitle')}
        segments={segments}
        currency={baseCurrency}
        grossRevenue={displaySettlement.gross_revenue}
        t={t}
        finalBarCaption={t('reportsSettlementFinalHint')}
        isLoading={insightsFetching}
      />

      {settlementPlatforms.length > 0 ? (
        <ChannelsSettlementTable
          metrics={settlementMetrics}
          platforms={settlementPlatforms}
          formatMoney={fmtBase}
          t={t}
          includeTaxWithholdings={false}
          truncateLongHeaders={byProduct}
        />
      ) : null}

      {settlementPlatforms.length > 0 ? (
        <ProductCobroTaxMatrix
          metrics={settlementMetrics}
          platforms={settlementPlatforms}
          taxRates={taxRatesQuery.data?.settings}
          formatMoney={fmtBase}
          t={t}
          currencyCode={baseCurrency}
          breakdown={byProduct ? 'product' : 'channel'}
        />
      ) : null}

      {settlementPlatforms.length > 0 ? (
        <ProductCobroTimingTable
          platforms={settlementPlatforms}
          metrics={settlementMetrics}
          pendingByPlatform={pendingByPlatform}
          formatMoney={fmtBase}
          t={t}
        />
      ) : null}

      <GroupInventoryByChannel group={group} t={t} isFetching={insightsFetching} />
    </div>
  )
}
