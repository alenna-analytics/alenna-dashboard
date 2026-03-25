import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/composed/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PieChartPanel } from '@/components/charts/pie-chart-panel'
import { BarChartPanel } from '@/components/charts/bar-chart-panel'
import { MonthlyEvolutionPanel } from '@/components/charts/monthly-evolution-panel'
import { MarginByChannelPanel } from '@/components/charts/margin-by-channel-panel'
import { PnlWaterfallPanel } from '@/components/charts/pnl-waterfall-panel'
import {
  OverlaySalesByChannelPanel,
  type OverlaySalesDatum,
  type OverlaySalesSelection,
  type SalesChannel as OverlaySalesChannel,
} from '@/components/charts/overlay-sales-by-channel-panel'
import { ChannelBadge } from '@/components/composed/channel-badge'
import { MetricCard } from '@/components/composed/metric-card'
import { DatePickerField } from '@/components/composed/date-picker-field'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeltaBadge } from '@/components/composed/delta-badge'

import {
  useAnalyticsDaily,
  useAnalyticsSummary,
} from '@/hooks/use-analytics'
import type { AnalyticsFilters, DailySeriesPoint } from '@/lib/analytics-types'
import { fmtCurrency, fmtDate, fmtPct, toIso } from '@/lib/format'
import { useLanguage } from '@/components/providers/language-provider'

type SalesChannel = 'shopify' | 'amazon' | 'mercadolibre'

const PLATFORMS: SalesChannel[] = ['shopify', 'amazon', 'mercadolibre']

const PLATFORM_LABELS: Record<SalesChannel, string> = {
  shopify: 'Shopify',
  amazon: 'Amazon',
  mercadolibre: 'Mercado Libre',
}

const COLORS_BY_CHANNEL: Record<SalesChannel, string> = {
  shopify: '#6b7fd8',
  amazon: '#b89a7a',
  mercadolibre: '#a8a060',
}

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

