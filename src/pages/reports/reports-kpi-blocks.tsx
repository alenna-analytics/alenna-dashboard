import type { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { KpiResponse } from '@/lib/types/reports'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

import { fmtCurrency, pctVersusPrevious } from './reports-ui-helpers'

const PAID_STATUS_KEYS = ['PAID'] as const
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
          'rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums',
          good && 'border-brand/10 bg-brand-dim text-brand',
          bad && 'border-danger/10 bg-danger-dim text-danger',
          !good && !bad && 'border-border-subtle bg-muted text-text-tertiary',
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
  className,
  showVsPrior = true,
  displayValue,
  footer,
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
  className?: string
  showVsPrior?: boolean
  displayValue?: string
  footer?: ReactNode
}) {
  const computedDisplay =
    format === 'currency'
      ? fmtCurrency(value, currency)
      : format === 'percent'
        ? `${value.toFixed(1)}%`
        : value.toLocaleString()

  const display = displayValue ?? computedDisplay

  return (
    <div
      className={cn(
        'flex flex-col rounded-[2rem] p-5 surface-kpi-card xl:col-span-1',
        footer ? 'min-h-[14rem] sm:min-h-[15rem]' : 'min-h-[11rem] justify-between',
        'transition-[box-shadow,transform] duration-200 hover:shadow-[var(--shadow-ink-lg)] motion-safe:hover:-translate-y-px',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="max-w-[14rem] text-[11px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
          {label}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="shrink-0 rounded-full border border-transparent p-1 text-text-tertiary hover:border-border-subtle hover:text-text-secondary"
              aria-label={helpText}
            >
              <HelpCircle className="size-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px] text-left font-normal leading-snug">
            {helpText}
          </TooltipContent>
        </Tooltip>
      </div>
      <div
        className={cn(
          'mt-3 flex min-h-[2.5rem] items-end gap-3',
          showVsPrior ? 'justify-between' : 'justify-start',
        )}
      >
        <p
          className={cn(
            'min-w-0 font-semibold tracking-[-0.04em] tabular-nums leading-none text-[1.8rem]',
            negative ? 'text-danger' : 'text-text-primary',
          )}
        >
          {display}
        </p>
        {showVsPrior ? (
          <DeltaPill
            current={value}
            previous={previous}
            previousReady={previousReady}
            negative={negative}
            vsPriorLabel={vsPriorLabel}
            comparisonUnavailable={comparisonUnavailable}
          />
        ) : null}
      </div>
      {footer ? <div className="mt-4 flex flex-wrap gap-x-2 gap-y-2 border-t border-border-default/60 pt-4">{footer}</div> : null}
    </div>
  )
}

function KpiSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold tracking-[-0.02em] text-text-primary sm:text-lg">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
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
  momPct: number | null
  momReady: boolean
  yoyPct: number | null
  yoyReady: boolean
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
  momPct,
  momReady,
  yoyPct,
  yoyReady,
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

  const deductionsTotal = -(kpi.discounts + kpi.returns)
  const prevDeductions =
    kpiPrev !== undefined ? -(kpiPrev.discounts + kpiPrev.returns) : undefined

  const aov = orders > 0 ? kpi.net_revenue / orders : null
  const prevAov =
    kpiPrev !== undefined && (kpiPrev.order_count || 0) > 0
      ? kpiPrev.net_revenue / kpiPrev.order_count
      : undefined

  const cmDecimal = kpi.contribution_margin_pct / 100
  const breakEvenRev =
    cmDecimal > 0 ? kpi.fixed_operating_expenses / cmDecimal : null

  const chipClass =
    'inline-flex items-center gap-1.5 rounded-full border border-border-default bg-bg-elevated px-3 py-1.5 text-[11px] font-medium tabular-nums text-text-primary shadow-[var(--shadow-ink-xs)]'

  const momDisplay =
    momReady && momPct !== null ? `${momPct.toFixed(1)}%` : '—'
  const yoyDisplay =
    yoyReady && yoyPct !== null ? `${yoyPct.toFixed(1)}%` : '—'

  return (
    <div className="space-y-8">
      {lastUpdatedLabel ? (
        <p className="text-right text-[11px] uppercase tracking-[0.16em] text-text-tertiary tabular-nums">
          {t('reportsLastUpdated')}: {lastUpdatedLabel}
          {kpiFetching ? ' · …' : ''}
        </p>
      ) : null}

      <KpiSection title={t('reportsSectionVentas')}>
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
          label={t('reportsKpiDeductionsCombined')}
          helpText={t('reportsKpiHelpDeductionsCombined')}
          value={deductionsTotal}
          format="currency"
          currency={currency}
          previous={prevDeductions}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          negative
        />
        <CompactKpiCard
          label={t('reportsOrders')}
          helpText={t('reportsKpiHelpOrders')}
          value={orders}
          format="count"
          currency={currency}
          previous={prevOrders}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          footer={
            <>
              <span className={chipClass}>
                {t('reportsOrdersPaid')}: {paid.toLocaleString()}
                <span className="font-normal text-text-tertiary">
                  {' '}
                  ({pctOfOrders(paid).toFixed(0)}%)
                </span>
              </span>
              <span className={chipClass}>
                {t('reportsOrdersRefunded')}: {refunded.toLocaleString()}
                <span className="font-normal text-text-tertiary">
                  {' '}
                  ({pctOfOrders(refunded).toFixed(0)}%)
                </span>
              </span>
              <span className={chipClass}>
                {t('reportsOrdersExpired')}: {expired.toLocaleString()}
                <span className="font-normal text-text-tertiary">
                  {' '}
                  ({pctOfOrders(expired).toFixed(0)}%)
                </span>
              </span>
            </>
          }
        />
        <CompactKpiCard
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
        <CompactKpiCard
          label={t('reportsKpiAov')}
          helpText={t('reportsKpiHelpAov')}
          value={aov ?? 0}
          format="currency"
          currency={currency}
          previous={prevAov}
          previousReady={previousReady && orders > 0}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          displayValue={aov !== null ? fmtCurrency(aov, currency) : '—'}
          showVsPrior={orders > 0}
        />
        <CompactKpiCard
          label={t('reportsKpiMomLabel')}
          helpText={t('reportsKpiHelpMom')}
          value={momPct ?? 0}
          format="percent"
          currency={currency}
          previous={undefined}
          previousReady={false}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          displayValue={momDisplay}
          showVsPrior={false}
          negative={momPct !== null && momPct < 0}
        />
        <CompactKpiCard
          label={t('reportsKpiYoyLabel')}
          helpText={t('reportsKpiHelpYoy')}
          value={yoyPct ?? 0}
          format="percent"
          currency={currency}
          previous={undefined}
          previousReady={false}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          displayValue={yoyDisplay}
          showVsPrior={false}
          negative={yoyPct !== null && yoyPct < 0}
        />
      </KpiSection>

      <KpiSection title={t('reportsSectionRentabilidad')}>
        <CompactKpiCard
          label={t('reportsKpiCogsLabel')}
          helpText={t('reportsKpiHelpCogs')}
          value={kpi.cogs}
          format="currency"
          currency={currency}
          previous={kpiPrev?.cogs}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          negative
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
          label={t('reportsKpiMargenBrutoPct')}
          helpText={t('reportsKpiHelpMargenBrutoPct')}
          value={kpi.gross_margin_pct}
          format="percent"
          currency={currency}
          previous={kpiPrev?.gross_margin_pct}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
        />
        <CompactKpiCard
          label={t('reportsKpiPlatformFees')}
          helpText={t('reportsKpiHelpPlatformFees')}
          value={kpi.platform_fees_total}
          format="currency"
          currency={currency}
          previous={kpiPrev?.platform_fees_total}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          negative
        />
        <CompactKpiCard
          label={t('reportsKpiFulfillmentCost')}
          helpText={t('reportsKpiHelpFulfillmentCost')}
          value={kpi.merchant_shipping_cost}
          format="currency"
          currency={currency}
          previous={kpiPrev?.merchant_shipping_cost}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          negative
        />
        <CompactKpiCard
          label={t('reportsContributionMargin')}
          helpText={t('reportsKpiHelpContributionMargin')}
          value={kpi.contribution_margin}
          format="currency"
          currency={currency}
          previous={kpiPrev?.contribution_margin}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          negative={kpi.contribution_margin < 0}
        />
        <CompactKpiCard
          label={t('reportsKpiContributionMarginPctLabel')}
          helpText={t('reportsKpiHelpContributionMarginPct')}
          value={kpi.contribution_margin_pct}
          format="percent"
          currency={currency}
          previous={kpiPrev?.contribution_margin_pct}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          negative={kpi.contribution_margin_pct < 0}
        />
        <CompactKpiCard
          label={t('reportsKpiFixedOpex')}
          helpText={t('reportsKpiHelpFixedOpex')}
          value={kpi.fixed_operating_expenses}
          format="currency"
          currency={currency}
          previous={kpiPrev?.fixed_operating_expenses}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          negative
        />
        <CompactKpiCard
          label={t('reportsEbitda')}
          helpText={t('reportsKpiHelpEbitda')}
          value={kpi.ebitda}
          format="currency"
          currency={currency}
          previous={kpiPrev?.ebitda}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          negative={kpi.ebitda < 0}
        />
        <CompactKpiCard
          label={t('reportsKpiEbitdaMarginPct')}
          helpText={t('reportsKpiHelpEbitdaMarginPct')}
          value={kpi.ebitda_margin_pct}
          format="percent"
          currency={currency}
          previous={kpiPrev?.ebitda_margin_pct}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          negative={kpi.ebitda_margin_pct < 0}
        />
        <CompactKpiCard
          label={t('reportsKpiBreakEven')}
          helpText={t('reportsKpiHelpBreakEven')}
          value={breakEvenRev ?? 0}
          format="currency"
          currency={currency}
          previous={undefined}
          previousReady={false}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          displayValue={
            breakEvenRev !== null ? fmtCurrency(breakEvenRev, currency) : '—'
          }
          showVsPrior={false}
        />
      </KpiSection>
    </div>
  )
}
