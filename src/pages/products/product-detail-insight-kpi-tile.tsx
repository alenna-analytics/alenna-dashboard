import type { ReactNode } from 'react'

import { KpiCard } from '@/ui/kpi-card'

type ProductDetailInsightKpiTileProps = {
  label: string
  helpText?: string
  helpFormulaLeft?: string
  helpFormulaParts?: readonly string[]
  helpFormulaJoiner?: string
  value: ReactNode
  numericValue?: number | null
  currencyCode?: string
  /** Margin / rate shown beside the value (home-style delta indicator). */
  ratePct?: number | null
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
      pct={hasRate ? ratePct : null}
      trend="flat"
      comparisonUnavailable={!hasRate}
      deltaBesideValue={hasRate}
      showComparison={false}
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
