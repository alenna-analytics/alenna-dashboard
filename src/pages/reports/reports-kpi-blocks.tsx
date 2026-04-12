import { HelpCircle } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { KpiResponse } from '@/lib/types/reports'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

import { fmtCurrency, pctVersusPrevious } from './reports-ui-helpers'

function DeltaRow({
  current,
  previous,
  previousReady,
  negative,
  vsPriorLabel,
  comparisonUnavailable,
}: {
  current: number
  previous: number | undefined
  previousReady: boolean
  negative?: boolean
  vsPriorLabel: string
  comparisonUnavailable: string
}) {
  const delta = previous !== undefined ? pctVersusPrevious(current, previous) : null
  const invertGood = Boolean(negative)

  if (!previousReady || previous === undefined) {
    return (
      <p className="text-[11px] leading-snug text-text-tertiary tabular-nums">
        {comparisonUnavailable}
      </p>
    )
  }

  if (delta === null) {
    return (
      <p className="text-[11px] leading-snug text-text-tertiary tabular-nums">
        <span className="font-medium text-text-secondary">{vsPriorLabel}</span>
        <span className="text-text-tertiary"> · —</span>
      </p>
    )
  }

  const { pct, trend } = delta
  const good = invertGood ? trend === 'down' : trend === 'up'
  const bad = invertGood ? trend === 'up' : trend === 'down'
  const arrowGlyph = trend === 'flat' ? '→' : trend === 'up' ? '↑' : '↓'
  const colorClass = good
    ? 'text-emerald-600 dark:text-emerald-400'
    : bad
      ? 'text-red-600 dark:text-red-400'
      : 'text-text-tertiary'

  return (
    <p className={cn('flex flex-wrap items-center gap-1.5 text-[11px] font-semibold tabular-nums', colorClass)}>
      <span className="font-mono text-xs" aria-hidden>
        {arrowGlyph}
      </span>
      <span>
        {trend === 'up' ? '+' : ''}
        {pct.toFixed(1)}%
      </span>
      <span className="font-normal text-text-tertiary">{vsPriorLabel}</span>
    </p>
  )
}

type MetricLineProps = {
  label: string
  helpText: string
  value: number
  format: 'currency' | 'count'
  currency: string
  previous: number | undefined
  previousReady: boolean
  vsPriorLabel: string
  comparisonUnavailable: string
  negative?: boolean
  badge?: string
  badgeLabel?: string
  emphasis: 'hero' | 'compact'
}

function MetricLine({
  label,
  helpText,
  value,
  format,
  currency,
  previous,
  previousReady,
  vsPriorLabel,
  comparisonUnavailable,
  negative,
  badge,
  badgeLabel,
  emphasis,
}: MetricLineProps) {
  const display =
    format === 'currency' ? fmtCurrency(value, currency) : value.toLocaleString()

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            'font-semibold uppercase tracking-wide text-text-secondary',
            emphasis === 'hero' ? 'text-[11px]' : 'text-[10px]',
          )}
        >
          {label}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="shrink-0 rounded-md p-0.5 text-text-tertiary transition-colors hover:text-text-secondary"
              aria-label={helpText}
            >
              <HelpCircle className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-left font-normal leading-snug">
            {helpText}
          </TooltipContent>
        </Tooltip>
      </div>
      <p
        className={cn(
          'font-semibold tabular-nums tracking-tight',
          emphasis === 'hero' ? 'text-3xl' : 'text-lg',
          negative ? 'text-destructive' : 'text-text-primary',
        )}
      >
        {display}
      </p>
      <DeltaRow
        current={value}
        previous={previous}
        previousReady={previousReady}
        negative={negative}
        vsPriorLabel={vsPriorLabel}
        comparisonUnavailable={comparisonUnavailable}
      />
      {badge ? (
        <div className="pt-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/70 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-text-primary">
            {badge}
            {badgeLabel ? <span className="font-medium text-text-tertiary">{badgeLabel}</span> : null}
          </span>
        </div>
      ) : null}
    </div>
  )
}

