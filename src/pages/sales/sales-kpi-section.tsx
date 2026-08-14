import type { ShellStringKey } from '@/lib/i18n/shell-strings'

import { useMoney } from '@/hooks/use-money'
import { KpiCard, SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { kpiCardGridClassName } from '@/ui/kpi-card'
import { formatGrowthPctDisplay } from '@/pages/reports/reports-ui-helpers'

import type { SalesKpiSource } from './sales-kpi-source'

type SalesKpiSectionProps = {
  kpi: SalesKpiSource
  kpiPrev: SalesKpiSource | undefined
  currency: string
  previousReady: boolean
  vsPrior: string
  comparisonUnavailable: string
  momPct: number | null
  momReady: boolean
  yoyPct: number | null
  yoyReady: boolean
  showDeductions: boolean
  t: (k: ShellStringKey) => string
}

export function SalesKpiSection({
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
  showDeductions,
  t,
}: SalesKpiSectionProps) {
  const { format: formatMoney } = useMoney()
  const fmt = (v: number) => formatMoney(v, { nativeCurrency: currency })
  const orders = kpi.order_count || 0
  const units = kpi.units_sold
  const prevOrders = kpiPrev?.order_count
  const prevUnits = kpiPrev?.units_sold
  const noBaseline = t('reportsComparisonNoBaseline')

  const deductionsTotal =
    showDeductions && kpi.discounts !== undefined && kpi.returns !== undefined
      ? -(kpi.discounts + kpi.returns)
      : null
  const prevDeductions =
    showDeductions &&
    kpiPrev?.discounts !== undefined &&
    kpiPrev.returns !== undefined
      ? -(kpiPrev.discounts + kpiPrev.returns)
      : undefined

  const aov = orders > 0 ? kpi.net_revenue / orders : null
  const prevAov =
    kpiPrev !== undefined && (kpiPrev.order_count || 0) > 0
      ? kpiPrev.net_revenue / kpiPrev.order_count
      : undefined

  const momDisplay = formatGrowthPctDisplay(momReady, momPct, noBaseline)
  const yoyDisplay = formatGrowthPctDisplay(yoyReady, yoyPct, noBaseline)

  return (
    <SectionContainer>
      <SectionHeader title={t('reportsSectionVentas')} />
      <div className={kpiCardGridClassName}>
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
        {deductionsTotal !== null ? (
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
        ) : null}
        <KpiCard
          label={t('reportsOrders')}
          helpText={t('reportsKpiHelpOrders')}
          value={orders}
          format="count"
          currency={currency}
          previous={prevOrders}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
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
          displayValue={aov !== null ? fmt(aov) : '—'}
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
  )
}
