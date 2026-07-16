import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { KpiResponse, ProductKpiResponse } from '@/lib/types/reports'
import { KpiCard } from '@/pages/reports/report-ui'

type ReportsHeroKpisProps = {
  mode: 'tenant' | 'product'
  kpi: KpiResponse | null
  productKpi: ProductKpiResponse | null
  kpiPrev: KpiResponse | null
  productKpiPrev: ProductKpiResponse | null
  previousReady: boolean
  momPct: number | null
  momReady: boolean
  yoyPct: number | null
  yoyReady: boolean
  currency: string
  t: (key: ShellStringKey) => string
}

export function ReportsHeroKpis({
  mode,
  kpi,
  productKpi,
  kpiPrev,
  productKpiPrev,
  previousReady,
  momPct,
  momReady,
  yoyPct,
  yoyReady,
  currency,
  t,
}: ReportsHeroKpisProps) {
  const vsPrior = t('reportsVsPreviousPeriod')
  const comparisonUnavailable = t('reportsComparisonUnavailable')

  if (mode === 'product' && productKpi) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          variant="hero"
          label={t('reportsNetRevenue')}
          helpText={t('reportsKpiHelpNetRevenue')}
          value={productKpi.net_revenue}
          format="currency"
          currency={currency}
          previous={productKpiPrev?.net_revenue}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
        />
        <KpiCard
          variant="hero"
          label={t('reportsGrossRevenue')}
          helpText={t('reportsKpiHelpGrossRevenue')}
          value={productKpi.gross_revenue}
          format="currency"
          currency={currency}
          previous={productKpiPrev?.gross_revenue}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
        />
        <KpiCard
          variant="hero"
          label={t('reportsKpiMargenBrutoPct')}
          helpText={t('reportsKpiHelpMargenBrutoPct')}
          value={productKpi.gross_margin_pct}
          format="percent"
          currency={currency}
          previous={productKpiPrev?.gross_margin_pct}
          previousReady={previousReady}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
        />
        <KpiCard
          variant="hero"
          label={t('reportsKpiGrowthLabel')}
          helpText={t('reportsKpiHelpGrowth')}
          value={yoyPct ?? 0}
          format="percent"
          currency={currency}
          previous={undefined}
          previousReady={false}
          vsPriorLabel={vsPrior}
          comparisonUnavailable={comparisonUnavailable}
          showVsPrior={false}
          displayValue={
            [
              momReady && momPct !== null ? `MoM ${momPct.toFixed(1)}%` : 'MoM —',
              yoyReady && yoyPct !== null ? `YoY ${yoyPct.toFixed(1)}%` : 'YoY —',
            ].join(' · ')
          }
          negative={
            (momPct !== null && momPct < 0) || (yoyPct !== null && yoyPct < 0)
          }
        />
      </div>
    )
  }

  if (!kpi) return null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        label={t('reportsKpiGrowthLabel')}
        helpText={t('reportsKpiHelpGrowth')}
        value={yoyPct ?? 0}
        format="percent"
        currency={currency}
        previous={undefined}
        previousReady={false}
        vsPriorLabel={vsPrior}
        comparisonUnavailable={comparisonUnavailable}
        showVsPrior={false}
        displayValue={
          [
            momReady && momPct !== null ? `MoM ${momPct.toFixed(1)}%` : 'MoM —',
            yoyReady && yoyPct !== null ? `YoY ${yoyPct.toFixed(1)}%` : 'YoY —',
          ].join(' · ')
        }
        negative={(momPct !== null && momPct < 0) || (yoyPct !== null && yoyPct < 0)}
      />
    </div>
  )
}
