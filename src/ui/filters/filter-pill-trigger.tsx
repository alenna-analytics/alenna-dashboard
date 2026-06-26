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
 * PopoverTrigger keeps a stable parent wrapper so the popover anchor does not jump
 * when the pill switches from inactive to active while open.
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
  const summaryText = valueSummary ?? ''
  const showClear = active && Boolean(onClear)

  return (
    <div
      className={cn(
        'inline-flex max-w-full shrink-0 items-stretch',
        active && filterPillActiveShellClassName(),
        triggerClassName,
      )}
    >
      {showClear ? (
        <button
          type="button"
          className={filterPillClearButtonClassName()}
          aria-label={clearAriaLabel}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClear?.()
          }}
        >
          <CircleX className="size-3.5" aria-hidden />
        </button>
      ) : null}
      <PopoverTrigger
        type="button"
        className={cn(
          active ? filterPillActiveTriggerClassName() : filterPillInactiveClassName(),
        )}
        aria-expanded={ariaExpanded}
      >
        {active ? (
          <FilterPillActiveContents label={label} valueSummary={summaryText} />
        ) : (
          <span className="max-w-[12rem] truncate">{label}</span>
        )}
      </PopoverTrigger>
    </div>
  )
}
