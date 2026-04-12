import { HelpCircle } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { KpiResponse } from '@/lib/types/reports'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

import { fmtCurrency, pctVersusPrevious } from './reports-ui-helpers'

const PAID_STATUS_KEYS = ['PAID', 'PARTIALLY_PAID'] as const
const REFUNDED_STATUS_KEYS = ['REFUNDED', 'PARTIALLY_REFUNDED'] as const
const EXPIRED_STATUS_KEYS = ['EXPIRED'] as const

function sumOrderStatuses(
  map: Record<string, number> | undefined,
  keys: readonly string[],
): number {
  if (!map) return 0
  let s = 0
  for (const k of keys) s += map[k] ?? 0
  return s
}

function DeltaPill({
  current,
  previous,
  previousReady,
  negative,
  vsPriorLabel,
  comparisonUnavailable,
  compact = false,
}: {
  current: number
  previous: number | undefined
  previousReady: boolean
  negative?: boolean
  vsPriorLabel: string
  comparisonUnavailable: string
  compact?: boolean
}) {
  const delta = previous !== undefined ? pctVersusPrevious(current, previous) : null
  const invertGood = Boolean(negative)

  if (!previousReady || previous === undefined) {
    return (
      <span
        className="rounded-full bg-glass-fill-soft px-2 py-0.5 text-[10px] text-text-tertiary backdrop-blur-sm"
        title={comparisonUnavailable}
      >
        —
      </span>
    )
  }

  if (delta === null) {
    return (
      <span className="text-[10px] text-text-tertiary" title={`${vsPriorLabel} · —`}>
        —
      </span>
    )
  }

  const { pct, trend } = delta
  const good = invertGood ? trend === 'down' : trend === 'up'
  const bad = invertGood ? trend === 'up' : trend === 'down'
  const arrow = trend === 'flat' ? '→' : trend === 'up' ? '↑' : '↓'
  const pctStr = `${trend === 'up' && pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
  const title = `${vsPriorLabel}: ${pctStr}`

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span
        title={title}
        className={cn(
          'rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
          good && 'bg-brand-dim text-brand',
          bad && 'bg-danger-dim text-danger',
          !good && !bad && 'bg-muted text-text-tertiary',
        )}
      >
        <span className="font-mono text-[10px]" aria-hidden>
          {arrow}
        </span>
        {pctStr}
      </span>
      {!compact ? (
        <span className="max-w-[7rem] text-[9px] leading-tight text-text-tertiary">{vsPriorLabel}</span>
      ) : null}
    </div>
  )
}

function CompactKpiCard({
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
}: {
  label: string
  helpText: string
  value: number
  format: 'currency' | 'count' | 'percent'
  currency: string
  previous: number | undefined
  previousReady: boolean
  vsPriorLabel: string
  comparisonUnavailable: string
  negative?: boolean
}) {
  const display =
    format === 'currency'
      ? fmtCurrency(value, currency)
      : format === 'percent'
        ? `${value.toFixed(1)}%`
        : value.toLocaleString()

  return (
    <div
      className={cn(
        'flex min-h-[5.25rem] flex-col justify-between rounded-[1.75rem] border border-border-subtle bg-card p-4 shadow-[var(--glass-shadow)] backdrop-blur-xl',
        'transition-shadow hover:shadow-[var(--glass-shadow-hover)]',
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[11px] font-medium leading-snug text-text-secondary">{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="shrink-0 rounded p-0.5 text-text-tertiary hover:text-text-secondary"
              aria-label={helpText}
            >
              <HelpCircle className="size-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-left font-normal leading-snug">
            {helpText}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-2 flex min-h-[2.5rem] items-end justify-between gap-2">
        <p
          className={cn(
            'min-w-0 truncate text-lg font-semibold tracking-tight tabular-nums sm:text-xl',
            negative ? 'text-danger' : 'text-text-primary',
          )}
        >
          {display}
        </p>
        <DeltaPill
          current={value}
          previous={previous}
          previousReady={previousReady}
          negative={negative}
          vsPriorLabel={vsPriorLabel}
          comparisonUnavailable={comparisonUnavailable}
        />
      </div>
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
  const status = kpi.order_status_counts ?? {}

  const paid = sumOrderStatuses(status, PAID_STATUS_KEYS)
  const refunded = sumOrderStatuses(status, REFUNDED_STATUS_KEYS)
  const expired = sumOrderStatuses(status, EXPIRED_STATUS_KEYS)

  const pctOfOrders = (n: number) => (orders > 0 ? (n / orders) * 100 : 0)

  const chipClass =
    'inline-flex items-center gap-1 rounded-full border border-border-default bg-glass-fill-soft px-2.5 py-0.5 text-[10px] font-medium tabular-nums text-text-primary backdrop-blur-md'

  return (
    <div className="space-y-3">
      {lastUpdatedLabel ? (
        <p className="text-right text-[11px] text-text-tertiary tabular-nums">
          {t('reportsLastUpdated')}: {lastUpdatedLabel}
          {kpiFetching ? ' · …' : ''}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <CompactKpiCard
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
        <CompactKpiCard
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
        <CompactKpiCard
          label={t('reportsGrossProfit')}
          helpText={t('reportsKpiHelpGrossProfit')}
          value={kpi.gross_profit}
          format="currency"
          currency={currency}
          previous={kpiPrev?.gross_profit}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
        />
        <CompactKpiCard
          label={t('reportsNetProfit')}
          helpText={t('reportsKpiHelpNetProfit')}
          value={kpi.net_profit}
          format="currency"
          currency={currency}
          previous={kpiPrev?.net_profit}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          negative={kpi.net_profit < 0}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[1.75rem] border border-border-subtle bg-card px-4 py-3 shadow-[var(--glass-shadow)] backdrop-blur-xl">
        <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
          {t('reportsGrossMargin')}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="rounded p-0.5 text-text-tertiary hover:text-text-secondary"
                aria-label={t('reportsKpiHelpGrossMargin')}
              >
                <HelpCircle className="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-left text-xs font-normal">
              {t('reportsKpiHelpGrossMargin')}
            </TooltipContent>
          </Tooltip>
          <span className="font-semibold tabular-nums text-text-primary">
            {kpi.gross_margin_pct.toFixed(1)}%
          </span>
          <DeltaPill
            current={kpi.gross_margin_pct}
            previous={kpiPrev?.gross_margin_pct}
            previousReady={previousReady}
            vsPriorLabel={vsPrior}
            comparisonUnavailable={comparisonUnavailable}
            compact
          />
        </span>

        <span className="hidden h-3 w-px bg-border-default sm:block" aria-hidden />

        <span className="flex items-center gap-2 text-[12px]">
          <span className="text-text-secondary">{t('reportsUnitsSoldLabel')}</span>
          <span className="font-semibold tabular-nums text-text-primary">{units.toLocaleString()}</span>
          <DeltaPill
            current={units}
            previous={prevUnits}
            previousReady={previousReady}
            vsPriorLabel={vsPrior}
            comparisonUnavailable={comparisonUnavailable}
            compact
          />
        </span>

        <span className="hidden h-3 w-px bg-border-default sm:block" aria-hidden />

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="flex items-center gap-2 text-[12px]">
            <span className="text-text-secondary">{t('reportsOrdersTotal')}</span>
            <span className="font-semibold tabular-nums text-text-primary">{orders.toLocaleString()}</span>
            <DeltaPill
              current={orders}
              previous={prevOrders}
              previousReady={previousReady}
              vsPriorLabel={vsPrior}
              comparisonUnavailable={comparisonUnavailable}
              compact
            />
          </span>
          <span className={chipClass}>
            {t('reportsOrdersPaid')}: {paid.toLocaleString()}
            <span className="font-normal text-text-tertiary"> ({pctOfOrders(paid).toFixed(0)}%)</span>
          </span>
          <span className={chipClass}>
            {t('reportsOrdersRefunded')}: {refunded.toLocaleString()}
            <span className="font-normal text-text-tertiary"> ({pctOfOrders(refunded).toFixed(0)}%)</span>
          </span>
          <span className={chipClass}>
            {t('reportsOrdersExpired')}: {expired.toLocaleString()}
            <span className="font-normal text-text-tertiary"> ({pctOfOrders(expired).toFixed(0)}%)</span>
          </span>
        </div>
      </div>
    </div>
  )
}
