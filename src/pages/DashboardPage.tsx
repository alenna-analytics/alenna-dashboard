import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { BarShapeProps } from 'recharts'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  OverlaySalesByChannelPanel,
  type OverlaySalesDatum,
  type SalesChannel as OverlaySalesChannel,
} from '@/components/charts/overlay-sales-by-channel-panel'
import { PieChartPanel } from '@/components/charts/pie-chart-panel'
import { BAR_TOP_RADIUS, chartPlotSurfaceClassName, tooltipContentStyle } from '@/components/charts/chart-theme'
import { DashboardFiltersBar } from '@/components/composed/dashboard-filters-bar'
import type { DataTableColumn } from '@/components/composed/data-table'
import { MetricCard } from '@/components/composed/metric-card'
import { PaginatedDataTable } from '@/components/composed/paginated-data-table'
import { StateTag } from '@/components/composed/state-tag'
import { useCurrency } from '@/components/providers/currency-provider'
import { useLanguage } from '@/components/providers/language-provider'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalyticsDaily, useAnalyticsProducts, useAnalyticsSummary, useProductsInsights, useProductsSkuTable, useSalesByBrand, useSalesDetailedTable } from '@/hooks/use-analytics'
import type { AnalyticsFilters, ProductInsight } from '@/lib/analytics-types'
import { buildYearShortcutOptions, fullCalendarMonthValue, isFullCalendarYearRange } from '@/lib/dashboard-date-shortcuts'
import { COLORS_BY_CHANNEL, DASHBOARD_PLATFORMS, PLATFORM_LABELS, dashboardT, type DashboardSalesChannel, type DashboardStringKey } from '@/lib/dashboard-strings'
import { fmtDateByLanguage, fmtPct, toIso, toLocalIsoDate } from '@/lib/format'
import { maxHeatmapValue, toHeatmapRows, toMarginChartRows, toTopProductChartRows } from '@/lib/products-page-utils'
import { cn } from '@/lib/utils'

type SalesChannel = DashboardSalesChannel
const PLATFORMS = DASHBOARD_PLATFORMS

function defaultStart(): Date {
  const d = new Date()
  d.setDate(1)
  return d
}

function parseDate(s: string | null, fallback: Date): Date {
  if (!s) return fallback
  const d = new Date(s + 'T00:00:00')
  return isNaN(d.getTime()) ? fallback : d
}

type DrilldownSelection = {
  periodKey: string
  periodLabel: string
}

function periodRangeFromGranularity(periodKey: string, granularity: string): { start: string; end: string } {
  const base = new Date(periodKey + 'T00:00:00')
  if (Number.isNaN(base.getTime())) {
    return { start: periodKey, end: periodKey }
  }
  const start = new Date(base)
  const end = new Date(base)
  if (granularity === 'weekly') {
    end.setDate(end.getDate() + 6)
  } else if (granularity === 'monthly') {
    end.setMonth(end.getMonth() + 1)
    end.setDate(0)
  }
  return { start: toLocalIsoDate(start), end: toLocalIsoDate(end) }
}

type UtilityTrendDatum = {
  period_key: string
  period: string
  gross_revenue: number
  net_revenue: number
  gross_profit: number
  margin_pct: number
  utilityNestedScale: number
  utilityNestedMin: number
}

type UtilityNestedMetricId = 'gross' | 'net' | 'profit'
type MetricVisibility = {
  gross: boolean
  net: boolean
  profit: boolean
  margin: boolean
}

type MetricToggleItem = {
  key: keyof MetricVisibility
  label: string
  color: string
  dashed?: boolean
}

const UTIL_NESTED_LAYERS: readonly {
  id: UtilityNestedMetricId
  fill: string
  fillOpacity: number
}[] = [
  { id: 'gross', fill: '#9CCBFF', fillOpacity: 0.9 },
  { id: 'net', fill: 'rgb(91,140,255)', fillOpacity: 0.55 },
  { id: 'profit', fill: '#66bb6a', fillOpacity: 1 },
] as const

const UTIL_NESTED_TIE_ORDER: Record<UtilityNestedMetricId, number> = { gross: 0, net: 1, profit: 2 }

function utilNestedBarsShape(props: BarShapeProps, visibility?: MetricVisibility) {
  const p = props.payload as UtilityTrendDatum
  const { x, y, width, height } = props
  const v = visibility ?? { gross: true, net: true, profit: true, margin: true }
  const g = v.gross ? p.gross_revenue : 0
  const n = v.net ? p.net_revenue : 0
  const pr = v.profit ? p.gross_profit : 0
  const maxPositive = Math.max(0, g, n, pr)
  const minNegative = Math.min(0, g, n, pr)
  const scaleBase = Math.max(maxPositive, Math.abs(minNegative))
  if (scaleBase <= 0 || width <= 0 || height <= 0) return null
  const zeroY = y + height
  const pxPerUnit = height / scaleBase
  const triples = UTIL_NESTED_LAYERS.map((layer) => ({
    ...layer,
    value: layer.id === 'gross' ? g : layer.id === 'net' ? n : pr,
  })).filter((t) => t.value !== 0)
  triples.sort((a, b) => {
    if (Math.abs(b.value) !== Math.abs(a.value)) return Math.abs(b.value) - Math.abs(a.value)
    return UTIL_NESTED_TIE_ORDER[a.id] - UTIL_NESTED_TIE_ORDER[b.id]
  })
  return (
    <g>
      {triples.map((t) => {
        const h = Math.max(1, Math.abs(t.value) * pxPerUnit)
        const yTop = t.value > 0 ? zeroY - h : zeroY
        return (
          <Rectangle
            key={t.id}
            x={x}
            y={yTop}
            width={width}
            height={h}
            fill={t.fill}
            fillOpacity={t.fillOpacity}
            radius={t.value > 0 ? BAR_TOP_RADIUS : [0, 0, 5, 5]}
          />
        )
      })}
    </g>
  )
}

function utilGroupedSignedShape(props: BarShapeProps) {
  return <Rectangle {...props} radius={BAR_TOP_RADIUS} />
}

const UTILITY_TOOLTIP_COLORS: Record<string, string> = {
  gross_revenue: '#9CCBFF',
  net_revenue: 'rgba(91,140,255,0.55)',
  gross_profit: '#66bb6a',
  margin_pct: '#f87171',
}

