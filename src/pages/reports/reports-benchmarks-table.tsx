import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { BenchmarkBand, BenchmarkMetricId, BenchmarkRow } from '@/pages/reports/reports-benchmarks'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'

const METRIC_LABELS: Record<BenchmarkMetricId, ShellStringKey> = {
  gross_margin_pct: 'reportsKpiMargenBrutoPct',
  contribution_margin_pct: 'reportsKpiContributionMarginPctLabel',
  ads_to_net_pct: 'reportsBenchAdsToNet',
  ebitda_margin_pct: 'reportsKpiEbitdaMarginPct',
  tacos: 'reportsBenchTacos',
  roas: 'reportsBenchRoas',
  ltv_cac: 'reportsBenchLtvCac',
}

const BAND_LABELS: Record<BenchmarkBand, ShellStringKey> = {
  green: 'reportsBenchStatusGreen',
  yellow: 'reportsBenchStatusYellow',
  red: 'reportsBenchStatusRed',
  no_data: 'reportsBenchStatusNoData',
}

function bandClass(band: BenchmarkBand): string {
  switch (band) {
    case 'green':
      return 'bg-emerald-50 text-emerald-800'
    case 'yellow':
      return 'bg-amber-50 text-amber-900'
    case 'red':
      return 'bg-red-50 text-red-800'
    default:
      return 'bg-muted/30 text-text-secondary'
  }
}

type ReportsBenchmarksTableProps = {
  rows: BenchmarkRow[]
  t: (key: ShellStringKey) => string
}

export function ReportsBenchmarksTable({ rows, t }: ReportsBenchmarksTableProps) {
  return (
    <SectionContainer className="overflow-hidden">
      <SectionHeader
        title={t('reportsBenchmarksTitle')}
        description={t('reportsBenchmarksSubtitle')}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-default text-left text-text-secondary">
              <th className="px-3 py-2 font-medium">{t('reportsBenchColMetric')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('reportsBenchColValue')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('reportsBenchColGreen')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('reportsBenchColYellow')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('reportsBenchColRed')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('reportsBenchColStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border-default/60">
                <td className="px-3 py-2 text-text-primary">{t(METRIC_LABELS[r.id])}</td>
                <td className="px-3 py-2 text-right font-numeric tabular-nums">
                  {r.band === 'no_data' || r.value === null
                    ? t('reportsBenchStatusNoData')
                    : `${r.value.toFixed(1)}%`}
                </td>
                <td className="px-3 py-2 text-right text-text-secondary">{r.greenLabel}</td>
                <td className="px-3 py-2 text-right text-text-secondary">{r.yellowLabel}</td>
                <td className="px-3 py-2 text-right text-text-secondary">{r.redLabel}</td>
                <td className="px-3 py-2 text-right">
                  <span
                    className={cn(
                      'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                      bandClass(r.band),
                    )}
                  >
                    {t(BAND_LABELS[r.band])}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionContainer>
  )
}
