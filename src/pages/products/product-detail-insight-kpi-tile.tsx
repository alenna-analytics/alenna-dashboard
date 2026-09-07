import type { ReactNode } from 'react'

import { Badge } from '@/ui/badge'
import { KpiCard } from '@/ui/kpi-card'

type ProductDetailInsightKpiTileProps = {
  label: string
  helpText?: string
  value: ReactNode
  numericValue?: number | null
  currencyCode?: string
  /** Margin / rate shown as a pill under the value (home-style badge). */
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
  const rateBadge =
    showValues && !isFetching && ratePct != null && Number.isFinite(ratePct) ? (
      <Badge variant="secondary" className="font-numeric font-medium tabular-nums">
        {ratePct.toFixed(1)}%
      </Badge>
    ) : null

  return (
    <KpiCard
      className="h-full"
      label={label}
      helpText={helpText}
      value={isFetching ? skeleton : value}
      numericValue={showValues ? numericValue : null}
      currencyCode={showValues && !isFetching ? currencyCode : undefined}
      valueAddon={rateBadge}
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
