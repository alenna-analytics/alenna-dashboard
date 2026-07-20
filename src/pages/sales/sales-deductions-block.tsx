import type { ShellStringKey } from '@/lib/i18n/shell-strings'

import { useMoney } from '@/hooks/use-money'
import { SectionContainer, SectionHeader } from '@/pages/reports/report-ui'
import { cn } from '@/lib/utils'

type SalesDeductionsBlockProps = {
  grossRevenue: number
  discounts: number
  returns: number
  netRevenue: number
  currency: string
  t: (k: ShellStringKey) => string
}

type Step = {
  key: string
  label: string
  value: number
  tone: 'gross' | 'deduction' | 'net'
}

export function SalesDeductionsBlock({
  grossRevenue,
  discounts,
  returns,
  netRevenue,
  currency,
  t,
}: SalesDeductionsBlockProps) {
  const { format: formatMoney } = useMoney()
  const fmt = (v: number) => formatMoney(v, { nativeCurrency: currency })
  const deductions = discounts + returns

  const steps: Step[] = [
    {
      key: 'gross',
      label: t('salesDeductionsGross'),
      value: grossRevenue,
      tone: 'gross',
    },
    {
      key: 'deductions',
      label: t('salesDeductionsDiscountsReturns'),
      value: -deductions,
      tone: 'deduction',
    },
    {
      key: 'net',
      label: t('salesDeductionsNet'),
      value: netRevenue,
      tone: 'net',
    },
  ]

  return (
    <SectionContainer>
      <SectionHeader title={t('salesDeductionsTitle')} />
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li
            key={step.key}
            className={cn(
              'rounded-md border border-border-subtle px-4 py-3',
              step.tone === 'net' && 'bg-muted/30',
            )}
          >
            <div className="mb-1 flex items-center gap-2 text-xs text-text-secondary">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-text-primary">
                {i + 1}
              </span>
              <span>{step.label}</span>
            </div>
            <p
              className={cn(
                'font-numeric text-lg font-semibold tabular-nums',
                step.tone === 'deduction' ? 'text-destructive' : 'text-text-primary',
              )}
            >
              {fmt(step.value)}
            </p>
            {step.key === 'deductions' ? (
              <p className="mt-1 text-xs text-text-tertiary">
                {t('reportsWfDiscounts')}: {fmt(-discounts)} · {t('reportsWfReturns')}:{' '}
                {fmt(-returns)}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </SectionContainer>
  )
}
