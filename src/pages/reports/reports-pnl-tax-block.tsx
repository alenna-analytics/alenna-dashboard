import { Link } from 'react-router-dom'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { TaxesEstimated } from '@/lib/types/reports'
import { SectionSplit } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'

type ReportsPnlTaxBlockProps = {
  taxesEstimated: TaxesEstimated | null | undefined
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
}

function Line({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className={cn('text-sm text-text-secondary', emphasis && 'font-semibold text-text-primary')}>
        {label}
      </span>
      <span
        className={cn(
          'font-numeric tabular-nums text-sm text-text-primary',
          emphasis && 'font-semibold',
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function ReportsPnlTaxBlock({
  taxesEstimated,
  formatMoney,
  t,
}: ReportsPnlTaxBlockProps) {
  return (
    <SectionSplit
      title={t('reportsTaxBlockTitle')}
      description={t('reportsTaxBlockSubtitle')}
    >
      <div className="rounded-md border border-border-subtle px-4 py-3">
        {taxesEstimated == null ? (
          <div className="space-y-2 text-sm text-text-secondary">
            <p>{t('reportsTaxBlockUnset')}</p>
            <Link
              to="/dashboard/configuration/tax-rates"
              className="font-medium text-text-primary underline-offset-2 hover:underline"
            >
              {t('reportsTaxBlockConfigLink')}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            <Line
              label={t('reportsTaxBlockWithholdingIsr')}
              value={formatMoney(-Math.abs(taxesEstimated.withholding_isr))}
            />
            <Line
              label={t('reportsTaxBlockWithholdingIva')}
              value={formatMoney(-Math.abs(taxesEstimated.withholding_iva))}
            />
            <Line
              label={t('reportsTaxBlockWithholdingTotal')}
              value={formatMoney(-Math.abs(taxesEstimated.withholding_total))}
              emphasis
            />
            <p className="py-2 text-xs text-text-secondary">{t('reportsTaxBlockInformationalNote')}</p>
            <Line
              label={`= ${t('reportsTaxBlockExpectedNetCash')}`}
              value={formatMoney(taxesEstimated.expected_net_cash)}
              emphasis
            />
          </div>
        )}
      </div>
    </SectionSplit>
  )
}
