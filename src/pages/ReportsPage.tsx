import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { BarChartPanel } from '@/components/charts/bar-chart-panel'
import { MonthlyEvolutionPanel } from '@/components/charts/monthly-evolution-panel'
import { PieChartPanel } from '@/components/charts/pie-chart-panel'
import { PnlWaterfallPanel, type WaterfallStep } from '@/components/charts/pnl-waterfall-panel'
import { DashboardFiltersBar } from '@/components/composed/dashboard-filters-bar'
import { MetricCard } from '@/components/composed/metric-card'
import { useCurrency } from '@/components/providers/currency-provider'
import { useLanguage } from '@/components/providers/language-provider'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalyticsReportStatement } from '@/hooks/use-analytics'
import type { AnalyticsFilters, ReportsErLine } from '@/lib/analytics-types'
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
  type DashboardStringKey,
} from '@/lib/dashboard-strings'
import { fmtDateByLanguage, toIso, toLocalIsoDate } from '@/lib/format'

type SalesChannel = (typeof DASHBOARD_PLATFORMS)[number]

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

function normalizeChannelLabel(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower === 'shopify') return PLATFORM_LABELS.shopify
  if (lower === 'amazon') return PLATFORM_LABELS.amazon
  if (lower === 'mercadolibre') return PLATFORM_LABELS.mercadolibre
  return raw
}

