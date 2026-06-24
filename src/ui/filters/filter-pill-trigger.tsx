import { ChevronDown, CircleX } from 'lucide-react'

import { cn } from '@/lib/utils'
import { PopoverTrigger } from '@/ui/popover'
import {
  filterPillActiveShellClassName,
  filterPillActiveTriggerClassName,
  filterPillClearButtonClassName,
  filterPillInactiveClassName,
  filterPillValueActiveClassName,
} from '@/ui/filters/filter-pill-classes'

export type FilterPillTriggerProps = {
  label: string
  summary?: string | null
  className?: string
}

/** Legacy dashed pill — icon-free, label only. */
export function FilterPillTrigger({ label, summary, className }: FilterPillTriggerProps) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5', className)}>
      <span className="max-w-[12rem] truncate text-accent">{label}</span>
      {summary ? (
        <span className="max-w-[10rem] truncate text-xs font-normal text-text-secondary">{summary}</span>
      ) : null}
    </span>
  )
}

function FilterPillActiveContents({ label, valueSummary }: { label: string; valueSummary: string }) {
  return (
    <>
      {label.trim().length > 0 ? (
        <>
          <span className="max-w-[min(40%,9rem)] shrink truncate text-text-primary">{label}</span>
          <span className="h-3 w-px shrink-0 bg-border-default" aria-hidden />
        </>
      ) : null}
      <span className={filterPillValueActiveClassName()}>{valueSummary}</span>
      <ChevronDown className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
    </>
  )
}

export type FilterPillTriggerAreaProps = {
  active: boolean
  label: string
  valueSummary: string | null
  onClear?: () => void
  clearAriaLabel: string
  triggerClassName?: string
  ariaExpanded: boolean
}

/**
 * Inactive: label only. Active: optional clear | label · value · chevron; shorter height.
 * Place inside `<Popover>` before `<PopoverContent />`.
 */
export function FilterPillTriggerArea({
  active,
  label,
  valueSummary,
  onClear,
  clearAriaLabel,
  triggerClassName,
  ariaExpanded,
}: FilterPillTriggerAreaProps) {
  if (!active) {
    return (
      <PopoverTrigger
        type="button"
        className={cn(filterPillInactiveClassName(), triggerClassName)}
        aria-expanded={ariaExpanded}
      >
        <span className="max-w-[12rem] truncate">{label}</span>
      </PopoverTrigger>
    )
  }

  const summaryText = valueSummary ?? ''

  if (!onClear) {
    return (
      <PopoverTrigger
        type="button"
        className={cn(
          filterPillActiveShellClassName(),
          'inline-flex min-w-0 items-center gap-1.5 px-2',
          triggerClassName,
        )}
        aria-expanded={ariaExpanded}
      >
        <FilterPillActiveContents label={label} valueSummary={summaryText} />
      </PopoverTrigger>
    )
  }

  return (
    <div className={cn(filterPillActiveShellClassName(), triggerClassName)}>
      <button
        type="button"
        className={filterPillClearButtonClassName()}
        aria-label={clearAriaLabel}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onClear()
        }}
      >
        <CircleX className="size-3.5" aria-hidden />
      </button>
      <PopoverTrigger
        type="button"
        className={filterPillActiveTriggerClassName()}
        aria-expanded={ariaExpanded}
      >
        <FilterPillActiveContents label={label} valueSummary={summaryText} />
      </PopoverTrigger>
    </div>
  )
}
