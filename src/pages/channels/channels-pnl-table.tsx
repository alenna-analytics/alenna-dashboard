import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import {
  type ChannelPlatform,
  grossMarginPct,
  type PlatformMetrics,
} from '@/pages/channels/channels-platform-aggregate'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'

type PnlLineId =
  | 'gross_revenue'
  | 'discounts'
  | 'returns'
  | 'net_revenue'
  | 'cogs'
  | 'gross_profit'
  | 'platform_fees'
  | 'merchant_shipping'
  | 'ads_spend'
  | 'contribution_margin'

type PnlLine = {
  id: PnlLineId
  labelKey: ShellStringKey
  kind: 'line' | 'subtotal' | 'total'
  isDeduction?: boolean
  isNoData?: boolean
  value: (m: PlatformMetrics) => number
  marginPct?: (m: PlatformMetrics) => number | null
}

const LINES: PnlLine[] = [
  {
    id: 'gross_revenue',
    labelKey: 'reportsWfGrossRevenue',
    kind: 'line',
    value: (m) => m.gross_revenue,
  },
  {
    id: 'discounts',
    labelKey: 'reportsWfDiscounts',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.discounts,
  },
  {
    id: 'returns',
    labelKey: 'reportsWfReturns',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.returns,
  },
  {
    id: 'net_revenue',
    labelKey: 'reportsWfNetRevenue',
    kind: 'subtotal',
    value: (m) => m.net_revenue,
  },
  {
    id: 'cogs',
    labelKey: 'reportsWfCogs',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.cogs,
  },
  {
    id: 'gross_profit',
    labelKey: 'reportsWfGrossProfit',
    kind: 'subtotal',
    value: (m) => m.gross_profit,
    marginPct: (m) => grossMarginPct(m),
  },
  {
    id: 'platform_fees',
    labelKey: 'reportsKpiPlatformFees',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.platform_fees_total,
  },
  {
    id: 'merchant_shipping',
    labelKey: 'reportsKpiFulfillmentCost',
    kind: 'line',
    isDeduction: true,
    value: (m) => m.merchant_shipping_cost,
  },
  {
    id: 'ads_spend',
    labelKey: 'reportsWfAdsSpend',
    kind: 'line',
    isDeduction: true,
    isNoData: true,
    value: () => 0,
  },
  {
    id: 'contribution_margin',
    labelKey: 'reportsWfContributionMargin',
    kind: 'total',
    value: (m) => m.contribution_margin,
    marginPct: (m) => m.contribution_margin_pct,
  },
]

type ChannelsPnlTableProps = {
  metrics: Record<string, PlatformMetrics>
  platforms: ChannelPlatform[]
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
}

export function ChannelsPnlTable({
  metrics,
  platforms,
  formatMoney,
  t,
}: ChannelsPnlTableProps) {
  const cols = [
    ...platforms,
    { slug: 'total', label: t('channelsColTotal') },
  ]

  return (
    <SectionContainer>
      <SectionHeader
        title={t('channelsPnlTitle')}
        description={t('channelsPnlSubtitle')}
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
            {LINES.map((line) => (
              <tr
                key={line.id}
                className={cn(
                  'border-b border-border-default/60',
                  (line.kind === 'subtotal' || line.kind === 'total') && 'bg-muted/20',
                )}
              >
                <td
                  className={cn(
                    'px-3 py-2 text-text-primary',
                    (line.kind === 'subtotal' || line.kind === 'total') && 'font-semibold',
                  )}
                >
                  {line.isDeduction
                    ? `(−) ${t(line.labelKey)}`
                    : line.kind !== 'line'
                      ? `= ${t(line.labelKey)}`
                      : t(line.labelKey)}
                </td>
                {cols.map((col) => {
                  const m = metrics[col.slug]
                  if (line.isNoData) {
                    return (
                      <td
                        key={col.slug}
                        className="px-3 py-2 text-right text-text-secondary"
                      >
                        {t('channelsNoData')}
                      </td>
                    )
                  }
                  const raw = line.value(m)
                  const display = line.isDeduction ? -Math.abs(raw) : raw
                  const margin = line.marginPct?.(m)
                  return (
                    <td
                      key={col.slug}
                      className={cn(
                        'px-3 py-2 text-right font-numeric tabular-nums',
                        line.isDeduction && 'text-text-secondary',
                        (line.kind === 'subtotal' || line.kind === 'total') &&
                          'font-semibold text-text-primary',
                      )}
                    >
                      {formatMoney(display)}
                      {margin !== null && margin !== undefined
                        ? ` (${margin.toFixed(1)}%)`
                        : ''}
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