export function ReportsPage() {
  const { lang } = useLanguage()
  const { formatCurrency, formatCurrencyValue, displayCurrency } = useCurrency()
  const [params, setParams] = useSearchParams()

  const startDate = parseDate(params.get('start'), defaultStart())
  const endDate = parseDate(params.get('end'), new Date())
  const granularity = params.get('granularity') ?? 'monthly'

  const selectedPlatforms = useMemo(() => {
    const p = params.getAll('platform')
    if (!p.length) return undefined
    return p.filter((x): x is SalesChannel => DASHBOARD_PLATFORMS.includes(x as SalesChannel))
  }, [params])

  const filters: AnalyticsFilters = useMemo(
    () => ({
      start_date: toIso(startDate),
      end_date: toIso(endDate),
      platform: selectedPlatforms,
      granularity,
    }),
    [startDate, endDate, selectedPlatforms, granularity],
  )

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

  const shortcutYearValue = useMemo(
    () => (isFullCalendarYearRange(startDate, endDate) ? String(startDate.getFullYear()) : ''),
    [startDate, endDate],
  )
  const shortcutMonthValue = useMemo(() => fullCalendarMonthValue(startDate, endDate) ?? '', [startDate, endDate])
  const yearShortcutOptions = useMemo(() => buildYearShortcutOptions(), [])
  const referenceYearForMonth = useMemo(
    () => (shortcutYearValue ? Number.parseInt(shortcutYearValue, 10) : startDate.getFullYear()),
    [shortcutYearValue, startDate],
  )
  const locale = lang === 'es' ? 'es-MX' : 'en-US'
  const t = useCallback((key: DashboardStringKey) => dashboardT(lang, key), [lang])
  const [monthlyBarLayout, setMonthlyBarLayout] = useState<'grouped' | 'stacked'>('stacked')

  const reportQuery = useAnalyticsReportStatement(filters)
  const report = reportQuery.data

  const waterfallSteps: WaterfallStep[] = useMemo(() => {
    if (!report) return []
    return [
      { label: t('traceGrossRevenue'), value: Number(report.gross_revenue), measure: 'absolute' },
      { label: t('costCommission'), value: -Math.abs(Number(report.channel_commission)), measure: 'relative' },
      { label: t('costShipping'), value: -Math.abs(Number(report.shipping_cost)), measure: 'relative' },
      { label: t('traceNetRevenue'), value: Number(report.net_revenue), measure: 'total' },
      { label: t('costCogs'), value: -Math.abs(Number(report.cogs)), measure: 'relative' },
      ...(Number(report.platform_variable_costs) !== 0
        ? [{ label: t('costPlatformVariable'), value: -Math.abs(Number(report.platform_variable_costs)), measure: 'relative' as const }]
        : []),
      { label: t('traceContributionMargin'), value: Number(report.gross_profit), measure: 'total' },
      { label: t('reportsOperatingExpenses'), value: -Math.abs(Number(report.operating_expenses)), measure: 'relative' },
      { label: t('traceEbitda'), value: Number(report.ebitda), measure: 'total' },
    ]
  }, [report, t])

  const mixData = useMemo(() => {
    if (!report) return []
    return report.channels
      .map((c) => ({
        name: normalizeChannelLabel(c.channel),
        value: Math.max(0, Number(c.lines.find((line) => line.label === '= VENTAS NETAS')?.value ?? 0)),
      }))
      .sort((a, b) => b.value - a.value)
  }, [report])

  const mixColors = useMemo(() => {
    const map: Record<string, string> = {}
    map[PLATFORM_LABELS.shopify] = COLORS_BY_CHANNEL.shopify
    map[PLATFORM_LABELS.amazon] = COLORS_BY_CHANNEL.amazon
    map[PLATFORM_LABELS.mercadolibre] = COLORS_BY_CHANNEL.mercadolibre
    return map
  }, [])

  const monthlyData = useMemo(() => {
    return (report?.monthly ?? []).map((item) => {
      const net = Number(item.net_revenue)
      const grossProfit = Number(item.gross_profit)
      const ebitda = Number(item.ebitda)
      return {
        period: fmtDateByLanguage(item.period_start, lang),
        net_revenue: net,
        gross_profit: grossProfit,
        ebitda,
        margin_pct: Number(item.ebitda_margin_pct),
        monthlyOverlayMax: Math.max(net, grossProfit, ebitda),
      }
    })
  }, [report, lang])

  const expenseByCategoryBars = useMemo(
    () =>
      (report?.expense_categories ?? [])
        .map((item) => ({ category: item.category, amount: Number(item.amount) }))
        .filter((item) => item.amount > 0),
    [report],
  )

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{t('reportsPageTitle')}</h1>
        <p className="text-sm text-text-secondary">{t('reportsPageDesc')}</p>
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
        platforms={DASHBOARD_PLATFORMS}
        platformLabels={PLATFORM_LABELS}
        selectedPlatforms={selectedPlatforms}
        onTogglePlatform={togglePlatform}
        onSelectAllPlatforms={selectAllPlatforms}
        granularity={granularity}
        onGranularityChange={(v) => setParam('granularity', v)}
      />

      {!report || reportQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label={t('kpiGross')} value={formatCurrencyValue(report.gross_revenue)} currency={displayCurrency} />
            <MetricCard label={t('kpiNet')} value={formatCurrencyValue(report.net_revenue)} currency={displayCurrency} />
            <MetricCard label={t('kpiGrossProfit')} value={formatCurrencyValue(report.gross_profit)} currency={displayCurrency} />
            <MetricCard label={t('reportsOperatingExpenses')} value={formatCurrencyValue(report.operating_expenses)} currency={displayCurrency} />
            <MetricCard label={t('traceEbitda')} value={formatCurrencyValue(report.ebitda)} currency={displayCurrency} />
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card variant="solid">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('reportsStatementTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <ErLines lines={report.statement_lines} formatCurrency={formatCurrency} />
              </CardContent>
            </Card>

            <Card variant="solid">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('reportsByChannelTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 pt-0 md:grid-cols-2">
                {report.channels.map((channel) => (
                  <div key={channel.channel} className="rounded-lg border border-border-subtle p-3">
                    <div className="mb-2 text-xs font-semibold text-text-primary">{normalizeChannelLabel(channel.channel)}</div>
                    <ErLines lines={channel.lines} formatCurrency={formatCurrency} compact />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card variant="solid">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t('wfTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <PnlWaterfallPanel steps={waterfallSteps} heightClassName="h-[340px]" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card variant="solid">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('reportsSalesMixTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {mixData.length ? <PieChartPanel data={mixData} colorByName={mixColors} heightClassName="h-72" /> : <div className="text-sm text-text-secondary">No data</div>}
              </CardContent>
            </Card>
            <Card variant="solid">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('reportsExpensesByCategoryTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {expenseByCategoryBars.length ? (
                  <BarChartPanel
                    data={expenseByCategoryBars}
                    dataKeyX="category"
                    bars={[{ key: 'amount', name: t('reportsOperatingExpenses') }]}
                    heightClassName="h-[320px]"
                  />
                ) : (
                  <div className="text-sm text-text-secondary">No data</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card variant="solid">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('monthlyTitle')}</CardTitle>
                <CardAction>
                  <Tabs
                    value={monthlyBarLayout}
                    onValueChange={(v) => {
                      if (v === 'grouped' || v === 'stacked') setMonthlyBarLayout(v)
                    }}
                    aria-label={t('monthlyTitle')}
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
                <MonthlyEvolutionPanel
                  data={monthlyData}
                  barLayout={monthlyBarLayout}
                  titleLabels={{
                    netRevenue: t('monthlyChartNetIngresos'),
                    grossProfit: t('traceContributionMargin'),
                    ebitda: t('traceEbitda'),
                    marginPct: t('monthlyChartMarginLine'),
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function ErLines({
  lines,
  formatCurrency,
  compact = false,
}: {
  lines: ReportsErLine[]
  formatCurrency: (value: number | string) => string
  compact?: boolean
}) {
  return (
    <div className="space-y-1">
      {lines.map((line) => {
        const valueNumber = Number(line.value)
        const valueText = line.unit === '%' ? `${valueNumber.toFixed(1)}%` : formatCurrency(valueNumber)
        const cls =
          line.kind === 'total'
            ? 'font-semibold text-text-primary'
            : line.kind === 'subtotal'
              ? 'font-medium text-text-primary'
              : 'text-text-secondary'
        return (
          <div key={`${line.label}-${line.kind}`} className={`flex items-center justify-between ${compact ? 'text-[11px]' : 'text-sm'}`}>
            <span className={cls}>{line.label}</span>
            <span className={`${cls} font-mono`}>{valueText}</span>
          </div>
        )
      })}
    </div>
  )
}
