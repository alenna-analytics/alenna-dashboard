import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import {
  settingsDescriptionClassName,
  SettingsSectionHeader,
} from '@/pages/configuration/settings-layout'
import { InfoTooltip } from '@/ui/info-tooltip'
import { KpiCard as KpiCardUi } from '@/ui/kpi-card'
import { surfaceSectionClassName } from '@/ui/surface'
import { useMoney } from '@/hooks/use-money'

import { pctVersusPrevious } from './reports-ui-helpers'

export function SectionContainer({
  children,
  className,
  framed = false,
}: {
  children: ReactNode
  className?: string
  framed?: boolean
}) {
  return (
    <section className={cn('space-y-4', framed && surfaceSectionClassName, className)}>
      {children}
    </section>
  )
}

/** Billing-style: title + description left, content right. */
export function SectionSplit({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'grid gap-4 sm:grid-cols-[3fr_7fr] sm:items-start sm:gap-10',
        className,
      )}
    >
      <div className="min-w-0">
        <SettingsSectionHeader title={title} description={description} />
      </div>
      <div className="min-w-0">{children}</div>
    </section>
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
    <SettingsSectionHeader
      title={title}
      description={description}
      aside={aside}
      className={cn('mb-4', className)}
    />
  )
}

export function ChartSectionHeader({
  title,
  info,
  aside,
  className,
}: {
  title: string
  info?: string
  aside?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 className="text-sm font-bold text-text-tertiary">{title}</h2>
          {info ? (
            <InfoTooltip side="bottom">{info}</InfoTooltip>
          ) : null}
        </div>
        {aside ? <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">{aside}</div> : null}
      </div>
    </div>
  )
}

export function InsightText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'mb-4 max-w-2xl',
        settingsDescriptionClassName,
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
  const { formatKpi } = useMoney()
  const computedDisplay =
    format === 'currency'
      ? formatKpi(value, { nativeCurrency: currency })
      : format === 'percent'
        ? `${value.toFixed(1)}%`
        : value.toLocaleString()

  const display = displayValue ?? computedDisplay

  const priorUnavailable = !previousReady || previous === undefined
  const priorDisplay =
    priorUnavailable || previous === undefined
      ? null
      : format === 'currency'
        ? formatKpi(previous, { nativeCurrency: currency })
        : format === 'percent'
          ? `${previous.toFixed(1)}%`
          : previous.toLocaleString()

  const delta = previous !== undefined && previousReady ? pctVersusPrevious(value, previous) : null

  const mergedHelp =
    showVsPrior && priorUnavailable && comparisonUnavailable.trim() !== ''
      ? `${helpText}\n\n${comparisonUnavailable}`
      : helpText

  return (
    <KpiCardUi
      label={label}
      helpText={mergedHelp}
      variant={variant === 'hero' ? 'featured' : 'default'}
      value={display}
      numericValue={value}
      currencyCode={format === 'currency' ? currency : undefined}
      vsPriorLabel={vsPriorLabel}
      priorValueDisplay={priorDisplay}
      pct={delta?.pct ?? null}
      trend={delta?.trend ?? 'flat'}
      comparisonUnavailable={showVsPrior && priorUnavailable}
      negativeMetric={negative}
      showComparison={showVsPrior}
      footer={footer}
      className={className}
    />
  )
}
