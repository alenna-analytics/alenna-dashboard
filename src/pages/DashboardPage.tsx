import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PieChartPanel } from '@/components/charts/pie-chart-panel'
import { BarChartPanel } from '@/components/charts/bar-chart-panel'
import { MonthlyEvolutionPanel } from '@/components/charts/monthly-evolution-panel'
import { MarginByChannelPanel } from '@/components/charts/margin-by-channel-panel'
import {
  PnlWaterfallPanel,
  type WaterfallStep,
} from '@/components/charts/pnl-waterfall-panel'
import {
  OverlaySalesByChannelPanel,
  type OverlaySalesDatum,
  type OverlaySalesSelection,
  type SalesChannel as OverlaySalesChannel,
} from '@/components/charts/overlay-sales-by-channel-panel'
import { DashboardFiltersBar } from '@/components/composed/dashboard-filters-bar'
import { MetricCard } from '@/components/composed/metric-card'
import { DeltaBadge } from '@/components/composed/delta-badge'

import { useAnalyticsDaily, useAnalyticsSummary } from '@/hooks/use-analytics'
import type { AnalyticsFilters, DailySeriesPoint } from '@/lib/analytics-types'
import {
  buildYearShortcutOptions,
  fullCalendarMonthValue,
  isFullCalendarYearRange,
} from '@/lib/dashboard-date-shortcuts'
import {
  COLORS_BY_CHANNEL,
  DASHBOARD_PLATFORMS,
  PLATFORM_LABELS,
  dashboardT,
  type DashboardSalesChannel,
  type DashboardStringKey,
} from '@/lib/dashboard-strings'
import { fmtDate, fmtPct, toIso, toLocalIsoDate } from '@/lib/format'
import { useCurrency } from '@/components/providers/currency-provider'
import { useLanguage } from '@/components/providers/language-provider'
import { usePageChrome } from '@/components/providers/page-chrome-context'

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function uniqueValidProductIds(searchParams: URLSearchParams): string[] | undefined {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of searchParams.getAll('product_id')) {
    if (UUID_RE.test(raw) && !seen.has(raw)) {
      seen.add(raw)
      out.push(raw)
    }
  }
  return out.length ? out : undefined
}

