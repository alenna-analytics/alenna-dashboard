import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { KpiCard as KpiCardUi } from '@/ui/kpi-card'
import { useMoney } from '@/hooks/use-money'

import { pctVersusPrevious } from './reports-ui-helpers'

export function SectionContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-[var(--color-border)] bg-[var(--color-bg-section)] p-6 shadow-[var(--shadow-ink-sm)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionHeader({
  title,
  description,
  className,
  aside,
}: {
  title: string
  description?: string
  className?: string
  aside?: ReactNode
}) {
  return (
    <div className={cn('mb-4 space-y-1', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
          {title}
        </h2>
        {aside}
      </div>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">{description}</p>
      ) : null}
    </div>
  )
}

export function InsightText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'mb-4 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]',
        className,
      )}
    >
      {children}
    </p>
  )
}

type KpiVariant = 'hero' | 'default'

export function KpiCard({
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
  variant = 'default',
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
  variant?: KpiVariant
}) {
  const { format: formatMoney } = useMoney()
  const computedDisplay =
    format === 'currency'
      ? formatMoney(value, { nativeCurrency: currency })
      : format === 'percent'
        ? `${value.toFixed(1)}%`
        : value.toLocaleString()

  const display = displayValue ?? computedDisplay

  const priorUnavailable = !previousReady || previous === undefined
  const priorDisplay =
    priorUnavailable || previous === undefined
      ? null
      : format === 'currency'
        ? formatMoney(previous, { nativeCurrency: currency })
        : format === 'percent'
          ? `${previous.toFixed(1)}%`
          : previous.toLocaleString()

  const delta = previous !== undefined && previousReady ? pctVersusPrevious(value, previous) : null

  const mergedHelp =
    priorUnavailable && comparisonUnavailable.trim() !== ''
      ? `${helpText}\n\n${comparisonUnavailable}`
      : helpText

  return (
    <KpiCardUi
      label={label}
      helpText={mergedHelp}
      variant={variant === 'hero' ? 'featured' : 'default'}
      value={display}
      vsPriorLabel={vsPriorLabel}
      priorValueDisplay={priorDisplay}
      pct={delta?.pct ?? null}
      trend={delta?.trend ?? 'flat'}
      comparisonUnavailable={priorUnavailable}
      negativeMetric={negative}
      showComparison={showVsPrior}
      footer={footer}
      className={className}
    />
  )
}
