import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { PnlRow, PnlRowId } from '@/pages/reports/reports-pnl-rows'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'

const ROW_LABEL_KEYS: Record<PnlRowId, ShellStringKey> = {
  gross_revenue: 'reportsWfGrossRevenue',
  discounts: 'reportsWfDiscounts',
  returns: 'reportsWfReturns',
  net_revenue: 'reportsWfNetRevenue',
  cogs: 'reportsWfCogs',
  gross_profit: 'reportsWfGrossProfit',
  platform_fees: 'reportsKpiPlatformFees',
  merchant_shipping: 'reportsKpiFulfillmentCost',
  ads_spend: 'reportsWfAdsSpend',
  contribution_margin: 'reportsWfContributionMargin',
  fixed_opex: 'reportsWfOpex',
  ebitda: 'reportsWfEbitda',
}

type ReportsPnlTableProps = {
  rows: PnlRow[]
  formatMoney: (value: number) => string
  cogsIncomplete: boolean
  t: (key: ShellStringKey) => string
}

function fmtPct(n: number | null): string {
  if (n === null) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function fmtDeltaMoney(n: number | null, formatMoney: (v: number) => string): string {
  if (n === null) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${formatMoney(n)}`
}

export function ReportsPnlTable({
  rows,
  formatMoney,
  cogsIncomplete,
  t,
}: ReportsPnlTableProps) {
  return (
    <SectionContainer className="overflow-hidden">
      <SectionHeader
        title={t('reportsPnlTableTitle')}
        description={t('reportsPnlTableSubtitle')}
      />
      {cogsIncomplete ? (
        <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t('reportsCogsIncompleteWarning')}
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-default text-left text-text-secondary">
              <th className="px-3 py-2 font-medium">{t('reportsPnlColConcept')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('reportsPnlColCurrent')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('reportsPnlColPrevious')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('reportsPnlColDeltaAbs')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('reportsPnlColDeltaPct')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('reportsPnlColYoyPct')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const displayCurrent = r.isDeduction ? -Math.abs(r.current) : r.current
              const displayPrevious =
                r.previous === null ? null : r.isDeduction ? -Math.abs(r.previous) : r.previous
              const label = t(ROW_LABEL_KEYS[r.id])
              const margin =
                r.marginPct !== null ? ` (${r.marginPct.toFixed(1)}%)` : ''
              return (
                <tr
                  key={r.id}
                  className={cn(
                    'border-b border-border-default/60',
                    (r.kind === 'subtotal' || r.kind === 'total') && 'bg-muted/20',
                  )}
                >
                  <td
                    className={cn(
                      'px-3 py-2 text-text-primary',
                      (r.kind === 'subtotal' || r.kind === 'total') && 'font-semibold',
                    )}
                  >
                    {r.isDeduction ? `(−) ${label}` : r.kind !== 'line' ? `= ${label}${margin}` : label}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right font-numeric tabular-nums',
                      r.isDeduction && 'text-text-secondary',
                      (r.kind === 'subtotal' || r.kind === 'total') && 'font-semibold',
                      r.id === 'ebitda' && r.current < 0 && 'text-red-600',
                    )}
                  >
                    {formatMoney(displayCurrent)}
                  </td>
                  <td className="px-3 py-2 text-right font-numeric tabular-nums text-text-secondary">
                    {displayPrevious === null ? '—' : formatMoney(displayPrevious)}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right font-numeric tabular-nums',
                      r.deltaAbs !== null && r.deltaAbs < 0 && 'text-red-600',
                      r.deltaAbs !== null && r.deltaAbs > 0 && 'text-emerald-700',
                    )}
                  >
                    {fmtDeltaMoney(r.deltaAbs, formatMoney)}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right font-numeric tabular-nums',
                      r.deltaPct !== null && r.deltaPct < 0 && 'text-red-600',
                      r.deltaPct !== null && r.deltaPct > 0 && 'text-emerald-700',
                    )}
                  >
                    {fmtPct(r.deltaPct)}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right font-numeric tabular-nums',
                      r.yoyDeltaPct !== null && r.yoyDeltaPct < 0 && 'text-red-600',
                      r.yoyDeltaPct !== null && r.yoyDeltaPct > 0 && 'text-emerald-700',
                    )}
                  >
                    {fmtPct(r.yoyDeltaPct)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </SectionContainer>
  )
}
