import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { enUS } from 'date-fns/locale/en-US'
import { es as esLocale } from 'date-fns/locale/es'

import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkGroupApi, ProductLinkGroupMemberApi } from '@/lib/types/product-links'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'
import { ChannelsSettlementTable } from '@/pages/channels/channels-settlement-table'
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { AppSeriesChartViewToggle } from '@/pages/dashboard/app-chart-view-toggle'
import { buildSettlementWaterfallSegments } from '@/pages/reports/settlement-waterfall-segments'
import { useMonthlyRevenueSeries } from '@/pages/reports/use-monthly-revenue-series'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import type { FilterOption } from '@/ui/filters/types'
import { Skeleton } from '@/ui/skeleton'
import type { SeriesChartView } from '@/ui/chart-view-toggle'

import {
  connectionIdsForPlatform,
  PRODUCT_DETAIL_ALL_CHANNELS,
} from '../product-detail-analytics-filter'
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
import { productPlatformLabel } from '../product-platform-label'
import {
  groupSettlementByPlatformMetrics,
  settlementPlatformsFromGroup,
} from '../product-settlement-channel-metrics'

type ShellT = (key: ShellStringKey) => string

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

function memberSlug(member: ProductLinkGroupMemberApi): string {
  return member.platform.trim().toLowerCase()
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
  const [granularity, setGranularity] = useState<RevenueSeriesGranularity>('week')
  const [trendChartType, setTrendChartType] = useState<SeriesChartView>('line')
  const [selectedMetrics, setSelectedMetrics] = useState<ProductDetailTrendMetricId[]>([
    'net-sales',
  ])
  const [channelFilter, setChannelFilter] = useState(PRODUCT_DETAIL_ALL_CHANNELS)
  const connectionsQuery = usePlatformConnectionsQuery()

  const platformSlugs = useMemo(() => {
    const slugs = new Set<string>()
    for (const member of group.members) {
      const slug = memberSlug(member)
      if (slug) slugs.add(slug)
    }
    return Array.from(slugs).sort((a, b) => a.localeCompare(b))
  }, [group.members])

  const activeChannel =
    channelFilter === PRODUCT_DETAIL_ALL_CHANNELS || platformSlugs.includes(channelFilter)
      ? channelFilter
      : PRODUCT_DETAIL_ALL_CHANNELS

  const filteredMembers = useMemo(() => {
    if (activeChannel === PRODUCT_DETAIL_ALL_CHANNELS) return group.members
    return group.members.filter((member) => memberSlug(member) === activeChannel)
  }, [activeChannel, group.members])

  const channelOptions = useMemo((): FilterOption[] => {
    const allOption: FilterOption = {
      value: PRODUCT_DETAIL_ALL_CHANNELS,
      label: t('homeFilterChannelsAll'),
    }
    const platformOptions = platformSlugs.map((slug) => {
      const source =
        group.members.find((member) => memberSlug(member) === slug)?.platform ?? slug
      return { value: slug, label: productPlatformLabel(source, t) }
    })
    return [allOption, ...platformOptions]
  }, [group.members, platformSlugs, t])

  const settlement = useMemo(() => {
    if (activeChannel === PRODUCT_DETAIL_ALL_CHANNELS) return group.period_settlement
    const row = (group.period_settlement_by_platform ?? []).find(
      (item) => item.platform.trim().toLowerCase() === activeChannel,
    )
    return row ?? group.period_settlement
  }, [activeChannel, group.period_settlement, group.period_settlement_by_platform])

  const segments = useMemo(
    () => buildSettlementWaterfallSegments(settlement, t, { includeTaxWithholdings: false }),
    [settlement, t],
  )

  const chartProductIds = useMemo(
    () => filteredMembers.map((member) => member.product_id),
    [filteredMembers],
  )
  const chartConnectionIds = useMemo(
    () => connectionIdsForPlatform(connectionsQuery.data, activeChannel),
    [activeChannel, connectionsQuery.data],
  )

  const { data: series, isError } = useMonthlyRevenueSeries({
    productIds: chartProductIds,
    connectionIds: chartConnectionIds,
    startDate: insightStart,
    endDate: insightEnd,
    granularity,
    enabled: chartProductIds.length > 0 && Boolean(insightStart && insightEnd),
  })

  const platforms = useMemo(() => settlementPlatformsFromGroup(group, t), [group, t])
  const settlementMetrics = useMemo(
    () => groupSettlementByPlatformMetrics(group, platforms),
    [group, platforms],
  )

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

  const payoutPct =
    settlement.net_revenue > 0
      ? (settlement.estimated_payout / settlement.net_revenue) * 100
      : null

  const vistaBPrimary: Array<{
    key: VistaBKpiKey
    label: string
    helpText?: string
    value: ReactNode
    currencyCode?: string
    numericValue?: number
  }> = [
    {
      key: 'gross-sales',
      label: t('reportsGrossRevenue'),
      value: insightKpi(fmtCard(settlement.gross_revenue)),
      currencyCode: baseCurrency,
      numericValue: settlement.gross_revenue,
    },
    {
      key: 'net-sales',
      label: t('productsDetailPlatformPaymentNetSales'),
      helpText: t('productsDetailPlatformPaymentGrossSalesHelp'),
      value: insightKpi(fmtCard(settlement.net_revenue)),
      currencyCode: baseCurrency,
      numericValue: settlement.net_revenue,
    },
    {
      key: 'payout',
      label: t('productsDetailPlatformPaymentTotalPayout'),
      helpText: t('productsDetailPlatformPaymentTotalPayoutHelp'),
      value: insightKpi(fmtCard(settlement.estimated_payout)),
      currencyCode: baseCurrency,
      numericValue: settlement.estimated_payout,
    },
    {
      key: 'payout-pct',
      label: t('productsDetailPlatformPaymentPayoutPct'),
      helpText: t('productsDetailPlatformPaymentPayoutPctHelp'),
      value: insightKpi(payoutPct == null ? '—' : `${payoutPct.toFixed(1)}%`),
    },
  ]

  const vistaBSecondary: Array<{
    key: VistaBKpiKey
    label: string
    value: ReactNode
    currencyCode?: string
    numericValue?: number
  }> = [
    {
      key: 'discounts',
      label: t('settlementWfDiscounts'),
      value: insightKpi(fmtCard(settlement.discounts)),
      currencyCode: baseCurrency,
      numericValue: settlement.discounts,
    },
    {
      key: 'returns',
      label: t('settlementWfReturns'),
      value: insightKpi(fmtCard(settlement.returns)),
      currencyCode: baseCurrency,
      numericValue: settlement.returns,
    },
    {
      key: 'fees',
      label: t('settlementWfMarketplaceFees'),
      value: insightKpi(fmtCard(settlement.marketplace_fees)),
      currencyCode: baseCurrency,
      numericValue: settlement.marketplace_fees,
    },
    {
      key: 'shipping',
      label: t('settlementWfShippingCharges'),
      value: insightKpi(fmtCard(settlement.shipping_charges)),
      currencyCode: baseCurrency,
      numericValue: settlement.shipping_charges,
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <Card className="rounded-none border-none p-0 shadow-none hover:shadow-none">
        <CardHeader className="flex flex-col gap-3 p-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <DateRangePicker
              strings={pickerStrings}
              startValue={insightStart}
              endValue={insightEnd}
              onStartChange={(v) => v && setInsightStart(v)}
              onEndChange={(v) => v && setInsightEnd(v)}
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
                {...vistaBTileProps(kpi.key)}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 items-stretch gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {vistaBSecondary.map((kpi) => (
              <ProductDetailInsightKpiTile
                key={kpi.key}
                label={kpi.label}
                showValues
                isFetching={insightsFetching}
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
        grossRevenue={settlement.gross_revenue}
        t={t}
        finalBarCaption={t('reportsSettlementFinalHint')}
        isLoading={insightsFetching}
      />

      {platforms.length > 0 ? (
        <ChannelsSettlementTable
          metrics={settlementMetrics}
          platforms={platforms}
          formatMoney={fmtBase}
          t={t}
          includeTaxWithholdings={false}
        />
      ) : null}

      <GroupInventoryByChannel
        group={group}
        t={t}
        isFetching={insightsFetching}
      />
    </div>
  )
}
