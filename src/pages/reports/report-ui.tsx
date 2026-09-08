import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import {
  settingsDescriptionClassName,
  SettingsSectionHeader,
} from '@/pages/configuration/settings-layout'
import { MetricCalcTooltipBody } from '@/ui/chart-tooltip'
import { InfoTooltip } from '@/ui/info-tooltip'
import { KpiCard as KpiCardUi } from '@/ui/kpi-card'
import { surfaceSectionClassName } from '@/ui/surface'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'
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
  titleHref,
  onTitleClick,
  calcDescription,
  calcFormulaLeft,
  calcFormulaParts,
  calcFormulaJoiner,
  aside,
  className,
}: {
  title: string
  /** Legacy short help on the info icon (kept when no calc formula). */
  info?: string
  /** Navigate on title click (module shortcut). */
  titleHref?: string
  onTitleClick?: () => void
  /** Img-2 style: description under the title in the hover tooltip. */
  calcDescription?: string
  /** Img-2 style: left side of formula, e.g. "Ventas netas = ". */
  calcFormulaLeft?: string
  /** Img-2 style: green formula terms joined by +. */
  calcFormulaParts?: readonly string[]
  /** Joiner between green terms (default +). Use " · " for selected series lists. */
  calcFormulaJoiner?: string
  aside?: ReactNode
  className?: string
}) {
  const showCalcTooltip = Boolean(
    calcDescription || (calcFormulaLeft && calcFormulaParts && calcFormulaParts.length > 0),
  )
  const interactive = Boolean(titleHref || onTitleClick)
  const titleClassName = cn(
    'text-sm font-bold text-text-tertiary',
    (interactive || showCalcTooltip) &&
      'cursor-pointer underline decoration-dotted decoration-text-tertiary/70 underline-offset-4 transition-colors hover:text-text-secondary',
  )

  const titled = showCalcTooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>
        {titleHref ? (
          <Link to={titleHref} className={titleClassName} onClick={onTitleClick}>
            {title}
          </Link>
        ) : onTitleClick ? (
          <button type="button" className={titleClassName} onClick={onTitleClick}>
            {title}
          </button>
        ) : (
          <button type="button" className={titleClassName}>
            {title}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="start"
        sideOffset={12}
        collisionPadding={24}
        avoidCollisions
        className="max-w-[22rem] text-left"
      >
        <MetricCalcTooltipBody
          title={title}
          description={calcDescription}
          formulaLeft={calcFormulaLeft}
          formulaParts={calcFormulaParts}
          formulaJoiner={calcFormulaJoiner}
        />
      </TooltipContent>
    </Tooltip>
  ) : titleHref ? (
    <Link to={titleHref} className={titleClassName} onClick={onTitleClick}>
      {title}
    </Link>
  ) : onTitleClick ? (
    <button type="button" className={titleClassName} onClick={onTitleClick}>
      {title}
    </button>
  ) : (
    <h2 className={titleClassName}>{title}</h2>
  )

  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          {titled}
          {!showCalcTooltip && info ? (
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
  helpFormulaLeft,
  helpFormulaParts,
  helpFormulaJoiner,
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
  helpFormulaLeft?: string
  helpFormulaParts?: readonly string[]
  helpFormulaJoiner?: string
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
      helpFormulaLeft={helpFormulaLeft}
      helpFormulaParts={helpFormulaParts}
      helpFormulaJoiner={helpFormulaJoiner}
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