export function DashboardPageV2() {
  const { lang } = useLanguage()
  const [params, setParams] = useSearchParams()

  const startDate = parseDate(params.get('start'), defaultStart())
  const endDate = parseDate(params.get('end'), new Date())
  const granularity = params.get('granularity') ?? 'daily'

  const selectedPlatforms = useMemo(() => {
    const p = params.getAll('platform')
    if (!p.length) return undefined
    return p.filter((x): x is SalesChannel => PLATFORMS.includes(x as SalesChannel)) as
      | SalesChannel[]
      | undefined
  }, [params])

  const activePlatforms = selectedPlatforms ?? PLATFORMS

  const filters: AnalyticsFilters = useMemo(() => {
    return {
      start_date: toIso(startDate),
      end_date: toIso(endDate),
      platform: selectedPlatforms,
      granularity,
    }
  }, [startDate, endDate, selectedPlatforms, granularity])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next)
  }

  const [channelOpen, setChannelOpen] = useState(false)

  const togglePlatform = (p: SalesChannel) => {
    const current = params.getAll('platform')
    const next = new URLSearchParams(params)
    next.delete('platform')

    if (!current.includes(p)) {
      next.append('platform', p)
      for (const c of current) next.append('platform', c)
    } else {
      for (const c of current) if (c !== p) next.append('platform', c)
    }
    setParams(next)
  }

  const t = useCallback((key: string): string => {
    const STRINGS = {
      es: {
        pageTitle: 'Dashboard',
        pageDesc: 'Analítica de ingresos y KPIs',

        filterStart: 'Fecha inicio',
        filterEnd: 'Fecha fin',
        filterTo: 'a',
        channels: 'Canales',

        granularityDaily: 'Diario',
        granularityWeekly: 'Semanal',
        granularityMonthly: 'Mensual',

        kpiGross: 'Ventas brutas',
        kpiNet: 'Ventas netas',
        kpiGrossProfit: 'Utilidad bruta',
        kpiMargin: 'Margen',
        kpiReceived: 'Total recibido',

        deltaVsPrev: 'vs periodo anterior',

        wfTitle: 'Cascada P&L',
        donutTitle: 'Mix de participación de ventas por canal en el periodo',
        monthlyTitle: 'Evolución Mensual — Ingresos · Utilidad · EBITDA · Margen',
        costTitle: 'Estructura de costos por canal y categoría',
        overlayTitle: 'Ventas brutas y netas por canal',
        marginTitle: 'Margen % por Canal',

        traceGrossRevenue: 'Ventas brutas',
        traceNetRevenue: 'Ventas netas',
        traceGrossProfit: 'Utilidad bruta',
        traceEbitda: 'EBITDA',
        traceMarginPct: 'Margen %',

        costCogs: 'COGS',
        costCommission: 'Comisiones',
        costShipping: 'Envios',
        costAds: 'Ads',

        modalTitle: 'Desglose por canal',
        modalPeriod: 'Periodo',
        modalChannel: 'Canal',
        modalGross: 'Ventas brutas',
        modalNet: 'Ventas netas',
        modalCogs: 'COGS',
        modalCommission: 'Comisiones',
        modalShipping: 'Envios',
        modalAds: 'Ads',
        modalGrossProfit: 'Utilidad bruta',

        legendGross: 'Ventas brutas (menos opacidad)',
        legendNet: 'Ventas netas (más opacidad)',
      },
      en: {
        pageTitle: 'Dashboard',
        pageDesc: 'Revenue analytics and KPIs',

        filterStart: 'Start date',
        filterEnd: 'End date',
        filterTo: 'to',
        channels: 'Channels',

        granularityDaily: 'Daily',
        granularityWeekly: 'Weekly',
        granularityMonthly: 'Monthly',

        kpiGross: 'Gross sales',
        kpiNet: 'Net sales',
        kpiGrossProfit: 'Gross profit',
        kpiMargin: 'Margin',
        kpiReceived: 'Total received',

        deltaVsPrev: 'vs prior period',

        wfTitle: 'P&L waterfall',
        donutTitle: 'Share of net sales by channel in the period',
        monthlyTitle: 'Monthly evolution — Revenue · Profit · EBITDA · Margin',
        costTitle: 'Cost structure by channel and category',
        overlayTitle: 'Gross and net sales by channel',
        marginTitle: 'Margin % by channel',

        traceGrossRevenue: 'Gross revenue',
        traceNetRevenue: 'Net revenue',
        traceGrossProfit: 'Gross profit',
        traceEbitda: 'EBITDA',
        traceMarginPct: 'Margin %',

        costCogs: 'COGS',
        costCommission: 'Commissions',
        costShipping: 'Shipping',
        costAds: 'Ads',

        modalTitle: 'Breakdown by channel',
        modalPeriod: 'Period',
        modalChannel: 'Channel',
        modalGross: 'Gross sales',
        modalNet: 'Net sales',
        modalCogs: 'COGS',
        modalCommission: 'Commissions',
        modalShipping: 'Shipping',
        modalAds: 'Ads',
        modalGrossProfit: 'Gross profit',

        legendGross: 'Gross (lower opacity)',
        legendNet: 'Net (higher opacity)',
      },
    } as const

    return (STRINGS[lang as 'es' | 'en'] as Record<string, string>)[key] ?? key
  }, [lang])

  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(filters)
  const {
    data: monthlySeries,
    isLoading: monthlyLoading,
  } = useAnalyticsDaily({ ...filters, granularity: 'monthly' })

  const shopifySeries = useAnalyticsDaily({ ...filters, platform: ['shopify'] })
  const amazonSeries = useAnalyticsDaily({ ...filters, platform: ['amazon'] })
  const mlSeries = useAnalyticsDaily({ ...filters, platform: ['mercadolibre'] })

  const platformSeries = useMemo(() => {
    const m: Record<SalesChannel, DailySeriesPoint[] | undefined> = {
      shopify: shopifySeries.data?.series,
      amazon: amazonSeries.data?.series,
      mercadolibre: mlSeries.data?.series,
    }
    return m
  }, [shopifySeries.data, amazonSeries.data, mlSeries.data])

  const delta = (key: string) => {
    if (!summary?.deltas) return null
    const d = summary.deltas[key]
    if (!d || d.change_pct === null) return null
    const pct = Number(d.change_pct)
    return (
      <>
        <DeltaBadge positive={pct >= 0} value={`${Math.abs(pct).toFixed(1)}%`} />
        <span className="text-[11px] font-medium text-text-tertiary/90">{t('deltaVsPrev')}</span>
      </>
    )
  }

  const summaryKpis = summary?.current

  const waterfallSteps = useMemo(() => {
    if (!summaryKpis) return []
    const vb = Number(summaryKpis.gross_revenue)
    const com = Math.abs(Number(summaryKpis.channel_commission))
    const env = Math.abs(Number(summaryKpis.shipping_cost))
    const vn = Number(summaryKpis.net_revenue)
    const cogs = Math.abs(Number(summaryKpis.cogs))
    const ub = Number(summaryKpis.gross_profit)
    const ads = Math.abs(Number(summaryKpis.ads_spend))
    const ebitda = ub - ads

    return [
      { label: t('traceGrossRevenue'), value: vb, measure: 'absolute' as const },
      { label: t('costCommission'), value: -com, measure: 'relative' as const },
      { label: t('costShipping'), value: -env, measure: 'relative' as const },
      { label: t('traceNetRevenue'), value: vn, measure: 'total' as const },
      { label: t('costCogs'), value: -cogs, measure: 'relative' as const },
      { label: t('traceGrossProfit'), value: ub, measure: 'total' as const },
      { label: t('traceEbitda'), value: ebitda, measure: 'total' as const },
    ]
  }, [summaryKpis, t])

  const donutData = useMemo(() => {
    const points: { name: string; value: number }[] = []
    for (const c of activePlatforms) {
      const s = platformSeries[c]
      const total = (s ?? []).reduce((acc, pt) => acc + Number(pt.net_revenue), 0)
      points.push({ name: PLATFORM_LABELS[c], value: Math.round(total) })
    }
    return points.sort((a, b) => b.value - a.value)
  }, [activePlatforms, platformSeries])

  const costData = useMemo(() => {
    return activePlatforms.map((c) => {
      const s = platformSeries[c] ?? []
      const cogs = s.reduce((acc, pt) => acc + Math.abs(Number(pt.cogs)), 0)
      const commission = s.reduce((acc, pt) => acc + Math.abs(Number(pt.channel_commission)), 0)
      const shipping = s.reduce((acc, pt) => acc + Math.abs(Number(pt.shipping_cost)), 0)
      const ads = s.reduce((acc, pt) => acc + Math.abs(Number(pt.ads_spend)), 0)
      return {
        name: PLATFORM_LABELS[c],
        cogs,
        commission,
        shipping,
        ads,
      }
    })
  }, [activePlatforms, platformSeries])

  const monthlyData = useMemo(() => {
    const s = monthlySeries?.series ?? []
    return s.map((pt) => {
      const grossProfit = Number(pt.gross_profit)
      const ads = Math.abs(Number(pt.ads_spend))
      return {
        period: fmtDate(pt.period_start),
        gross_revenue: Number(pt.gross_revenue),
        net_revenue: Number(pt.net_revenue),
        gross_profit: grossProfit,
        ebitda: grossProfit - ads,
        margin_pct: Number(pt.margin_pct),
      }
    })
  }, [monthlySeries])

  const overlayDataAndMaps = useMemo(() => {
    const seriesByChannelMap: Partial<Record<SalesChannel, DailySeriesPoint[]>> = {
      shopify: shopifySeries.data?.series,
      amazon: amazonSeries.data?.series,
      mercadolibre: mlSeries.data?.series,
    }

    const periodKeys = new Set<string>()
    for (const c of activePlatforms) {
      for (const pt of seriesByChannelMap[c] ?? []) periodKeys.add(pt.period_start)
    }
    const sortedKeys = Array.from(periodKeys).sort()

    const mapByChannel = {} as Record<
      SalesChannel,
      Record<string, DailySeriesPoint>
    >
    for (const c of PLATFORMS) {
      const arr = seriesByChannelMap[c] ?? []
      mapByChannel[c] = Object.fromEntries(arr.map((pt) => [pt.period_start, pt]))
    }

    const data: OverlaySalesDatum[] = sortedKeys.map((periodKey) => {
      const grossByChannel = {} as Record<SalesChannel, number>
      const netByChannel = {} as Record<SalesChannel, number>
      for (const c of activePlatforms) {
        const pt = mapByChannel[c]?.[periodKey]
        grossByChannel[c] = pt ? Number(pt.gross_revenue) : 0
        netByChannel[c] = pt ? Number(pt.net_revenue) : 0
      }
      for (const c of PLATFORMS) {
        if (!(c in grossByChannel)) grossByChannel[c] = 0
        if (!(c in netByChannel)) netByChannel[c] = 0
      }
      return {
        periodKey,
        periodLabel: fmtDate(periodKey),
        grossByChannel,
        netByChannel,
      }
    })

    return { overlayData: data, mapByChannel }
  }, [activePlatforms, shopifySeries.data, amazonSeries.data, mlSeries.data])

  const marginByChannelData = useMemo(() => {
    const periodKeys = new Set<string>()
    for (const c of activePlatforms) {
      for (const pt of platformSeries[c] ?? []) periodKeys.add(pt.period_start)
    }
    const sortedKeys = Array.from(periodKeys).sort()

    return sortedKeys.map((periodKey) => {
      const row: Record<string, string | number> = { period: fmtDate(periodKey) }
      for (const c of activePlatforms) {
        const m = overlayDataAndMaps.mapByChannel[c]?.[periodKey]
        row[c] = m ? Number(m.margin_pct) : 0
      }
      return row
    })
  }, [activePlatforms, platformSeries, overlayDataAndMaps.mapByChannel])

  const [modalOpen, setModalOpen] = useState(false)
  const [modalSel, setModalSel] = useState<{
    periodKey: string
    channel: SalesChannel
  } | null>(null)

  const onOverlaySelect = (sel: OverlaySalesSelection) => {
    setModalSel({ periodKey: sel.periodKey, channel: sel.channel })
    setModalOpen(true)
  }

  const modalPoint = useMemo(() => {
    if (!modalSel) return null
    const { periodKey, channel } = modalSel
    const pt = overlayDataAndMaps.mapByChannel[channel]?.[periodKey]
    return pt ?? null
  }, [modalSel, overlayDataAndMaps.mapByChannel])

  const marginSeries = activePlatforms.map((c) => ({
    key: c,
    name: PLATFORM_LABELS[c],
    color: COLORS_BY_CHANNEL[c],
  }))

  return (
    <div className="space-y-10">
      <PageHeader title={t('pageTitle')} description={t('pageDesc')} />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <DatePickerField
          value={startDate}
          onChange={(d) => d && setParam('start', toIso(d))}
          placeholder={t('filterStart')}
        />
        <span className="text-[11px] font-medium text-text-tertiary">{t('filterTo')}</span>
        <DatePickerField
          value={endDate}
          onChange={(d) => d && setParam('end', toIso(d))}
          placeholder={t('filterEnd')}
        />

        <div className="relative ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setChannelOpen(!channelOpen)}
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-border-subtle bg-white/[0.03] px-3 text-xs font-medium text-text-secondary transition-colors hover:border-border-default hover:bg-white/[0.05]"
          >
            {t('channels')}
            {selectedPlatforms ? ` (${selectedPlatforms.length})` : ''}
          </button>
          {channelOpen && (
            <div className="absolute right-0 top-full z-20 mt-1.5 rounded-[10px] border border-border-subtle bg-bg-elevated p-2 shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
              {PLATFORMS.map((p) => (
                <label
                  key={p}
                  className="flex cursor-pointer items-center gap-2 px-2 py-1 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms?.includes(p) ?? false}
                    onChange={() => togglePlatform(p)}
                    className="accent-accent"
                  />
                  <ChannelBadge channel={p} />
                </label>
              ))}
            </div>
          )}
        </div>

        <Tabs
          value={granularity}
          onValueChange={(v) => setParam('granularity', v)}
        >
          <TabsList className="h-9 gap-0.5 rounded-[10px] border border-border-subtle bg-white/[0.03] p-1">
            <TabsTrigger
              value="daily"
              className="h-[calc(100%-2px)] rounded-md px-3 text-xs font-medium data-active:bg-white/[0.07] data-active:shadow-none"
            >
              {t('granularityDaily')}
            </TabsTrigger>
            <TabsTrigger
              value="weekly"
              className="h-[calc(100%-2px)] rounded-md px-3 text-xs font-medium data-active:bg-white/[0.07] data-active:shadow-none"
            >
              {t('granularityWeekly')}
            </TabsTrigger>
            <TabsTrigger
              value="monthly"
              className="h-[calc(100%-2px)] rounded-md px-3 text-xs font-medium data-active:bg-white/[0.07] data-active:shadow-none"
            >
              {t('granularityMonthly')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPIs */}
      {summaryLoading || !summary ? (
        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="min-h-[7.5rem] rounded-[12px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            variant="hero"
            label={t('kpiGross')}
            currency="MXN"
            value={fmtCurrency(summary.current.gross_revenue)}
            footer={delta('gross_revenue')}
          />
          <MetricCard
            label={t('kpiNet')}
            currency="MXN"
            value={fmtCurrency(summary.current.net_revenue)}
            footer={delta('net_revenue')}
          />
          <MetricCard
            label={t('kpiGrossProfit')}
            currency="MXN"
            value={fmtCurrency(summary.current.gross_profit)}
            footer={delta('gross_profit')}
          />
          <MetricCard
            label={t('kpiMargin')}
            value={fmtPct(summary.current.margin_pct)}
            footer={delta('margin_pct')}
          />
          <MetricCard
            label={t('kpiReceived')}
            currency="MXN"
            value={fmtCurrency(summary.current.disbursement)}
            footer={delta('disbursement')}
          />
        </div>
      )}

      {/* Graph row 1 */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <Card className="flex flex-1 flex-col lg:flex-[1.6]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t('wfTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6 pt-0">
            {summaryLoading ? (
              <Skeleton className="h-[280px] w-full rounded-xl" />
            ) : (
              <PnlWaterfallPanel steps={waterfallSteps} />
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-1 flex-col lg:flex-[0.7]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t('donutTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6 pt-0">
            {shopifySeries.isLoading || amazonSeries.isLoading || mlSeries.isLoading ? (
              <Skeleton className="h-80 w-full rounded-lg" />
            ) : donutData.length ? (
              <PieChartPanel data={donutData} heightClassName="h-80" />
            ) : (
              <div className="text-sm text-text-secondary">No data</div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-1 flex-col lg:flex-[0.7]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t('costTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6 pt-0">
            {shopifySeries.isLoading || amazonSeries.isLoading || mlSeries.isLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : costData.length ? (
              <BarChartPanel
                data={costData}
                dataKeyX="name"
                heightClassName="h-64"
                bars={[
                  { key: 'cogs', name: t('costCogs') },
                  { key: 'commission', name: t('costCommission') },
                  { key: 'shipping', name: t('costShipping') },
                  { key: 'ads', name: t('costAds') },
                ]}
              />
            ) : (
              <div className="text-sm text-text-secondary">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graph 3 monthly */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-text-secondary">
            {t('monthlyTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6 pt-0">
          {monthlyLoading ? (
            <Skeleton className="h-[320px] w-full rounded-xl" />
          ) : monthlyData.length ? (
            <MonthlyEvolutionPanel
              data={monthlyData}
              titleLabels={{
                grossRevenue: t('traceGrossRevenue'),
                netRevenue: t('traceNetRevenue'),
                grossProfit: t('traceGrossProfit'),
                ebitda: t('traceEbitda'),
                marginPct: t('traceMarginPct'),
              }}
            />
          ) : (
            <div className="text-sm text-text-secondary">No data</div>
          )}
        </CardContent>
      </Card>

      {/* Graph row 3: overlay + margin */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <Card className="flex flex-1 flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t('overlayTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6 pt-0">
            {shopifySeries.isLoading || amazonSeries.isLoading || mlSeries.isLoading ? (
              <Skeleton className="h-[360px] w-full rounded-xl" />
            ) : overlayDataAndMaps.overlayData.length ? (
              <OverlaySalesByChannelPanel
                data={overlayDataAndMaps.overlayData as OverlaySalesDatum[]}
                channels={activePlatforms as OverlaySalesChannel[]}
                colorsByChannel={COLORS_BY_CHANNEL}
                grossLabel={t('legendGross')}
                netLabel={t('legendNet')}
                onSelect={onOverlaySelect}
              />
            ) : (
              <div className="text-sm text-text-secondary">No data</div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-1 flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              {t('marginTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6 pt-0">
            {shopifySeries.isLoading || amazonSeries.isLoading || mlSeries.isLoading ? (
              <Skeleton className="h-[300px] w-full rounded-xl" />
            ) : marginByChannelData.length ? (
              <MarginByChannelPanel
                data={marginByChannelData}
                xKey="period"
                series={marginSeries}
              />
            ) : (
              <div className="text-sm text-text-secondary">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal: breakdown for clicked bar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('modalTitle')}</DialogTitle>
          </DialogHeader>

          {modalPoint && modalSel ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-text-secondary">{t('modalPeriod')}</div>
                <div className="font-mono text-text-primary">
                  {fmtDate(modalSel.periodKey)}
                </div>
                <div className="text-text-secondary">{t('modalChannel')}</div>
                <div className="font-mono text-text-primary">
                  {PLATFORM_LABELS[modalSel.channel]}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 rounded-[10px] border border-border-subtle bg-white/[0.02] p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('modalGross')}</span>
                  <span className="font-mono">{fmtCurrency(modalPoint.gross_revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('modalNet')}</span>
                  <span className="font-mono">{fmtCurrency(modalPoint.net_revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('modalCogs')}</span>
                  <span className="font-mono">
                    {fmtCurrency(Math.abs(Number(modalPoint.cogs)))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('modalCommission')}</span>
                  <span className="font-mono">
                    {fmtCurrency(Math.abs(Number(modalPoint.channel_commission)))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('modalShipping')}</span>
                  <span className="font-mono">
                    {fmtCurrency(Math.abs(Number(modalPoint.shipping_cost)))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('modalAds')}</span>
                  <span className="font-mono">
                    {fmtCurrency(Math.abs(Number(modalPoint.ads_spend)))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('modalGrossProfit')}</span>
                  <span className="font-mono">
                    {fmtCurrency(modalPoint.gross_profit)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-text-secondary">No data</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

