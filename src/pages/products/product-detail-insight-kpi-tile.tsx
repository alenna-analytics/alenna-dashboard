import type { ReactNode } from 'react'

import { KpiCard } from '@/ui/kpi-card'

type ProductDetailInsightKpiTileProps = {
  label: string
  helpText?: string
  value: ReactNode
  numericValue?: number | null
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
  return (
    <KpiCard
      className="h-full"
      label={label}
      helpText={helpText}
      value={isFetching ? skeleton : value}
      numericValue={showValues ? numericValue : null}
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
