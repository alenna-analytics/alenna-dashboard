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
import { formatInventoryDays } from '../product-detail-format-inventory-days'
import { ProductDetailInsightKpiTile } from '../product-detail-insight-kpi-tile'
import { ProductDetailTrendChart } from '../product-detail-trend-chart'
import {
  isProductDetailTrendMetricChartable,
  PRODUCT_DETAIL_METRIC_COLORS,
  productDetailTrendMetricHelp,
  productDetailTrendMetricLabel,
  productDetailTrendPeriodValueFromFiltered,
  toggleProductDetailTrendMetric,
  type ProductDetailPeriodView,
  type ProductDetailTrendMetricId,
} from '../product-detail-trend-metrics'
import { productPlatformLabel } from '../product-platform-label'

type ShellT = (key: ShellStringKey) => string

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

const GROUP_TREND_METRIC_IDS: ProductDetailTrendMetricId[] = [
  'gross-sales',
  'net-sales',
  'gross-profit',
  'units',
  'orders',
  'inventory-days',
]

function memberSlug(member: ProductLinkGroupMemberApi): string {
  return member.platform.trim().toLowerCase()
}

function sumMembers(members: ProductLinkGroupMemberApi[]): ProductDetailPeriodView {
  const grossSales = members.reduce((sum, member) => sum + (member.period_gross_sales ?? 0), 0)
  const netSales = members.reduce((sum, member) => sum + (member.period_net_sales ?? 0), 0)
  const netProfit = members.reduce((sum, member) => sum + (member.period_net_profit ?? 0), 0)
  const grossProfitOnGross = members.reduce(
    (sum, member) => sum + (member.period_gross_profit ?? 0),
    0,
  )
  const units = members.reduce((sum, member) => sum + (member.period_gross_units_sold ?? 0), 0)
  const orders = members.reduce((sum, member) => sum + (member.period_orders ?? 0), 0)
  const stocks = members
    .map((member) => member.consolidated_stock_quantity ?? member.stock_quantity)
    .filter((value): value is number => value != null)
  const velocities = members
    .map((member) => member.velocity_units_per_day_90d)
    .filter((value): value is number => value != null && value > 0)
  const stock = stocks.length > 0 ? stocks.reduce((sum, value) => sum + value, 0) : null
  const velocity = velocities.length > 0 ? velocities.reduce((sum, value) => sum + value, 0) : null
  const inventoryDays =
    stock == null ? null : stock === 0 ? 0 : velocity == null || velocity <= 0 ? null : Math.round(stock / velocity)
  const marginPct = netSales !== 0 ? (netProfit / netSales) * 100 : 0
  return {
    period_gross_sales: grossSales,
    period_net_sales: netSales,
    period_gross_profit: grossProfitOnGross,
    gross_profit: netProfit,
    contribution_margin: 0,
    contribution_margin_pct: 0,
    gross_margin_pct: marginPct,
    cm_incomplete: true,
    period_gross_units_sold: units,
    period_units_sold: units,
    period_orders: orders,
    inventory_days: inventoryDays,
  }
}

function groupPeriodView(
  group: ProductLinkGroupApi,
  members: ProductLinkGroupMemberApi[],
  allChannels: boolean,
): ProductDetailPeriodView {
  if (allChannels) {
    return {
      period_gross_sales: group.period_gross_sales,
      period_net_sales: group.period_net_sales,
      period_gross_profit: group.period_gross_profit ?? 0,
      gross_profit: group.period_net_profit ?? 0,
      contribution_margin: 0,
      contribution_margin_pct: 0,
      gross_margin_pct: 0,
      cm_incomplete: true,
      period_gross_units_sold: group.period_gross_units_sold,
      period_units_sold: group.period_gross_units_sold,
      period_orders: group.period_orders,
      inventory_days: group.inventory_days ?? null,
    }
  }
  return sumMembers(members)
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

  const periodView = useMemo(
    () => groupPeriodView(group, filteredMembers, activeChannel === PRODUCT_DETAIL_ALL_CHANNELS),
    [activeChannel, filteredMembers, group],
  )

  const inventoryInput = useMemo(() => {
    if (activeChannel === PRODUCT_DETAIL_ALL_CHANNELS) {
      return {
        inventory_days: group.inventory_days ?? null,
        consolidated_stock_quantity: group.consolidated_stock_quantity ?? null,
        velocity_units_per_day_90d: group.velocity_units_per_day_90d ?? null,
      }
    }
    const stocks = filteredMembers
      .map((member) => member.consolidated_stock_quantity ?? member.stock_quantity)
      .filter((value): value is number => value != null)
    const velocities = filteredMembers
      .map((member) => member.velocity_units_per_day_90d)
      .filter((value): value is number => value != null)
    return {
      inventory_days: periodView.inventory_days,
      consolidated_stock_quantity: stocks.length > 0 ? stocks.reduce((sum, value) => sum + value, 0) : null,
      velocity_units_per_day_90d:
        velocities.length > 0 ? velocities.reduce((sum, value) => sum + value, 0) : null,
    }
  }, [activeChannel, filteredMembers, group, periodView.inventory_days])

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

  const metricCards = useMemo(
    () =>
      GROUP_TREND_METRIC_IDS.map((id) => {
        const numericValue = productDetailTrendPeriodValueFromFiltered(periodView, id)
        const isMoney = id !== 'inventory-days' && id !== 'units' && id !== 'orders'
        let value: ReactNode
        if (id === 'inventory-days') {
          value = insightKpi(formatInventoryDays(inventoryInput, t))
        } else if (id === 'units' || id === 'orders') {
          value = insightKpi((numericValue ?? 0).toLocaleString())
        } else {
          value = insightKpi(fmtCard(numericValue ?? 0))
        }
        return {
          id,
          label: productDetailTrendMetricLabel(id, t),
          helpText: productDetailTrendMetricHelp(id, t),
          footer: id === 'inventory-days' ? t('productsDetailKpiInventoryDaysWindow') : undefined,
          numericValue,
          value,
          currencyCode: isMoney ? baseCurrency : undefined,
          selectable: isProductDetailTrendMetricChartable(id),
          accentColor: PRODUCT_DETAIL_METRIC_COLORS[id],
          selected: selectedMetrics.includes(id),
        }
      }),
    [baseCurrency, fmtCard, inventoryInput, periodView, selectedMetrics, t],
  )

  const { data: series, isError } = useMonthlyRevenueSeries({
    productIds: chartProductIds,
    connectionIds: chartConnectionIds,
    startDate: insightStart,
    endDate: insightEnd,
    granularity,
    enabled: chartProductIds.length > 0 && Boolean(insightStart && insightEnd),
  })

  const onMetricClick = useCallback((id: ProductDetailTrendMetricId) => {
    if (!isProductDetailTrendMetricChartable(id)) return
    setSelectedMetrics((prev) => toggleProductDetailTrendMetric(prev, id))
  }, [])

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
          {metricCards.map((kpi) => (
            <ProductDetailInsightKpiTile
              key={kpi.id}
              label={kpi.label}
              helpText={kpi.helpText}
              footer={kpi.footer}
              showValues
              isFetching={insightsFetching}
              skeleton={kpiSkeleton}
              numericValue={kpi.numericValue}
              currencyCode={kpi.currencyCode}
              value={kpi.value}
              selectable={kpi.selectable}
              selected={kpi.selected}
              accentColor={kpi.accentColor}
              onSelect={kpi.selectable ? () => onMetricClick(kpi.id) : undefined}
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