export function DashboardPage() {
  const { lang } = useLanguage()
  const { setPageMeta } = usePageChrome()
  const { formatCurrency, formatCurrencyValue, displayCurrency } = useCurrency()
  const [params, setParams] = useSearchParams()

  const startDate = parseDate(params.get('start'), defaultStart())
  const endDate = parseDate(params.get('end'), new Date())
  const granularity = params.get('granularity') ?? 'daily'
  const selectedProductIds = useMemo(() => uniqueValidProductIds(params), [params])

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
      product_ids: selectedProductIds,
    }
  }, [startDate, endDate, selectedPlatforms, granularity, selectedProductIds])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next)
  }

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

  const selectAllPlatforms = () => {
    const next = new URLSearchParams(params)
    next.delete('platform')
    setParams(next)
  }

  const shortcutYearValue = useMemo(() => {
    return isFullCalendarYearRange(startDate, endDate)
      ? String(startDate.getFullYear())
      : ''
  }, [startDate, endDate])

  const shortcutMonthValue = useMemo(() => {
    return fullCalendarMonthValue(startDate, endDate) ?? ''
  }, [startDate, endDate])

  const yearShortcutOptions = useMemo(() => buildYearShortcutOptions(), [])

  const referenceYearForMonth = useMemo(() => {
    if (shortcutYearValue) return Number.parseInt(shortcutYearValue, 10)
    return startDate.getFullYear()
  }, [shortcutYearValue, startDate])

  const dashboardLocale = lang === 'es' ? 'es-MX' : 'en-US'

  const applyYearShortcut = (yearStr: string) => {
    const y = Number.parseInt(yearStr, 10)
    if (Number.isNaN(y)) return
    const next = new URLSearchParams(params)
    next.set('start', toLocalIsoDate(new Date(y, 0, 1)))
    next.set('end', toLocalIsoDate(new Date(y, 11, 31)))
    setParams(next)
  }

  const applyMonthShortcut = (ym: string) => {
    const [ys, ms] = ym.split('-')
    const y = Number.parseInt(ys ?? '', 10)
    const m = Number.parseInt(ms ?? '', 10) - 1
    if (Number.isNaN(y) || Number.isNaN(m) || m < 0 || m > 11) return
    const next = new URLSearchParams(params)
    next.set('start', toLocalIsoDate(new Date(y, m, 1)))
    next.set('end', toLocalIsoDate(new Date(y, m + 1, 0)))
    setParams(next)
  }

  const t = useCallback(
    (key: DashboardStringKey) => dashboardT(lang, key),
    [lang],
  )

  useEffect(() => {
    setPageMeta({ title: t('pageTitle') })
    return () => setPageMeta({ title: '' })
  }, [t, setPageMeta])

  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(filters)
  const {
    data: monthlySeries,
    isLoading: monthlyLoading,
  } = useAnalyticsDaily({ ...filters, granularity: 'monthly' })

  const shopifySeries = useAnalyticsDaily({ ...filters, platform: ['shopify'] })
  const amazonSeries = useAnalyticsDaily({ ...filters, platform: ['amazon'] })
  const mlSeries = useAnalyticsDaily({ ...filters, platform: ['mercadolibre'] })

  const shopifyOverlaySeries = useAnalyticsDaily({
    ...filters,
    platform: ['shopify'],
    granularity: 'monthly',
  })
  const amazonOverlaySeries = useAnalyticsDaily({
    ...filters,
    platform: ['amazon'],
    granularity: 'monthly',
  })
  const mlOverlaySeries = useAnalyticsDaily({
    ...filters,
    platform: ['mercadolibre'],
    granularity: 'monthly',
  })

  const platformSeries = useMemo(() => {
    const m: Record<SalesChannel, DailySeriesPoint[] | undefined> = {
      shopify: shopifySeries.data?.series,
      amazon: amazonSeries.data?.series,
      mercadolibre: mlSeries.data?.series,
    }
    return m
  }, [shopifySeries.data, amazonSeries.data, mlSeries.data])

  const compareToPriorMonth = useMemo(
    () => fullCalendarMonthValue(startDate, endDate) !== null,
    [startDate, endDate],
  )

  const delta = (key: string) => {
    if (!summary?.deltas) return null
    const d = summary.deltas[key]
    if (!d || d.change_pct === null) return null
    const pct = Number(d.change_pct)
    return (
      <>
        <DeltaBadge positive={pct >= 0} value={`${Math.abs(pct).toFixed(1)}%`} />
        <span className="text-[11px] font-medium text-text-tertiary/90">
          {compareToPriorMonth ? t('deltaVsPrevMonth') : t('deltaVsPrev')}
        </span>
      </>
    )
  }

  const summaryKpis = summary?.current

  const { waterfallSteps, waterfallReconcileFootnote } = useMemo(() => {
    if (!summaryKpis) {
      return { waterfallSteps: [] as WaterfallStep[], waterfallReconcileFootnote: false }
    }
    const vb = Number(summaryKpis.gross_revenue)
    const com = Math.abs(Number(summaryKpis.channel_commission))
    const env = Math.abs(Number(summaryKpis.shipping_cost))
    const vn = Number(summaryKpis.net_revenue)
    const cogsProduct = Math.abs(Number(summaryKpis.cogs))
    const totalCogs = Math.abs(Number(summaryKpis.total_cogs))
    const ub = Number(summaryKpis.gross_profit)
    const ads = Math.abs(Number(summaryKpis.ads_spend))
    const ebitda = Number(summaryKpis.ebitda)

    const impliedAfterCogs = vn - totalCogs
    const residualToUb = ub - impliedAfterCogs
    const eps = Math.max(1, Math.abs(vn) * 0.0005)
    const otherCogsMag = Math.max(0, totalCogs - cogsProduct)

    const base: {
      label: string
      value: number
      measure: 'absolute' | 'relative' | 'total'
    }[] = [
        { label: t('traceGrossRevenue'), value: vb, measure: 'absolute' },
        { label: t('costCommission'), value: -com, measure: 'relative' },
        { label: t('costShipping'), value: -env, measure: 'relative' },
        { label: t('traceNetRevenue'), value: vn, measure: 'total' },
      ]

    if (totalCogs <= eps && cogsProduct <= eps) {
      /* no COGS in slice */
    } else if (cogsProduct > eps) {
      base.push({ label: t('costCogs'), value: -cogsProduct, measure: 'relative' })
      if (otherCogsMag > eps) {
        base.push({
          label: t('traceCostOfSalesOther'),
          value: -otherCogsMag,
          measure: 'relative',
        })
      }
    } else if (totalCogs > eps) {
      base.push({
        label: t('traceCostOfSalesTotal'),
        value: -totalCogs,
        measure: 'relative',
      })
    }

    let showReconcile = false
    if (Math.abs(residualToUb) > eps) {
      base.push({ label: t('tracePnlReconcile'), value: residualToUb, measure: 'relative' })
      showReconcile = true
    }
    base.push({ label: t('traceGrossProfit'), value: ub, measure: 'total' })

    if (selectedProductIds?.length && ads === 0) {
      return { waterfallSteps: base, waterfallReconcileFootnote: showReconcile }
    }
    return {
      waterfallSteps: [...base, { label: t('traceEbitda'), value: ebitda, measure: 'total' as const }],
      waterfallReconcileFootnote: showReconcile,
    }
  }, [summaryKpis, t, selectedProductIds?.length])

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
      const gross = Number(pt.gross_revenue)
      const net = Number(pt.net_revenue)
      const grossProfit = Number(pt.gross_profit)
      const ebitda = Number(pt.ebitda)
      const stackEbitda = Math.max(0, ebitda)
      const stackUbOverEbitda = Math.max(0, grossProfit - ebitda)
      const stackNetOverUb = Math.max(0, net - grossProfit)
      const stackGrossOverNet = Math.max(0, gross - net)
      return {
        period: fmtDate(pt.period_start),
        gross_revenue: gross,
        net_revenue: net,
        gross_profit: grossProfit,
        ebitda,
        margin_pct: Number(pt.margin_pct),
        stackEbitda,
        stackUbOverEbitda,
        stackNetOverUb,
        stackGrossOverNet,
      }
    })
  }, [monthlySeries])

  const overlayDataAndMaps = useMemo(() => {
    const seriesByChannelMap: Partial<Record<SalesChannel, DailySeriesPoint[]>> = {
      shopify: shopifyOverlaySeries.data?.series,
      amazon: amazonOverlaySeries.data?.series,
      mercadolibre: mlOverlaySeries.data?.series,
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
  }, [
    activePlatforms,
    shopifyOverlaySeries.data,
    amazonOverlaySeries.data,
    mlOverlaySeries.data,
  ])

  const marginByChannelData = useMemo(() => {
    const seriesByChannelMap: Partial<Record<SalesChannel, DailySeriesPoint[]>> = {
      shopify: shopifyOverlaySeries.data?.series,
      amazon: amazonOverlaySeries.data?.series,
      mercadolibre: mlOverlaySeries.data?.series,
    }
    const periodKeys = new Set<string>()
    for (const c of activePlatforms) {
      for (const pt of seriesByChannelMap[c] ?? []) periodKeys.add(pt.period_start)
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
  }, [
    activePlatforms,
    shopifyOverlaySeries.data,
    amazonOverlaySeries.data,
    mlOverlaySeries.data,
    overlayDataAndMaps.mapByChannel,
  ])

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

  const donutColorByName = useMemo(() => {
    const m: Record<string, string> = {}
    for (const c of PLATFORMS) {
      m[PLATFORM_LABELS[c]] = COLORS_BY_CHANNEL[c]
    }
    return m
  }, [])

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-6">
      <DashboardFiltersBar
          t={t}
          locale={dashboardLocale}
          startDate={startDate}
          endDate={endDate}
          onStartChange={(d) => setParam('start', toIso(d))}
          onEndChange={(d) => setParam('end', toIso(d))}
          shortcutYearValue={shortcutYearValue}
          yearShortcutOptions={yearShortcutOptions}
          onYearShortcut={applyYearShortcut}
          shortcutMonthValue={shortcutMonthValue}
          referenceYearForMonth={referenceYearForMonth}
          onMonthShortcut={applyMonthShortcut}
          platforms={PLATFORMS}
          platformLabels={PLATFORM_LABELS}
          selectedPlatforms={selectedPlatforms}
        onTogglePlatform={togglePlatform}
        onSelectAllPlatforms={selectAllPlatforms}
        granularity={granularity}
          onGranularityChange={(v) => setParam('granularity', v)}
      />

      {selectedProductIds?.length ? (
        <p
          className="rounded-[12px] border border-border-subtle bg-bg-section px-4 py-3 text-[11px] leading-relaxed text-text-secondary"
          role="note"
        >
          {t('productScopeBanner')}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-tertiary">
          {t('sectionOverview')}
        </h2>
        {summaryLoading || !summary ? (
          <div className="rounded-xl border border-border-subtle/80 bg-bg-section/90 p-5 sm:p-6">
            <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="min-h-[7.5rem] rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border-subtle/80 bg-bg-section/90 p-5 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              label={t('kpiGross')}
              currency={displayCurrency}
              value={formatCurrencyValue(summary.current.gross_revenue)}
              footer={delta('gross_revenue')}
            />
            <MetricCard
              variant="accent"
              label={t('kpiNet')}
              currency={displayCurrency}
              value={formatCurrencyValue(summary.current.net_revenue)}
              footer={delta('net_revenue')}
            />
            <MetricCard
              label={t('kpiGrossProfit')}
              currency={displayCurrency}
              value={formatCurrencyValue(summary.current.gross_profit)}
              footer={delta('gross_profit')}
            />
            <MetricCard
              label={t('kpiMargin')}
              value={fmtPct(summary.current.margin_pct)}
              footer={delta('margin_pct')}
            />
            <MetricCard
              label={t('kpiReceived')}
              currency={displayCurrency}
              value={formatCurrencyValue(summary.current.disbursement)}
              footer={delta('disbursement')}
            />
            </div>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-tertiary">
          {t('sectionProfitability')}
        </h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(240px,3fr)] lg:items-stretch">
        <Card className="w-full lg:min-h-[380px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-primary">
              {t('wfTitle')}
            </CardTitle>
            {waterfallReconcileFootnote ? (
              <p className="mt-1.5 max-w-2xl text-[10px] leading-snug text-text-tertiary">
                {t('wfReconcileFootnote')}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="pb-6 pt-0">
            {summaryLoading ? (
              <Skeleton className="h-[340px] w-full rounded-xl" />
            ) : (
              <PnlWaterfallPanel
                steps={waterfallSteps}
                heightClassName="min-h-[300px] h-[340px]"
              />
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-0 min-w-0 flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-text-tertiary">
              {t('donutTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pb-6 pt-0">
            {shopifySeries.isLoading || amazonSeries.isLoading || mlSeries.isLoading ? (
              <Skeleton className="h-72 w-full flex-1 rounded-xl" />
            ) : donutData.length ? (
              <PieChartPanel
                data={donutData}
                colorByName={donutColorByName}
                heightClassName="h-72 min-h-[240px]"
              />
            ) : (
              <div className="text-sm text-text-secondary">No data</div>
            )}
          </CardContent>
        </Card>
      </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-tertiary">
          {t('sectionTrends')}
        </h2>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-text-primary">
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
                stackEbitda: t('monthlyStackEbitda'),
                stackLayerUb: t('monthlyStackLayerUb'),
                stackLayerNet: t('monthlyStackLayerNet'),
                stackLayerGross: t('monthlyStackLayerGross'),
                marginPct: t('traceMarginPct'),
              }}
            />
          ) : (
            <div className="text-sm text-text-secondary">No data</div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-text-secondary">
            {t('overlayTitle')}
          </CardTitle>
          <p className="mt-1 text-[10px] leading-snug text-text-tertiary">
            {t('overlayMonthlyHint')}
          </p>
        </CardHeader>
        <CardContent className="pb-6 pt-0">
          {shopifyOverlaySeries.isLoading ||
            amazonOverlaySeries.isLoading ||
            mlOverlaySeries.isLoading ? (
            <Skeleton className="h-[360px] w-full rounded-xl" />
          ) : overlayDataAndMaps.overlayData.length ? (
            <OverlaySalesByChannelPanel
              data={overlayDataAndMaps.overlayData as OverlaySalesDatum[]}
              channels={activePlatforms as OverlaySalesChannel[]}
              channelLabels={PLATFORM_LABELS}
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

      <div className="grid grid-cols-1 gap-6 pt-1 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex min-h-0 min-w-0 flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-text-tertiary">
              {t('costTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6 pt-0">
            {shopifySeries.isLoading || amazonSeries.isLoading || mlSeries.isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
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

        <Card className="flex min-h-0 min-w-0 flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-medium text-text-tertiary">
              {t('marginTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6 pt-0">
            {shopifyOverlaySeries.isLoading ||
              amazonOverlaySeries.isLoading ||
              mlOverlaySeries.isLoading ? (
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
      </section>

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
                  <span className="font-mono">{formatCurrency(modalPoint.gross_revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('modalNet')}</span>
                  <span className="font-mono">{formatCurrency(modalPoint.net_revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('modalCogs')}</span>
                  <span className="font-mono">
                    {formatCurrency(Math.abs(Number(modalPoint.cogs)))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('modalCommission')}</span>
                  <span className="font-mono">
                    {formatCurrency(Math.abs(Number(modalPoint.channel_commission)))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('modalShipping')}</span>
                  <span className="font-mono">
                    {formatCurrency(Math.abs(Number(modalPoint.shipping_cost)))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('modalAds')}</span>
                  <span className="font-mono">
                    {formatCurrency(Math.abs(Number(modalPoint.ads_spend)))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('modalGrossProfit')}</span>
                  <span className="font-mono">
                    {formatCurrency(modalPoint.gross_profit)}
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

