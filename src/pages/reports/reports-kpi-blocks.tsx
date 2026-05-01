import type { ReactNode } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { KpiResponse } from '@/lib/types/reports'

import { fmtCurrency } from './reports-ui-helpers'
import { KpiCard, SectionContainer, SectionHeader } from './report-ui'

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

type ReportsSummaryCardsProps = {
  kpi: KpiResponse
  kpiPrev: KpiResponse | undefined
  currency: string
  previousReady: boolean
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

  const momDisplay =
    momReady && momPct !== null ? `${momPct.toFixed(1)}%` : '—'
  const yoyDisplay =
    yoyReady && yoyPct !== null ? `${yoyPct.toFixed(1)}%` : '—'

  const ordersFooter: ReactNode = (
    <>
      <div>
        {t('reportsOrdersPaid')}: {paid.toLocaleString()} ({pctOfOrders(paid).toFixed(0)}%)
      </div>
      <div>
        {t('reportsOrdersRefunded')}: {refunded.toLocaleString()} ({pctOfOrders(refunded).toFixed(0)}%)
      </div>
      <div>
        {t('reportsOrdersExpired')}: {expired.toLocaleString()} ({pctOfOrders(expired).toFixed(0)}%)
      </div>
    </>
  )

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          variant="hero"
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
        <KpiCard
          variant="hero"
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
        <KpiCard
          variant="hero"
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
        <KpiCard
          variant="hero"
          label={t('reportsOrders')}
          helpText={t('reportsKpiHelpOrders')}
          value={orders}
          format="count"
          currency={currency}
          previous={prevOrders}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          footer={ordersFooter}
        />
        <KpiCard
          variant="hero"
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
      </div>

      <SectionContainer>
        <SectionHeader title={t('reportsSectionVentas')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
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
          <KpiCard
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
          <KpiCard
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
          <KpiCard
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
          <KpiCard
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
          <KpiCard
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
          <KpiCard
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
        </div>
      </SectionContainer>

      <SectionContainer>
        <SectionHeader title={t('reportsSectionCostos')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
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
          <KpiCard
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
          <KpiCard
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
          <KpiCard
            label={t('reportsWfAdsSpend')}
            helpText={t('reportsKpiHelpAdsSpend')}
            value={kpi.ads_spend}
            format="currency"
            currency={currency}
            previous={kpiPrev?.ads_spend}
            previousReady={previousReady}
            vsPriorLabel={vsPrior}
            comparisonUnavailable={comparisonUnavailable}
            negative
          />
        </div>
      </SectionContainer>

      <SectionContainer>
        <SectionHeader title={t('reportsSectionRentabilidad')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
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
          <KpiCard
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
          <KpiCard
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
          <KpiCard
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
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border-default/30 pt-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
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
          <KpiCard
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
          <KpiCard
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
          <KpiCard
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
        </div>
      </SectionContainer>
    </div>
  )
}