type ReportsSummaryCardsProps = {
  kpi: KpiResponse
  kpiPrev: KpiResponse | undefined
  currency: string
  previousReady: boolean
  lastUpdatedLabel: string | null
  kpiFetching: boolean
  vsPrior: string
  comparisonUnavailable: string
  t: (k: ShellStringKey) => string
}

export function ReportsSummaryCards({
  kpi,
  kpiPrev,
  currency,
  previousReady,
  lastUpdatedLabel,
  kpiFetching,
  vsPrior,
  comparisonUnavailable,
  t,
}: ReportsSummaryCardsProps) {
  const orders = kpi.order_count || 0
  const units = kpi.units_sold
  const prevOrders = kpiPrev?.order_count
  const prevUnits = kpiPrev?.units_sold

  return (
    <div className="space-y-3">
      {lastUpdatedLabel ? (
        <p className="text-right text-[11px] text-text-tertiary tabular-nums">
          {t('reportsLastUpdated')}: {lastUpdatedLabel}
          {kpiFetching ? ' · …' : ''}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex flex-col border bg-white shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-text-primary">
              {t('reportsCardRevenue')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6 pt-0">
            <MetricLine
              emphasis="hero"
              label={t('reportsGrossRevenue')}
              helpText={t('reportsKpiHelpGrossRevenue')}
              value={kpi.gross_revenue}
              format="currency"
              currency={currency}
              previous={kpiPrev?.gross_revenue}
              previousReady={previousReady}
              vsPriorLabel={vsPrior}
              comparisonUnavailable={comparisonUnavailable}
            />
            <div className="border-t border-border-subtle pt-4">
              <MetricLine
                emphasis="compact"
                label={t('reportsNetRevenue')}
                helpText={t('reportsKpiHelpNetRevenue')}
                value={kpi.net_revenue}
                format="currency"
                currency={currency}
                previous={kpiPrev?.net_revenue}
                previousReady={previousReady}
                vsPriorLabel={vsPrior}
                comparisonUnavailable={comparisonUnavailable}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col border bg-white shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-text-primary">
              {t('reportsCardProfit')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6 pt-0">
            <MetricLine
              emphasis="hero"
              label={t('reportsGrossProfit')}
              helpText={t('reportsKpiHelpGrossProfit')}
              value={kpi.gross_profit}
              format="currency"
              currency={currency}
              previous={kpiPrev?.gross_profit}
              previousReady={previousReady}
              vsPriorLabel={vsPrior}
              comparisonUnavailable={comparisonUnavailable}
              badge={`${kpi.gross_margin_pct.toFixed(1)}%`}
              badgeLabel={t('reportsGrossMargin')}
            />
            <div className="border-t border-border-subtle pt-4">
              <MetricLine
                emphasis="compact"
                label={t('reportsNetProfit')}
                helpText={t('reportsKpiHelpNetProfit')}
                value={kpi.net_profit}
                format="currency"
                currency={currency}
                previous={kpiPrev?.net_profit}
                previousReady={previousReady}
                negative={kpi.net_profit < 0}
                vsPriorLabel={vsPrior}
                comparisonUnavailable={comparisonUnavailable}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col border bg-white shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-text-primary">
              {t('reportsCardOrders')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center pt-0">
            <MetricLine
              emphasis="hero"
              label={t('reportsOrdersTotal')}
              helpText={t('reportsKpiHelpOrders')}
              value={orders}
              format="count"
              currency={currency}
              previous={prevOrders}
              previousReady={previousReady}
              vsPriorLabel={vsPrior}
              comparisonUnavailable={comparisonUnavailable}
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col border bg-white shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-text-primary">
              {t('reportsCardVolume')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center pt-0">
            <MetricLine
              emphasis="hero"
              label={t('reportsUnitsSoldLabel')}
              helpText={t('reportsKpiHelpUnits')}
              value={units}
              format="count"
              currency={currency}
              previous={prevUnits}
              previousReady={previousReady}
              vsPriorLabel={vsPrior}
              comparisonUnavailable={comparisonUnavailable}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
