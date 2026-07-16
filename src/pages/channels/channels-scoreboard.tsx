import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  type ChannelPlatform,
  type ScoreboardMetricId,
  type ScoreboardRow,
} from '@/pages/channels/channels-platform-aggregate'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'

const METRIC_LABELS: Record<ScoreboardMetricId, ShellStringKey> = {
  gross_revenue: 'reportsWfGrossRevenue',
  discounts: 'reportsWfDiscounts',
  returns: 'reportsWfReturns',
  net_revenue: 'reportsWfNetRevenue',
  order_count: 'channelsMetricOrders',
  aov: 'channelsMetricAov',
  contribution_margin: 'reportsWfContributionMargin',
  contribution_margin_pct: 'channelsMetricCmPct',
}

type ChannelsScoreboardProps = {
  rows: ScoreboardRow[]
  platforms: ChannelPlatform[]
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
}

function fmtPctDelta(n: number | null): string {
  if (n === null) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function formatMetric(
  id: ScoreboardMetricId,
  value: number,
  formatMoney: (v: number) => string,
): string {
  if (id === 'order_count') return String(Math.round(value))
  if (id === 'contribution_margin_pct') return `${value.toFixed(1)}%`
  return formatMoney(value)
}

export function ChannelsScoreboard({
  rows,
  platforms,
  formatMoney,
  t,
}: ChannelsScoreboardProps) {
  const cols = [
    ...platforms,
    { slug: 'total', label: t('channelsColTotal') },
  ]

  return (
    <SectionContainer>
      <SectionHeader
        title={t('channelsScoreboardTitle')}
        description={t('channelsScoreboardSubtitle')}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-default text-left text-text-secondary">
              <th className="px-3 py-2 font-medium">{t('reportsPnlColConcept')}</th>
              {cols.map((col) => (
                <th key={col.slug} className="px-3 py-2 text-right font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border-default/60">
                <td className="px-3 py-2 text-text-primary">{t(METRIC_LABELS[row.id])}</td>
                {cols.map((col) => {
                  const cell = row.cells[col.slug]
                  return (
                    <td
                      key={col.slug}
                      className="px-3 py-2 text-right font-numeric tabular-nums text-text-primary"
                    >
                      <div>{formatMetric(row.id, cell.value, formatMoney)}</div>
                      <div
                        className={cn(
                          'text-xs',
                          cell.deltaPct !== null && cell.deltaPct < 0 && 'text-red-600',
                          cell.deltaPct !== null && cell.deltaPct > 0 && 'text-emerald-700',
                          (cell.deltaPct === null || cell.deltaPct === 0) &&
                            'text-text-secondary',
                        )}
                      >
                        {fmtPctDelta(cell.deltaPct)}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionContainer>
  )
}
