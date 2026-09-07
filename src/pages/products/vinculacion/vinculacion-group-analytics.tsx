import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { enUS } from 'date-fns/locale/en-US'
import { es as esLocale } from 'date-fns/locale/es'

import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkGroupApi, ProductLinkGroupMemberApi } from '@/lib/types/product-links'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'
import { ChartGranularityFilter } from '@/pages/dashboard/chart-granularity-filter'
import { AppSeriesChartViewToggle } from '@/pages/dashboard/app-chart-view-toggle'
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
import { ProductDetailTrendChart } from '../product-detail-trend-chart'
import {
  isProductDetailTrendMetricChartable,
  PRODUCT_DETAIL_METRIC_COLORS,
  productDetailTrendMetricLabel,
  toggleProductDetailTrendMetric,
  type ProductDetailTrendMetricId,
} from '../product-detail-trend-metrics'
import { productPlatformLabel } from '../product-platform-label'

type ShellT = (key: ShellStringKey) => string

type VistaAKpiKey =
  | 'net-sales'
  | 'gross-profit'
  | 'channel-margin'
  | 'cm'
  | 'units'
  | 'cm-unit'
  | 'avg-price'
  | 'unit-cogs'

const VISTA_A_TREND_METRIC: Partial<Record<VistaAKpiKey, ProductDetailTrendMetricId>> = {
  'net-sales': 'net-sales',
  'gross-profit': 'gross-profit',
  cm: 'net-profit',
  units: 'units',
}