function utilityTooltipEntry(
  payload: readonly unknown[] | undefined,
  dataKey: string,
): { value: number; color?: string } | undefined {
  if (!payload?.length) return undefined
  for (const raw of payload) {
    if (raw === null || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const dk = o.dataKey
    if (typeof dk !== 'string' && typeof dk !== 'number') continue
    if (String(dk) !== dataKey) continue
    const value = o.value
    const num = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
    if (Number.isNaN(num)) continue
    const color = o.color
    return {
      value: num,
      color: typeof color === 'string' ? color : undefined,
    }
  }
  return undefined
}

function utilityTrendRowFromTooltipPayload(
  payload: readonly unknown[] | undefined,
): { period: string; gross_revenue: number; net_revenue: number; gross_profit: number; margin_pct: number } | undefined {
  if (!payload?.length) return undefined
  const raw = payload[0]
  if (raw === null || typeof raw !== 'object') return undefined
  const pl = (raw as Record<string, unknown>).payload
  if (!pl || typeof pl !== 'object') return undefined
  const o = pl as Record<string, unknown>
  const gross = Number(o.gross_revenue)
  const net = Number(o.net_revenue)
  const profit = Number(o.gross_profit)
  const margin = Number(o.margin_pct)
  if (![gross, net, profit, margin].every((v) => Number.isFinite(v))) return undefined
  return {
    period: String(o.period ?? ''),
    gross_revenue: gross,
    net_revenue: net,
    gross_profit: profit,
    margin_pct: margin,
  }
}

function UtilityMarginChartTooltip({
  active,
  payload,
  label,
  formatCurrency,
  t,
  metricsVisible,
}: {
  active?: boolean
  payload?: readonly unknown[]
  label?: unknown
  formatCurrency: (n: number) => string
  t: (key: DashboardStringKey) => string
  metricsVisible: MetricVisibility
}) {
  if (!active || !payload?.length) return null

  const datum = utilityTrendRowFromTooltipPayload(payload)

  const rows: { dataKey: string; pct: boolean }[] = [
    { dataKey: 'gross_revenue', pct: false },
    { dataKey: 'net_revenue', pct: false },
    { dataKey: 'gross_profit', pct: false },
    { dataKey: 'margin_pct', pct: true },
  ]

  const labelText = label != null ? String(label) : ''

  return (
    <div style={{ ...tooltipContentStyle, padding: '10px 12px' }}>
      {labelText ? (
        <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>{labelText}</div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        {rows.map(({ dataKey, pct }) => {
          const item = utilityTooltipEntry(payload, dataKey)
          const visible =
            dataKey === 'gross_revenue'
              ? metricsVisible.gross
              : dataKey === 'net_revenue'
                ? metricsVisible.net
                : dataKey === 'gross_profit'
                  ? metricsVisible.profit
                  : metricsVisible.margin
          if (!visible) return null
          const v =
            item?.value ??
            (datum && dataKey === 'gross_revenue'
              ? datum.gross_revenue
              : datum && dataKey === 'net_revenue'
                ? datum.net_revenue
                : datum && dataKey === 'gross_profit'
                  ? datum.gross_profit
                  : datum && dataKey === 'margin_pct'
                    ? datum.margin_pct
                    : undefined)
          if (v === undefined || Number.isNaN(Number(v))) return null
          const swatchColor = item?.color ?? UTILITY_TOOLTIP_COLORS[dataKey]
          const name =
            dataKey === 'gross_revenue'
              ? t('traceGrossRevenue')
              : dataKey === 'net_revenue'
                ? t('traceNetRevenue')
                : dataKey === 'gross_profit'
                  ? t('traceGrossProfit')
                  : t('traceMarginPct')
          return (
            <div key={dataKey} className="flex justify-between gap-6 text-[12px] leading-snug">
              <span style={{ color: swatchColor ?? 'var(--text-primary)' }}>{name}</span>
              <span className="tabular-nums text-text-primary">
                {pct ? `${Number(v).toFixed(1)}%` : formatCurrency(Number(v))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { lang } = useLanguage()
  const { formatCurrency, formatCurrencyValue, displayCurrency } = useCurrency()
  const [params, setParams] = useSearchParams()

  const startDate = parseDate(params.get('start'), defaultStart())
  const endDate = parseDate(params.get('end'), new Date())
  const granularity = params.get('granularity') ?? 'monthly'

  const selectedPlatforms = useMemo(() => {
    const p = params.getAll('platform')
    if (!p.length) return undefined
    return p.filter((x): x is SalesChannel => PLATFORMS.includes(x as SalesChannel))
  }, [params])
  const activePlatforms = selectedPlatforms ?? PLATFORMS

  const filters: AnalyticsFilters = useMemo(
    () => ({ start_date: toIso(startDate), end_date: toIso(endDate), platform: selectedPlatforms, granularity }),
    [startDate, endDate, selectedPlatforms, granularity],
  )

  const t = useCallback((key: DashboardStringKey) => dashboardT(lang, key), [lang])
  const locale = lang === 'es' ? 'es-MX' : 'en-US'
  const shortcutYearValue = useMemo(() => (isFullCalendarYearRange(startDate, endDate) ? String(startDate.getFullYear()) : ''), [startDate, endDate])
  const shortcutMonthValue = useMemo(() => fullCalendarMonthValue(startDate, endDate) ?? '', [startDate, endDate])
  const yearShortcutOptions = useMemo(() => buildYearShortcutOptions(), [])
  const referenceYearForMonth = useMemo(() => (shortcutYearValue ? Number.parseInt(shortcutYearValue, 10) : startDate.getFullYear()), [shortcutYearValue, startDate])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next)
  }
  const togglePlatform = (platform: SalesChannel) => {
    const current = params.getAll('platform')
    const next = new URLSearchParams(params)
    next.delete('platform')
    const set = new Set(current)
    if (set.has(platform)) set.delete(platform)
    else set.add(platform)
    for (const value of set) next.append('platform', value)
    setParams(next)
  }
  const selectAllPlatforms = () => {
    const next = new URLSearchParams(params)
    next.delete('platform')
    setParams(next)
  }
  const [detailsPage, setDetailsPage] = useState(1)
  const [detailsSearch, setDetailsSearch] = useState('')
  const [detailsSortBy, setDetailsSortBy] = useState('period_start')
  const [detailsSortDir, setDetailsSortDir] = useState<'asc' | 'desc'>('desc')
  const detailsPageSize = 15
  const [utilityBarLayout, setUtilityBarLayout] = useState<'grouped' | 'stacked'>('stacked')
  const [overlayBarLayout, setOverlayBarLayout] = useState<'grouped' | 'stacked'>('stacked')
  const [overlayMetricsVisible, setOverlayMetricsVisible] = useState<MetricVisibility>({
    gross: true,
    net: true,
    profit: true,
    margin: true,
  })
  const [utilityMetricsVisible, setUtilityMetricsVisible] = useState<MetricVisibility>({
    gross: true,
    net: true,
    profit: true,
    margin: true,
  })
  const [productsSkuSearch, setProductsSkuSearch] = useState('')
  const [productsSkuPage, setProductsSkuPage] = useState(1)
  const [drilldown, setDrilldown] = useState<DrilldownSelection | null>(null)
  const [drillChannelMetricsVisible, setDrillChannelMetricsVisible] = useState<MetricVisibility>({
    gross: true,
    net: true,
    profit: true,
    margin: true,
  })
  const productsPageSize = 10

  const summaryQuery = useAnalyticsSummary(filters)
  const totalSeriesQuery = useAnalyticsDaily(filters)
  const monthlySeriesQuery = useAnalyticsDaily({ ...filters, granularity: 'monthly' })
  const shopifySeriesQuery = useAnalyticsDaily({ ...filters, platform: ['shopify'] })
  const amazonSeriesQuery = useAnalyticsDaily({ ...filters, platform: ['amazon'] })
  const mlSeriesQuery = useAnalyticsDaily({ ...filters, platform: ['mercadolibre'] })
  const salesByBrandQuery = useSalesByBrand(filters)
  const productsInsightsQuery = useProductsInsights({ ...filters, limit: 15 })
  const productsSkuQuery = useProductsSkuTable({
    ...filters,
    search: productsSkuSearch,
    page: productsSkuPage,
    page_size: productsPageSize,
  })
  const detailedQuery = useSalesDetailedTable({
    ...filters,
    search: detailsSearch,
    page: detailsPage,
    page_size: detailsPageSize,
    sort_by: detailsSortBy,
    sort_dir: detailsSortDir,
  })

  const drillFilters = useMemo(() => {
    if (!drilldown) return null
    const range = periodRangeFromGranularity(drilldown.periodKey, granularity)
    return {
      start_date: range.start,
      end_date: range.end,
      granularity,
      platform: selectedPlatforms,
    } satisfies AnalyticsFilters
  }, [drilldown, granularity, selectedPlatforms])

  const drillSummaryQuery = useAnalyticsSummary(
    drillFilters ?? {
      start_date: toIso(startDate),
      end_date: toIso(endDate),
      granularity,
      platform: selectedPlatforms,
    },
  )
  const drillShopifyQuery = useAnalyticsDaily(
    drillFilters
      ? { ...drillFilters, platform: ['shopify'] }
      : { start_date: toIso(startDate), end_date: toIso(endDate), granularity, platform: ['shopify'] },
  )
  const drillAmazonQuery = useAnalyticsDaily(
    drillFilters
      ? { ...drillFilters, platform: ['amazon'] }
      : { start_date: toIso(startDate), end_date: toIso(endDate), granularity, platform: ['amazon'] },
  )
  const drillMlQuery = useAnalyticsDaily(
    drillFilters
      ? { ...drillFilters, platform: ['mercadolibre'] }
      : { start_date: toIso(startDate), end_date: toIso(endDate), granularity, platform: ['mercadolibre'] },
  )
  const drillTopProductsQuery = useAnalyticsProducts(
    drillFilters
      ? { start_date: drillFilters.start_date, end_date: drillFilters.end_date, granularity: drillFilters.granularity, limit: 5 }
      : { start_date: toIso(startDate), end_date: toIso(endDate), granularity, limit: 5 },
  )

  const platformSeries = useMemo(() => ({
    shopify: shopifySeriesQuery.data?.series ?? [],
    amazon: amazonSeriesQuery.data?.series ?? [],
    mercadolibre: mlSeriesQuery.data?.series ?? [],
  }), [shopifySeriesQuery.data, amazonSeriesQuery.data, mlSeriesQuery.data])

  const overlayData = useMemo(() => {
    const periodKeys = new Set<string>()
    for (const c of activePlatforms) {
      for (const pt of platformSeries[c]) periodKeys.add(pt.period_start)
    }
    return Array.from(periodKeys).sort().map((periodKey) => {
      const grossByChannel = { shopify: 0, amazon: 0, mercadolibre: 0 } as Record<SalesChannel, number>
      const netByChannel = { shopify: 0, amazon: 0, mercadolibre: 0 } as Record<SalesChannel, number>
      const profitByChannel = { shopify: 0, amazon: 0, mercadolibre: 0 } as Record<SalesChannel, number>
      const marginPctByChannel = { shopify: 0, amazon: 0, mercadolibre: 0 } as Record<SalesChannel, number>
      for (const c of activePlatforms) {
        const point = platformSeries[c].find((pt) => pt.period_start === periodKey)
        grossByChannel[c] = point ? Number(point.gross_revenue) : 0
        netByChannel[c] = point ? Number(point.net_revenue) : 0
        profitByChannel[c] = point ? Number(point.gross_profit) : 0
        marginPctByChannel[c] = point ? Number(point.margin_pct) : 0
      }
      return {
        periodKey,
        periodLabel: fmtDateByLanguage(periodKey, lang),
        grossByChannel,
        netByChannel,
        profitByChannel,
        marginPctByChannel,
      } satisfies OverlaySalesDatum
    })
  }, [activePlatforms, platformSeries, lang])

  const trendRows = useMemo(
    () =>
      (totalSeriesQuery.data?.series ?? []).map((pt) => {
        const gross_revenue = Number(pt.gross_revenue)
        const net_revenue = Number(pt.net_revenue)
        const gross_profit = Number(pt.gross_profit)
        const maxPositive = Math.max(0, gross_revenue, net_revenue, gross_profit)
        const minNegative = Math.min(0, gross_revenue, net_revenue, gross_profit)
        return {
          period_key: pt.period_start,
          period: fmtDateByLanguage(pt.period_start, lang),
          gross_revenue,
          net_revenue,
          gross_profit,
          margin_pct: Number(pt.margin_pct),
          utilityNestedScale: Math.max(maxPositive, Math.abs(minNegative)),
          utilityNestedMin: minNegative,
        }
      }),
    [totalSeriesQuery.data, lang],
  )
  const utilityTrendRows = useMemo(
    () =>
      trendRows.map((row) => {
        const g = utilityMetricsVisible.gross ? row.gross_revenue : 0
        const n = utilityMetricsVisible.net ? row.net_revenue : 0
        const p = utilityMetricsVisible.profit ? row.gross_profit : 0
        const maxPositive = Math.max(0, g, n, p)
        const minNegative = Math.min(0, g, n, p)
        return {
          ...row,
          utilityNestedScale: Math.max(maxPositive, Math.abs(minNegative)),
          utilityNestedMin: minNegative,
        }
      }),
    [trendRows, utilityMetricsVisible],
  )

  const momRows = useMemo(() => {
    const s = monthlySeriesQuery.data?.series ?? []
    const rows: { period: string; mom_pct: number }[] = []
    for (let i = 0; i < s.length; i += 1) {
      const curr = Number(s[i].net_revenue)
      const prev = i > 0 ? Number(s[i - 1].net_revenue) : 0
      const mom = prev === 0 ? 0 : ((curr - prev) / prev) * 100
      rows.push({ period: fmtDateByLanguage(s[i].period_start, lang), mom_pct: Number(mom.toFixed(1)) })
    }
    return rows
  }, [monthlySeriesQuery.data, lang])

  const brandRows = useMemo(() => (salesByBrandQuery.data?.items ?? []).slice(0, 10).map((item) => ({
    brand: item.brand,
    net_revenue: Number(item.net_revenue),
  })), [salesByBrandQuery.data])

  const productsTopRows = useMemo(
    () => toTopProductChartRows(productsInsightsQuery.data?.top_products ?? []).slice(0, 15),
    [productsInsightsQuery.data],
  )
  const productsTopMarginRows = useMemo(
    () => toMarginChartRows(productsInsightsQuery.data?.top_margin ?? []).reverse(),
    [productsInsightsQuery.data],
  )
  const productsBottomMarginRows = useMemo(
    () => toMarginChartRows(productsInsightsQuery.data?.bottom_margin ?? []).reverse(),
    [productsInsightsQuery.data],
  )
  const productsChannels = useMemo<string[]>(
    () => productsInsightsQuery.data?.channels ?? [...activePlatforms],
    [productsInsightsQuery.data, activePlatforms],
  )
  const productsHeatmapRows = useMemo(
    () => toHeatmapRows(productsInsightsQuery.data?.heatmap ?? [], productsChannels),
    [productsInsightsQuery.data, productsChannels],
  )
  const productsHeatmapMax = useMemo(
    () => maxHeatmapValue(productsHeatmapRows, productsChannels),
    [productsHeatmapRows, productsChannels],
  )

  const productsSkuColumns = useMemo<DataTableColumn<ProductInsight>[]>(
    () => [
      { key: 'title', header: t('productsTableProduct'), cell: (row) => row.title },
      { key: 'internal_sku', header: t('productsTableSku'), mono: true, cell: (row) => row.internal_sku ?? '—' },
      { key: 'total_revenue', header: t('productsRevenue'), align: 'right', cell: (row) => formatCurrency(row.total_revenue) },
      { key: 'total_units', header: t('productsUnits'), align: 'right', cell: (row) => row.total_units.toLocaleString() },
      { key: 'cogs_total', header: t('productsCogs'), align: 'right', cell: (row) => formatCurrency(row.cogs_total) },
      {
        key: 'margin_pct',
        header: t('productsMargin'),
        align: 'right',
        cell: (row) => `${Number(row.margin_pct ?? 0).toFixed(1)}%`,
      },
    ],
    [formatCurrency, t],
  )

  const drillSummary = drillSummaryQuery.data?.current
  const drillKpis = useMemo(() => {
    if (!drillSummary) return []
    return [
      { label: t('kpiGross'), value: formatCurrency(drillSummary.gross_revenue), color: '#9CCBFF' },
      { label: t('kpiNet'), value: formatCurrency(drillSummary.net_revenue), color: '#5b8cff' },
      { label: t('kpiGrossProfit'), value: formatCurrency(drillSummary.gross_profit), color: '#66bb6a' },
      { label: t('kpiMargin'), value: fmtPct(drillSummary.margin_pct), color: '#a78bfa' },
      { label: t('costCogs'), value: formatCurrency(drillSummary.cogs), color: '#f87171' },
      { label: t('costCommission'), value: formatCurrency(drillSummary.channel_commission), color: '#ffb74d' },
      { label: t('salesTableOrders'), value: Number(drillSummary.order_count).toLocaleString(), color: '#f0f2f8' },
      { label: t('kpiReceived'), value: formatCurrency(drillSummary.disbursement), color: '#66bb6a' },
    ]
  }, [drillSummary, t, formatCurrency])

  const drillChannelRows = useMemo(() => {
    const pointFor = (series: { series: { gross_revenue: string; net_revenue: string; gross_profit: string }[] } | undefined) => {
      const row = series?.series?.[0]
      return {
        gross_revenue: row ? Number(row.gross_revenue) : 0,
        net_revenue: row ? Number(row.net_revenue) : 0,
        gross_profit: row ? Number(row.gross_profit) : 0,
      }
    }
    const sh = pointFor(drillShopifyQuery.data)
    const amz = pointFor(drillAmazonQuery.data)
    const ml = pointFor(drillMlQuery.data)
    return [
      { channel: 'Shopify', ...sh },
      { channel: 'Amazon', ...amz },
      { channel: 'Mercado Libre', ...ml },
    ].filter((row) => {
      const ch = row.channel === 'Shopify' ? 'shopify' : row.channel === 'Amazon' ? 'amazon' : 'mercadolibre'
      return activePlatforms.includes(ch as SalesChannel)
    }).map((row) => ({
      channel: row.channel,
      gross_revenue: drillChannelMetricsVisible.gross ? row.gross_revenue : 0,
      net_revenue: drillChannelMetricsVisible.net ? row.net_revenue : 0,
      gross_profit: drillChannelMetricsVisible.profit ? row.gross_profit : 0,
    }))
  }, [drillShopifyQuery.data, drillAmazonQuery.data, drillMlQuery.data, activePlatforms, drillChannelMetricsVisible])

  const drillMixData = useMemo(
    () =>
      [
        { name: PLATFORM_LABELS.shopify, value: Number(drillShopifyQuery.data?.series?.[0]?.net_revenue ?? 0) },
        { name: PLATFORM_LABELS.amazon, value: Number(drillAmazonQuery.data?.series?.[0]?.net_revenue ?? 0) },
        { name: PLATFORM_LABELS.mercadolibre, value: Number(drillMlQuery.data?.series?.[0]?.net_revenue ?? 0) },
      ].filter((r) => r.value > 0),
    [drillShopifyQuery.data, drillAmazonQuery.data, drillMlQuery.data],
  )
  const drillTopProductsRows = useMemo(
    () =>
      (drillTopProductsQuery.data?.products ?? []).slice(0, 15).map((item) => ({
        name: item.internal_sku ? `${item.title} (${item.internal_sku})` : item.title,
        shopify: Number(item.revenue_by_platform.shopify ?? 0),
        amazon: Number(item.revenue_by_platform.amazon ?? 0),
        mercadolibre: Number(item.revenue_by_platform.mercadolibre ?? 0),
      })).slice(0, 5),
    [drillTopProductsQuery.data],
  )
  const drillCostMix = useMemo(() => {
    if (!drillSummary) return []
    return [
      { name: t('costAds'), value: Math.abs(Number(drillSummary.ads_spend)) },
      { name: t('costCommission'), value: Math.abs(Number(drillSummary.channel_commission)) },
      { name: t('costCogs'), value: Math.abs(Number(drillSummary.cogs)) },
      { name: t('costShipping'), value: Math.abs(Number(drillSummary.shipping_cost)) },
    ].filter((row) => row.value > 0)
  }, [drillSummary, t])

  const detailedRows = useMemo(() => {
    const channelLabel = (channel: string): string => {
      if (channel === 'shopify') return 'Shopify'
      if (channel === 'amazon') return 'Amazon'
      if (channel === 'mercadolibre') return 'Mercado Libre'
      return channel
    }
    return (detailedQuery.data?.items ?? []).map((row) => ({
      period: fmtDateByLanguage(row.period_start, lang),
      channel: channelLabel(row.channel),
      gross: Number(row.gross_revenue),
      net: Number(row.net_revenue),
      orders: row.order_count,
      units: row.units_sold,
      profit: Number(row.gross_profit),
      margin: Number(row.margin_pct),
    }))
  }, [detailedQuery.data, lang])

  const detailedColumns = useMemo<DataTableColumn<(typeof detailedRows)[number]>[]>(
    () => [
      { key: 'period', header: t('salesTablePeriod'), cell: (row) => row.period },
      {
        key: 'channel',
        header: t('modalChannel'),
        cell: (row) => (
          <StateTag
            label={row.channel}
            tone={
              row.channel === 'Shopify'
                ? 'shopify'
                : row.channel === 'Amazon'
                  ? 'amazon'
                  : row.channel === 'Mercado Libre'
                    ? 'mercadolibre'
                    : 'neutral'
            }
          />
        ),
      },
      { key: 'gross', header: t('kpiGross'), align: 'right', cell: (row) => formatCurrency(row.gross) },
      { key: 'net', header: t('kpiNet'), align: 'right', cell: (row) => formatCurrency(row.net) },
      {
        key: 'orders',
        header: t('salesTableOrders'),
        align: 'right',
        cell: (row) => row.orders.toLocaleString(),
      },
      {
        key: 'units',
        header: t('productsUnits'),
        align: 'right',
        cell: (row) => row.units.toLocaleString(),
      },
      {
        key: 'profit',
        header: t('kpiGrossProfit'),
        align: 'right',
        cell: (row) => formatCurrency(row.profit),
      },
      {
        key: 'margin',
        header: t('kpiMargin'),
        align: 'right',
        cell: (row) => `${row.margin.toFixed(1)}%`,
      },
    ],
    [t, formatCurrency],
  )

  const loadingMain =
    summaryQuery.isLoading ||
    totalSeriesQuery.isLoading ||
    shopifySeriesQuery.isLoading ||
    amazonSeriesQuery.isLoading ||
    mlSeriesQuery.isLoading

  const openUtilityDrilldown = (row: UtilityTrendDatum) => {
    setDrilldown({ periodKey: row.period_key, periodLabel: row.period })
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{t('pageTitle')}</h1>
        <p className="text-sm text-text-secondary">{t('salesPageDesc')}</p>
      </div>

      <DashboardFiltersBar
        t={t}
        locale={locale}
        sticky
        startDate={startDate}
        endDate={endDate}
        onStartChange={(d) => setParam('start', toIso(d))}
        onEndChange={(d) => setParam('end', toIso(d))}
        shortcutYearValue={shortcutYearValue}
        yearShortcutOptions={yearShortcutOptions}
        onYearShortcut={(year) => {
          const y = Number.parseInt(year, 10)
          if (Number.isNaN(y)) return
          const next = new URLSearchParams(params)
          next.set('start', toLocalIsoDate(new Date(y, 0, 1)))
          next.set('end', toLocalIsoDate(new Date(y, 11, 31)))
          setParams(next)
        }}
        shortcutMonthValue={shortcutMonthValue}
        referenceYearForMonth={referenceYearForMonth}
        onMonthShortcut={(ym) => {
          const [ys, ms] = ym.split('-')
          const y = Number.parseInt(ys ?? '', 10)
          const m = Number.parseInt(ms ?? '', 10) - 1
          if (Number.isNaN(y) || Number.isNaN(m) || m < 0 || m > 11) return
          const next = new URLSearchParams(params)
          next.set('start', toLocalIsoDate(new Date(y, m, 1)))
          next.set('end', toLocalIsoDate(new Date(y, m + 1, 0)))
          setParams(next)
        }}
        platforms={PLATFORMS}
        platformLabels={PLATFORM_LABELS}
        selectedPlatforms={selectedPlatforms}
        onTogglePlatform={togglePlatform}
        onSelectAllPlatforms={selectAllPlatforms}
        granularity={granularity}
        onGranularityChange={(v) => setParam('granularity', v)}
      />

      {loadingMain || !summaryQuery.data ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label={t('kpiGross')} value={formatCurrencyValue(summaryQuery.data.current.gross_revenue)} currency={displayCurrency} />
          <MetricCard variant="accent" label={t('kpiNet')} value={formatCurrencyValue(summaryQuery.data.current.net_revenue)} currency={displayCurrency} />
          <MetricCard label={t('kpiGrossProfit')} value={formatCurrencyValue(summaryQuery.data.current.gross_profit)} currency={displayCurrency} />
          <MetricCard label={t('kpiMargin')} value={fmtPct(summaryQuery.data.current.margin_pct)} />
          <MetricCard label={t('kpiReceived')} value={formatCurrencyValue(summaryQuery.data.current.disbursement)} currency={displayCurrency} />
        </section>
      )}

      <Card variant="solid">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('overlayTitle')}</CardTitle>
          <CardAction>
            <Tabs
              value={overlayBarLayout}
              onValueChange={(v) => {
                if (v === 'grouped' || v === 'stacked') setOverlayBarLayout(v)
              }}
              aria-label={t('overlayTitle')}
            >
              <TabsList className="h-8 gap-0 rounded-lg border border-border-subtle bg-white/3 p-0.5">
                <TabsTrigger value="stacked" className="h-[calc(100%-2px)] rounded-md px-2.5 text-[11px] font-medium data-active:bg-accent/15 data-active:text-accent-light">
                  {t('chartViewStacked')}
                </TabsTrigger>
                <TabsTrigger value="grouped" className="h-[calc(100%-2px)] rounded-md px-2.5 text-[11px] font-medium data-active:bg-accent/15 data-active:text-accent-light">
                  {t('chartViewGrouped')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardAction>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingMain ? (
            <Skeleton className="h-[340px] w-full rounded-xl" />
          ) : (
            <OverlaySalesByChannelPanel
              data={overlayData}
              channels={activePlatforms as OverlaySalesChannel[]}
              channelLabels={PLATFORM_LABELS}
              colorsByChannel={COLORS_BY_CHANNEL}
              grossLabel={t('legendGross')}
              netLabel={t('legendNet')}
              tooltipRows={{
                gross: t('traceGrossRevenue'),
                net: t('traceNetRevenue'),
                profit: t('traceGrossProfit'),
                margin: t('traceMarginPct'),
              }}
              barLayout={overlayBarLayout}
              visibilityMenuLabel={t('overlayVisibilityMenu')}
              visibilityMenuTitle={t('overlayVisibilityTitle')}
              visibilityGrossNetOptionLabel={t('overlayVisibilityGrossNet')}
              visibilityChannelsSectionLabel={t('overlayVisibilityChannels')}
              seriesVisible={overlayMetricsVisible}
              onSelect={() => {}}
            />
          )}
          <MetricToggleLegend
            items={[
              { key: 'gross', label: t('traceGrossRevenue'), color: '#9CCBFF' },
              { key: 'net', label: t('traceNetRevenue'), color: '#5b8cff' },
            ]}
            visibility={overlayMetricsVisible}
            onToggle={(key) => setOverlayMetricsVisible((prev) => ({ ...prev, [key]: !prev[key] }))}
          />
        </CardContent>
      </Card>

      <Card variant="solid">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('salesUtilityMarginTitle')}</CardTitle>
          <CardAction>
            <Tabs
              value={utilityBarLayout}
              onValueChange={(v) => {
                if (v === 'grouped' || v === 'stacked') setUtilityBarLayout(v)
              }}
              aria-label={t('salesUtilityMarginTitle')}
            >
              <TabsList className="h-8 gap-0 rounded-lg border border-border-subtle bg-white/3 p-0.5">
                <TabsTrigger value="stacked" className="h-[calc(100%-2px)] rounded-md px-2.5 text-[11px] font-medium data-active:bg-accent/15 data-active:text-accent-light">
                  {t('chartViewStacked')}
                </TabsTrigger>
                <TabsTrigger value="grouped" className="h-[calc(100%-2px)] rounded-md px-2.5 text-[11px] font-medium data-active:bg-accent/15 data-active:text-accent-light">
                  {t('chartViewGrouped')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardAction>
        </CardHeader>
        <CardContent className="pt-0">
          {totalSeriesQuery.isLoading ? (
            <Skeleton className="h-[320px] w-full rounded-xl" />
          ) : (
            <div className={cn('h-[320px]', chartPlotSurfaceClassName)}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={utilityTrendRows}>
                  <CartesianGrid strokeDasharray="0" stroke="var(--chart-grid)" strokeOpacity={0.65} vertical />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} width={56} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${Number(v).toFixed(1)}%`} width={60} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    content={(props) => (
                      <UtilityMarginChartTooltip
                        {...props}
                        formatCurrency={formatCurrency}
                        t={t}
                        metricsVisible={utilityMetricsVisible}
                      />
                    )}
                  />
                  {utilityBarLayout === 'grouped' ? (
                    <>
                      <Bar
                        dataKey="gross_revenue"
                        name={t('traceGrossRevenue')}
                        fill="#9CCBFF"
                        fillOpacity={0.9}
                        shape={utilGroupedSignedShape}
                        isAnimationActive
                        animationDuration={280}
                        hide={!utilityMetricsVisible.gross}
                        onClick={(_, idx) => {
                          const row = utilityTrendRows[idx]
                          if (row) openUtilityDrilldown(row)
                        }}
                      />
                      <Bar
                        dataKey="net_revenue"
                        name={t('traceNetRevenue')}
                        fill="rgba(91,140,255,0.55)"
                        shape={utilGroupedSignedShape}
                        isAnimationActive
                        animationDuration={280}
                        hide={!utilityMetricsVisible.net}
                        onClick={(_, idx) => {
                          const row = utilityTrendRows[idx]
                          if (row) openUtilityDrilldown(row)
                        }}
                      />
                      <Bar
                        dataKey="gross_profit"
                        name={t('traceGrossProfit')}
                        fill="#66bb6a"
                        shape={utilGroupedSignedShape}
                        isAnimationActive
                        animationDuration={280}
                        hide={!utilityMetricsVisible.profit}
                        onClick={(_, idx) => {
                          const row = utilityTrendRows[idx]
                          if (row) openUtilityDrilldown(row)
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <Bar
                        dataKey="utilityNestedMin"
                        legendType="none"
                        fill="transparent"
                        stroke="none"
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="utilityNestedScale"
                        legendType="none"
                        fill="transparent"
                        stroke="none"
                        isAnimationActive
                        animationDuration={280}
                        shape={(props) => utilNestedBarsShape(props, utilityMetricsVisible)}
                        onClick={(_, idx) => {
                          const row = utilityTrendRows[idx]
                          if (row) openUtilityDrilldown(row)
                        }}
                      />
                    </>
                  )}
                  <Line yAxisId="right" type="monotone" dataKey="margin_pct" name={t('traceMarginPct')} stroke="#f87171" strokeWidth={2} hide={!utilityMetricsVisible.margin} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          <MetricToggleLegend
            items={[
              { key: 'gross', label: t('traceGrossRevenue'), color: '#9CCBFF' },
              { key: 'net', label: t('traceNetRevenue'), color: '#5b8cff' },
              { key: 'profit', label: t('traceGrossProfit'), color: '#66bb6a' },
              { key: 'margin', label: t('traceMarginPct'), color: '#f87171', dashed: true },
            ]}
            visibility={utilityMetricsVisible}
            onToggle={(key) => setUtilityMetricsVisible((prev) => ({ ...prev, [key]: !prev[key] }))}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card variant="solid">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('salesMomTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {monthlySeriesQuery.isLoading ? (
              <Skeleton className="h-[260px] w-full rounded-xl" />
            ) : (
              <div className={cn('h-[260px]', chartPlotSurfaceClassName)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={momRows}>
                    <CartesianGrid strokeDasharray="0" stroke="var(--chart-grid)" strokeOpacity={0.65} />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(v) => `${Number(v).toFixed(1)}%`} />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                      cursor={{ fill: 'transparent' }}
                      formatter={(value) => [`${Number(value).toFixed(1)}%`, 'MoM %']}
                    />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.45)" strokeDasharray="4 4" />
                    <Bar dataKey="mom_pct" radius={[5, 5, 0, 0]}>
                      {momRows.map((row, idx) => (
                        <Cell key={`mom-${idx}`} fill={row.mom_pct < 0 ? '#f87171' : '#66bb6a'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="solid">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('salesByBrandTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {salesByBrandQuery.isLoading ? (
              <Skeleton className="h-[260px] w-full rounded-xl" />
            ) : (
              <div className={cn('h-[260px]', chartPlotSurfaceClassName)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brandRows}>
                    <CartesianGrid strokeDasharray="0" stroke="var(--chart-grid)" strokeOpacity={0.65} vertical />
                    <XAxis dataKey="brand" />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                      cursor={{ fill: 'transparent' }}
                      formatter={(value) => [formatCurrency(Number(value)), t('kpiNet')]}
                    />
                    <Bar dataKey="net_revenue" fill="#a78bfa" name={t('kpiNet')} radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-text-primary">{t('productsPageTitle')}</h2>
        <Card variant="solid">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('productsTopTitle')}</CardTitle>
            <p className="text-[11px] text-text-tertiary">{t('productsTopSubtitle')}</p>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            {productsInsightsQuery.isLoading ? (
              <Skeleton className="h-[500px] w-full rounded-xl" />
            ) : (
              <div className={cn('h-[500px]', chartPlotSurfaceClassName)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productsTopRows} layout="vertical" margin={{ top: 8, right: 10, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 8" stroke="var(--chart-grid)" strokeOpacity={0.45} />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} minTickGap={24} />
                    <YAxis type="category" dataKey="name" width={210} tick={{ fontSize: 11 }} interval={0} />
                    <Tooltip
                      contentStyle={{ ...tooltipContentStyle, border: '1px solid var(--border-subtle)' }}
                      formatter={(value) => formatCurrency(Number(value))}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="shopify" name={PLATFORM_LABELS.shopify} stackId="sales" fill={COLORS_BY_CHANNEL.shopify} radius={[0, 3, 3, 0]} fillOpacity={0.9} />
                    <Bar dataKey="amazon" name={PLATFORM_LABELS.amazon} stackId="sales" fill={COLORS_BY_CHANNEL.amazon} radius={[0, 3, 3, 0]} fillOpacity={0.9} />
                    <Bar dataKey="mercadolibre" name={PLATFORM_LABELS.mercadolibre} stackId="sales" fill={COLORS_BY_CHANNEL.mercadolibre} radius={[0, 3, 3, 0]} fillOpacity={0.9} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card variant="solid">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('productsTopMarginTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ProductsMarginBarChart rows={productsTopMarginRows} color="#66bb6a" />
            </CardContent>
          </Card>
          <Card variant="solid">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('productsBottomMarginTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ProductsMarginBarChart rows={productsBottomMarginRows} color="#f87171" />
            </CardContent>
          </Card>
        </div>

        <Card variant="solid">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('productsHeatmapTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[420px] overflow-auto rounded-lg border border-border-subtle/60">
              <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr>
                    <th className="sticky left-0 z-20 min-w-[320px] border-b border-border-subtle bg-card px-3 py-2 text-left text-xs text-text-tertiary uppercase">
                      {t('productsTableProduct')}
                    </th>
                    {productsChannels.map((channel) => (
                      <th key={channel} className="border-b border-border-subtle bg-card px-3 py-2 text-center text-xs text-text-tertiary uppercase">
                        {PLATFORM_LABELS[channel as keyof typeof PLATFORM_LABELS] ?? channel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productsHeatmapRows.map((row) => (
                    <tr key={row.product_id} className="group border-b border-border-subtle/40 hover:bg-accent/5">
                      <td className="sticky left-0 z-10 max-w-[320px] truncate border-b border-border-subtle/40 bg-card px-3 py-2 text-text-secondary group-hover:bg-accent/5">
                        {row.title}
                      </td>
                      {productsChannels.map((channel) => {
                        const value = row.values[channel] ?? 0
                        const intensity = productsHeatmapMax > 0 ? Math.pow(value / productsHeatmapMax, 0.6) : 0
                        const bgAlpha = 0.08 + intensity * 0.72
                        return (
                          <td key={`${row.product_id}-${channel}`} className="border-b border-border-subtle/40 px-2 py-1.5 group-hover:bg-accent/5">
                            <div
                              className="rounded-sm px-2 py-2 text-center font-mono text-[11px]"
                              style={{
                                backgroundColor: `rgba(91,140,255,${bgAlpha})`,
                                color: intensity > 0.6 ? '#f8fafc' : 'var(--text-primary)',
                              }}
                            >
                              {formatCurrency(value)}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card variant="solid">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('productsSkuTableTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="max-w-sm">
              <Input
                value={productsSkuSearch}
                onChange={(event) => {
                  setProductsSkuSearch(event.target.value)
                  setProductsSkuPage(1)
                }}
                placeholder={t('productsFilterSkuPlaceholder')}
                className="h-9"
              />
            </div>
            <PaginatedDataTable
              columns={productsSkuColumns}
              rows={productsSkuQuery.data?.items ?? []}
              getRowKey={(row) => row.product_id}
              page={productsSkuPage}
              pageSize={productsPageSize}
              total={productsSkuQuery.data?.pagination.total ?? 0}
              onPageChange={setProductsSkuPage}
              emptyContent={t('productsNoData')}
              isLoading={productsSkuQuery.isFetching}
            />
          </CardContent>
        </Card>
      </section>

      <Card variant="solid">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('salesDetailedTableTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingMain ? (
            <Skeleton className="h-[300px] w-full rounded-xl" />
          ) : (
            <div className="space-y-3">
              <div className="max-w-sm">
                <Input
                  value={detailsSearch}
                  onChange={(event) => {
                    setDetailsSearch(event.target.value)
                    setDetailsPage(1)
                  }}
                  placeholder={t('productsFilterSkuPlaceholder')}
                  className="h-9"
                />
              </div>
              <PaginatedDataTable
                columns={detailedColumns}
                rows={detailedRows}
                getRowKey={(row, idx) => `${row.channel}-${row.period}-${idx}`}
                page={detailsPage}
                pageSize={detailsPageSize}
                total={detailedQuery.data?.pagination.total ?? 0}
                onPageChange={setDetailsPage}
                emptyContent={t('productsNoData')}
                isLoading={detailedQuery.isFetching}
                sortBy={
                  {
                    period_start: 'period',
                    channel: 'channel',
                    gross_revenue: 'gross',
                    net_revenue: 'net',
                    order_count: 'orders',
                    units_sold: 'units',
                    gross_profit: 'profit',
                    margin_pct: 'margin',
                  }[detailsSortBy] ?? 'period'
                }
                sortDir={detailsSortDir}
                onSortChange={(key) => {
                  const map: Record<string, string> = {
                    period: 'period_start',
                    channel: 'channel',
                    gross: 'gross_revenue',
                    net: 'net_revenue',
                    orders: 'order_count',
                    units: 'units_sold',
                    profit: 'gross_profit',
                    margin: 'margin_pct',
                  }
                  const nextSortBy = map[key] ?? 'period_start'
                  if (detailsSortBy === nextSortBy) {
                    setDetailsSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                  } else {
                    setDetailsSortBy(nextSortBy)
                    setDetailsSortDir('desc')
                  }
                  setDetailsPage(1)
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(drilldown)} onOpenChange={(open) => {
        if (!open) setDrilldown(null)
      }}>
        <DialogContent className="h-[90vh] w-[96vw] max-w-[1600px]! sm:max-w-[1600px]! overflow-y-auto bg-card p-5 text-text-primary" showCloseButton>
          <DialogHeader>
            <DialogTitle>{drilldown ? `Desglose: ${drilldown.periodLabel}` : ''}</DialogTitle>
          </DialogHeader>
          {drillSummaryQuery.isLoading ? (
            <Skeleton className="h-[260px] w-full rounded-xl" />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {drillKpis.map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-border-subtle bg-white/2 p-3">
                    <div className="text-[11px] text-text-tertiary">{kpi.label}</div>
                    <div className="mt-1 text-sm font-semibold" style={{ color: kpi.color }}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card variant="solid">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-xs">Ventas por canal</CardTitle>
                        <MetricToggleLegend
                          items={[
                            { key: 'gross', label: t('traceGrossRevenue'), color: '#9CCBFF' },
                            { key: 'net', label: t('traceNetRevenue'), color: '#5b8cff' },
                            { key: 'profit', label: t('traceGrossProfit'), color: '#66bb6a' },
                          ]}
                          visibility={drillChannelMetricsVisible}
                          onToggle={(key) =>
                            setDrillChannelMetricsVisible((prev) => ({ ...prev, [key]: !prev[key] }))
                          }
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className={cn('h-[300px]', chartPlotSurfaceClassName)}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={drillChannelRows}>
                            <CartesianGrid strokeDasharray="3 8" stroke="var(--chart-grid)" strokeOpacity={0.45} />
                            <XAxis dataKey="channel" />
                            <YAxis tickFormatter={(v) => formatCurrency(v)} />
                            <Tooltip
                              contentStyle={{ ...tooltipContentStyle, border: '1px solid var(--border-subtle)' }}
                              cursor={{ fill: 'transparent' }}
                              formatter={(v) => formatCurrency(Number(v))}
                            />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.35)" />
                            <Bar
                              dataKey="gross_revenue"
                              name={t('traceGrossRevenue')}
                              fill="#9CCBFF"
                              fillOpacity={0.45}
                              shape={utilGroupedSignedShape}
                            />
                            <Bar
                              dataKey="net_revenue"
                              name={t('traceNetRevenue')}
                              fill="#5b8cff"
                              fillOpacity={0.75}
                              shape={utilGroupedSignedShape}
                            />
                            <Bar
                              dataKey="gross_profit"
                              name={t('traceGrossProfit')}
                              fill="#66bb6a"
                              fillOpacity={0.9}
                              shape={utilGroupedSignedShape}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card variant="solid">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">{t('reportsSalesMixTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <PieChartPanel
                      data={drillMixData}
                      colorByName={{
                        [PLATFORM_LABELS.shopify]: COLORS_BY_CHANNEL.shopify,
                        [PLATFORM_LABELS.amazon]: COLORS_BY_CHANNEL.amazon,
                        [PLATFORM_LABELS.mercadolibre]: COLORS_BY_CHANNEL.mercadolibre,
                      }}
                      heightClassName="h-[250px]"
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card variant="solid" className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">{t('productsTopTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {drillTopProductsQuery.isLoading ? (
                      <Skeleton className="h-[280px] w-full rounded-xl" />
                    ) : drillTopProductsRows.length === 0 ? (
                      <div className="flex h-[280px] items-center justify-center text-sm text-text-secondary">{t('productsNoData')}</div>
                    ) : (
                      <div className={cn('h-[280px]', chartPlotSurfaceClassName)}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={drillTopProductsRows} layout="vertical" margin={{ top: 8, right: 10, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 8" stroke="var(--chart-grid)" strokeOpacity={0.45} />
                            <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11 }} minTickGap={24} />
                            <YAxis type="category" dataKey="name" width={220} tick={{ fontSize: 11 }} interval={0} />
                            <Tooltip
                              contentStyle={{ ...tooltipContentStyle, border: '1px solid var(--border-subtle)' }}
                              formatter={(value) => formatCurrency(Number(value))}
                              cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="mercadolibre" name={PLATFORM_LABELS.mercadolibre} stackId="sales" fill={COLORS_BY_CHANNEL.mercadolibre} radius={[0, 3, 3, 0]} fillOpacity={0.9} />
                            <Bar dataKey="amazon" name={PLATFORM_LABELS.amazon} stackId="sales" fill={COLORS_BY_CHANNEL.amazon} radius={[0, 3, 3, 0]} fillOpacity={0.9} />
                            <Bar dataKey="shopify" name={PLATFORM_LABELS.shopify} stackId="sales" fill={COLORS_BY_CHANNEL.shopify} radius={[0, 3, 3, 0]} fillOpacity={0.9} />
                            <Legend
                              verticalAlign="bottom"
                              align="center"
                              iconType="square"
                              iconSize={9}
                              wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-mono)', paddingTop: 8 }}
                              formatter={(value) => <span className="text-text-secondary">{value}</span>}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card variant="solid">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">Estructura de costos por canal y categoria</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <PieChartPanel data={drillCostMix} heightClassName="h-[250px]" />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductsMarginBarChart({
  rows,
  color,
}: {
  rows: { name: string; margin_pct: number }[]
  color: string
}) {
  return (
    <div className={cn('h-[235px]', chartPlotSurfaceClassName)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 12, left: 16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 8" stroke="var(--chart-grid)" strokeOpacity={0.45} />
          <XAxis type="number" tickFormatter={(v) => `${Number(v).toFixed(1)}%`} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11 }} interval={0} />
          <Tooltip
            contentStyle={{ ...tooltipContentStyle, border: '1px solid var(--border-subtle)' }}
            formatter={(value) => `${Number(value).toFixed(1)}%`}
            cursor={{ fill: 'transparent' }}
          />
          <Bar dataKey="margin_pct" fill={color} radius={[0, 3, 3, 0]} fillOpacity={0.92} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function MetricToggleLegend({
  items,
  visibility,
  onToggle,
}: {
  items: MetricToggleItem[]
  visibility: MetricVisibility
  onToggle: (key: keyof MetricVisibility) => void
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-1 text-[10px]">
      {items.map((item) => {
        const on = visibility[item.key]
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onToggle(item.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 font-mono transition-colors',
              'hover:border-border-subtle hover:bg-white/5',
              on ? 'text-text-secondary' : 'text-text-tertiary opacity-45',
            )}
            aria-pressed={on}
          >
            {item.dashed ? (
              <svg width={16} height={10} viewBox="0 0 16 10" aria-hidden className="shrink-0">
                <line x1={1} y1={5} x2={15} y2={5} stroke={item.color} strokeWidth={2} strokeDasharray="4 3 2 3" opacity={on ? 1 : 0.35} />
              </svg>
            ) : (
              <span
                className="inline-block size-2.5 shrink-0 rounded-sm border border-white/10"
                style={{ background: item.color, opacity: on ? 1 : 0.35 }}
              />
            )}
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

