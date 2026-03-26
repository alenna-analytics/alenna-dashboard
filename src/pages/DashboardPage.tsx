import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { BarShapeProps } from 'recharts'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
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
import { BAR_TOP_RADIUS, chartPlotSurfaceClassName, tooltipContentStyle } from '@/components/charts/chart-theme'
import { DashboardFiltersBar } from '@/components/composed/dashboard-filters-bar'
import type { DataTableColumn } from '@/components/composed/data-table'
import { MetricCard } from '@/components/composed/metric-card'
import { PaginatedDataTable } from '@/components/composed/paginated-data-table'
import { StateTag } from '@/components/composed/state-tag'
import { useCurrency } from '@/components/providers/currency-provider'
import { useLanguage } from '@/components/providers/language-provider'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalyticsDaily, useAnalyticsSummary, useSalesByBrand, useSalesDetailedTable } from '@/hooks/use-analytics'
import type { AnalyticsFilters } from '@/lib/analytics-types'
import { buildYearShortcutOptions, fullCalendarMonthValue, isFullCalendarYearRange } from '@/lib/dashboard-date-shortcuts'
import { COLORS_BY_CHANNEL, DASHBOARD_PLATFORMS, PLATFORM_LABELS, dashboardT, type DashboardSalesChannel, type DashboardStringKey } from '@/lib/dashboard-strings'
import { fmtDateByLanguage, fmtPct, toIso, toLocalIsoDate } from '@/lib/format'
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

type UtilityTrendDatum = {
  period: string
  gross_revenue: number
  net_revenue: number
  gross_profit: number
  margin_pct: number
  utilityNestedMax: number
}

type UtilityNestedMetricId = 'gross' | 'net' | 'profit'

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

function utilNestedBarsShape(props: BarShapeProps) {
  const p = props.payload as UtilityTrendDatum
  const { x, y, width, height } = props
  const g = Math.max(0, p.gross_revenue)
  const n = Math.max(0, p.net_revenue)
  const pr = Math.max(0, p.gross_profit)
  const m = Math.max(g, n, pr)
  if (m <= 0 || width <= 0 || height <= 0) return null
  const zeroY = y + height
  const triples = UTIL_NESTED_LAYERS.map((layer) => ({
    ...layer,
    value: layer.id === 'gross' ? g : layer.id === 'net' ? n : pr,
  })).filter((t) => t.value > 0)
  triples.sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value
    return UTIL_NESTED_TIE_ORDER[a.id] - UTIL_NESTED_TIE_ORDER[b.id]
  })
  return (
    <g>
      {triples.map((t) => {
        const h = (t.value / m) * height
        const yTop = zeroY - h
        return (
          <Rectangle
            key={t.id}
            x={x}
            y={yTop}
            width={width}
            height={h}
            fill={t.fill}
            fillOpacity={t.fillOpacity}
            radius={BAR_TOP_RADIUS}
          />
        )
      })}
    </g>
  )
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
): Omit<UtilityTrendDatum, 'utilityNestedMax'> | undefined {
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
}: {
  active?: boolean
  payload?: readonly unknown[]
  label?: unknown
  formatCurrency: (n: number) => string
  t: (key: DashboardStringKey) => string
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

  const summaryQuery = useAnalyticsSummary(filters)
  const totalSeriesQuery = useAnalyticsDaily(filters)
  const monthlySeriesQuery = useAnalyticsDaily({ ...filters, granularity: 'monthly' })
  const shopifySeriesQuery = useAnalyticsDaily({ ...filters, platform: ['shopify'] })
  const amazonSeriesQuery = useAnalyticsDaily({ ...filters, platform: ['amazon'] })
  const mlSeriesQuery = useAnalyticsDaily({ ...filters, platform: ['mercadolibre'] })
  const salesByBrandQuery = useSalesByBrand(filters)
  const detailedQuery = useSalesDetailedTable({
    ...filters,
    search: detailsSearch,
    page: detailsPage,
    page_size: detailsPageSize,
    sort_by: detailsSortBy,
    sort_dir: detailsSortDir,
  })

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
        return {
          period: fmtDateByLanguage(pt.period_start, lang),
          gross_revenue,
          net_revenue,
          gross_profit,
          margin_pct: Number(pt.margin_pct),
          utilityNestedMax: Math.max(gross_revenue, net_revenue, gross_profit),
        }
      }),
    [totalSeriesQuery.data, lang],
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
              onSelect={() => {}}
            />
          )}
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
                <ComposedChart data={trendRows}>
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
                        radius={BAR_TOP_RADIUS}
                      />
                      <Bar
                        dataKey="net_revenue"
                        name={t('traceNetRevenue')}
                        fill="rgba(91,140,255,0.55)"
                        radius={BAR_TOP_RADIUS}
                      />
                      <Bar
                        dataKey="gross_profit"
                        name={t('traceGrossProfit')}
                        fill="#66bb6a"
                        radius={BAR_TOP_RADIUS}
                      />
                    </>
                  ) : (
                    <Bar
                      dataKey="utilityNestedMax"
                      legendType="none"
                      fill="transparent"
                      stroke="none"
                      isAnimationActive={false}
                      shape={utilNestedBarsShape}
                    />
                  )}
                  <Line yAxisId="right" type="monotone" dataKey="margin_pct" name={t('traceMarginPct')} stroke="#f87171" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
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
    </div>
  )
}