type VinculacionGroupAnalyticsProps = {
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

function memberSlug(member: ProductLinkGroupMemberApi): string {
  return member.platform.trim().toLowerCase()
}

type FilteredGroupPeriod = {
  period_net_sales: number
  period_gross_profit: number
  gross_margin_pct: number
  contribution_margin: number
  contribution_margin_pct: number
  channel_margin: number
  channel_margin_pct: number
  units: number
  period_cogs: number
  fees: number
  shipping: number
}

function filterGroupPeriod(
  group: ProductLinkGroupApi,
  members: ProductLinkGroupMemberApi[],
  allChannels: boolean,
): FilteredGroupPeriod {
  if (allChannels) {
    const units = group.period_net_units_sold || group.period_gross_units_sold
    return {
      period_net_sales: group.period_net_sales,
      period_gross_profit: group.period_gross_profit,
      gross_margin_pct: group.gross_margin_pct,
      contribution_margin: group.contribution_margin,
      contribution_margin_pct: group.contribution_margin_pct,
      channel_margin: group.channel_margin,
      channel_margin_pct: group.channel_margin_pct,
      units,
      period_cogs: group.period_cogs,
      fees: group.period_settlement.marketplace_fees,
      shipping: group.period_settlement.shipping_charges,
    }
  }

  const netSales = members.reduce((sum, member) => sum + (member.period_net_sales ?? 0), 0)
  const share = group.period_net_sales > 0 ? netSales / group.period_net_sales : 0
  const grossProfit = group.period_gross_profit * share
  const cogs = group.period_cogs * share
  const contribution = group.contribution_margin * share
  const units = members.reduce(
    (sum, member) => sum + (member.period_net_units_sold || member.period_gross_units_sold || 0),
    0,
  )
  const platforms = new Set(members.map(memberSlug))
  const fees = (group.period_settlement_by_platform ?? [])
    .filter((row) => platforms.has(row.platform.trim().toLowerCase()))
    .reduce((sum, row) => sum + row.marketplace_fees, 0)
  const shipping = (group.period_settlement_by_platform ?? [])
    .filter((row) => platforms.has(row.platform.trim().toLowerCase()))
    .reduce((sum, row) => sum + row.shipping_charges, 0)
  const channelMargin = grossProfit - fees - shipping
  return {
    period_net_sales: netSales,
    period_gross_profit: grossProfit,
    gross_margin_pct: netSales > 0 ? (grossProfit / netSales) * 100 : 0,
    contribution_margin: contribution,
    contribution_margin_pct: netSales > 0 ? (contribution / netSales) * 100 : 0,
    channel_margin: channelMargin,
    channel_margin_pct: netSales > 0 ? (channelMargin / netSales) * 100 : 0,
    units,
    period_cogs: cogs,
    fees,
    shipping,
  }
}

export function VinculacionGroupAnalytics({
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
}: VinculacionGroupAnalyticsProps) {
  const [granularity, setGranularity] = useState<RevenueSeriesGranularity>('week')
  const [trendChartType, setTrendChartType] = useState<SeriesChartView>('line')
  const [selectedMetrics, setSelectedMetrics] = useState<ProductDetailTrendMetricId[]>(['net-sales'])
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

  const period = useMemo(
    () => filterGroupPeriod(group, filteredMembers, activeChannel === PRODUCT_DETAIL_ALL_CHANNELS),
    [activeChannel, filteredMembers, group],
  )

  const chartProductIds = useMemo(
    () => filteredMembers.map((member) => member.product_id),
    [filteredMembers],
  )
  const chartConnectionIds = useMemo(
    () => connectionIdsForPlatform(connectionsQuery.data, activeChannel),
    [activeChannel, connectionsQuery.data],
  )

  const dateLocale = lang === 'en' ? enUS : esLocale
  const kpiSkeleton = <Skeleton className="mt-0.5 h-6 w-24 max-w-full" aria-hidden />
  const insightKpi = (value: ReactNode): ReactNode => value

  const units = period.units
  const cmPerUnit = units > 0 ? period.contribution_margin / units : 0
  const avgPrice = units > 0 ? period.period_net_sales / units : 0
  const unitCogs = units > 0 ? period.period_cogs / units : 0

  const { data: series, isError } = useMonthlyRevenueSeries({
    productIds: chartProductIds,
    connectionIds: chartConnectionIds,
    startDate: insightStart,
    endDate: insightEnd,
    granularity,
    enabled: chartProductIds.length > 0 && Boolean(insightStart && insightEnd),
  })

  const onVistaAClick = useCallback((key: VistaAKpiKey) => {
    const metricId = VISTA_A_TREND_METRIC[key]
    if (!metricId || !isProductDetailTrendMetricChartable(metricId)) return
    setSelectedMetrics((prev) => toggleProductDetailTrendMetric(prev, metricId))
  }, [])

  function vistaATileProps(key: VistaAKpiKey) {
    const metricId = VISTA_A_TREND_METRIC[key]
    const selectable = Boolean(metricId && isProductDetailTrendMetricChartable(metricId))
    return {
      selectable,
      selected: Boolean(metricId && selectedMetrics.includes(metricId)),
      accentColor: metricId ? PRODUCT_DETAIL_METRIC_COLORS[metricId] : undefined,
      onSelect: selectable ? () => onVistaAClick(key) : undefined,
    }
  }

  const vistaAPrimary: Array<{
    key: VistaAKpiKey
    label: string
    helpText?: string
    value: ReactNode
    currencyCode?: string
    numericValue?: number
    ratePct?: number
  }> = [
    {
      key: 'net-sales',
      label: t('productsDetailPlatformPaymentNetSales'),
      value: insightKpi(fmtCard(period.period_net_sales)),
      currencyCode: baseCurrency,
      numericValue: period.period_net_sales,
    },
    {
      key: 'gross-profit',
      label: t('reportsWfGrossProfit'),
      value: insightKpi(fmtCard(period.period_gross_profit)),
      currencyCode: baseCurrency,
      numericValue: period.period_gross_profit,
      ratePct: period.gross_margin_pct,
    },
    {
      key: 'channel-margin',
      label: t('productsDetailChannelMargin'),
      helpText: t('productsDetailChannelMarginHelp'),
      value: insightKpi(fmtCard(period.channel_margin)),
      currencyCode: baseCurrency,
      numericValue: period.channel_margin,
      ratePct: period.channel_margin_pct,
    },
    {
      key: 'cm',
      label: t('reportsNetProfit'),
      value: insightKpi(fmtCard(period.contribution_margin)),
      currencyCode: baseCurrency,
      numericValue: period.contribution_margin,
      ratePct: period.contribution_margin_pct,
    },
  ]

  const vistaASecondary: Array<{
    key: VistaAKpiKey
    label: string
    value: ReactNode
    currencyCode?: string
    numericValue?: number
  }> = [
    {
      key: 'units',
      label: productDetailTrendMetricLabel('units', t),
      value: insightKpi(units.toLocaleString()),
    },
    {
      key: 'cm-unit',
      label: t('productsDetailCmPerUnit'),
      value: insightKpi(fmtCard(cmPerUnit)),
      currencyCode: baseCurrency,
      numericValue: cmPerUnit,
    },
    {
      key: 'avg-price',
      label: t('productsDetailAvgPrice'),
      value: insightKpi(fmtCard(avgPrice)),
      currencyCode: baseCurrency,
      numericValue: avgPrice,
    },
    {
      key: 'unit-cogs',
      label: t('productsDetailUnitCogs'),
      value: insightKpi(fmtCard(unitCogs)),
      currencyCode: baseCurrency,
      numericValue: unitCogs,
    },
  ]

  return (
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
          {vistaAPrimary.map((kpi) => (
            <ProductDetailInsightKpiTile
              key={kpi.key}
              label={kpi.label}
              helpText={kpi.helpText}
              showValues
              isFetching={insightsFetching}
              skeleton={kpiSkeleton}
              numericValue={kpi.numericValue}
              currencyCode={kpi.currencyCode}
              ratePct={kpi.ratePct}
              value={kpi.value}
              {...vistaATileProps(kpi.key)}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 items-stretch gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {vistaASecondary.map((kpi) => (
            <ProductDetailInsightKpiTile
              key={kpi.key}
              label={kpi.label}
              showValues
              isFetching={insightsFetching}
              skeleton={kpiSkeleton}
              numericValue={kpi.numericValue}
              currencyCode={kpi.currencyCode}
              value={kpi.value}
              {...vistaATileProps(kpi.key)}
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
  )
}
