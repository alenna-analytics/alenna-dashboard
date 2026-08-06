import type { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { kpiValueToneClass } from '@/lib/kpi-value-tone'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

const NUM = 'font-numeric tabular-nums'

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
  const body = (
    <>
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        {helpText ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="shrink-0 rounded-full p-0.5 text-text-tertiary hover:text-text-secondary"
                aria-label={helpText}
                onClick={(event) => event.stopPropagation()}
              >
                <HelpCircle className="size-3.5" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] text-left text-xs leading-snug">
              {helpText}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <p
        className={cn(
          'text-lg font-semibold sm:text-xl',
          showValues
            ? kpiValueToneClass(numericValue, 'text-text-primary')
            : 'text-text-tertiary',
          NUM,
        )}
      >
        {isFetching ? skeleton : value}
      </p>
      {!isFetching && breakdown ? breakdown : null}
      <p
        className={cn(
          'mt-auto min-h-4 pt-1 text-[0.65rem] leading-tight text-text-tertiary',
          !footer && 'invisible',
        )}
        aria-hidden={!footer}
      >
        {footer ?? '\u00a0'}
      </p>
    </>
  )

  const className = cn(
    'flex h-full flex-col rounded-md border bg-muted/20 px-3 py-2.5 text-left transition-colors',
    selected ? 'border-border-subtle bg-muted/30' : 'border-border-subtle',
    selectable ? 'cursor-pointer hover:bg-muted/35' : '',
  )

  const style =
    selected && accentColor
      ? { borderTopWidth: 3, borderTopColor: accentColor, borderTopStyle: 'solid' as const }
      : undefined

  if (selectable && onSelect) {
    return (
      <button
        type="button"
        className={className}
        style={style}
        aria-pressed={selected}
        onClick={onSelect}
      >
        {body}
      </button>
    )
  }

  return (
    <div className={className} style={style}>
      {body}
    </div>
  )
}
