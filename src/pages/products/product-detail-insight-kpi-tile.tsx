import type { ReactNode } from 'react'

import { KpiCard } from '@/ui/kpi-card'

type PctTrend = 'up' | 'down' | 'flat'

type ProductDetailInsightKpiTileProps = {
  label: string
  helpText?: string
  helpFormulaLeft?: string
  helpFormulaParts?: readonly string[]
  helpFormulaJoiner?: string
  value: ReactNode
  numericValue?: number | null
  currencyCode?: string
  /** Margin / rate shown under the value (home-style addon). */
  ratePct?: number | null
  /** Growth vs previous period (home-style delta beside value). */
  growthPct?: number | null
  growthTrend?: PctTrend
  growthUnavailable?: boolean
  growthTooltip?: string
  breakdown?: ReactNode
  footer?: ReactNode
  showValues: boolean
  isFetching: boolean
  skeleton: ReactNode
  selectable?: boolean
  selected?: boolean
  accentColor?: string
  onSelect?: () => void
}

export function ProductDetailInsightKpiTile({
  label,
  helpText,
  helpFormulaLeft,
  helpFormulaParts,
  helpFormulaJoiner,
  value,
  numericValue,
  currencyCode,
  ratePct,
  growthPct = null,
  growthTrend = 'flat',
  growthUnavailable = true,
  growthTooltip,
  breakdown,
  footer,
  showValues,
  isFetching,
  skeleton,
  selectable = false,
  selected = false,
  accentColor,
  onSelect,
}: ProductDetailInsightKpiTileProps) {
  const hasRate =
    showValues && !isFetching && ratePct != null && Number.isFinite(ratePct)
  const showGrowth = showValues && !isFetching

  return (
    <KpiCard
      className="h-full"
      label={label}
      helpText={helpText}
      helpFormulaLeft={helpFormulaLeft}
      helpFormulaParts={helpFormulaParts}
      helpFormulaJoiner={helpFormulaJoiner}
      value={isFetching ? skeleton : value}
      numericValue={showValues ? numericValue : null}
      currencyCode={showValues && !isFetching ? currencyCode : undefined}
      pct={showGrowth ? growthPct : null}
      trend={showGrowth ? growthTrend : 'flat'}
      comparisonUnavailable={!showGrowth || growthUnavailable}
      deltaBesideValue={showGrowth}
      deltaTooltip={growthTooltip}
      showComparison={false}
      valueAddon={
        hasRate && ratePct != null ? (
          <span className="font-numeric text-[11px] tabular-nums text-text-secondary">
            {ratePct.toFixed(1)}%
          </span>
        ) : null
      }
      placeholder={!showValues && !isFetching}
      footer={
        <>
          {!isFetching && breakdown ? breakdown : null}
          {footer}
        </>
      }
      selectable={selectable}
      selected={selected}
      accentColor={accentColor}
      onSelect={onSelect}
    />
  )
}
