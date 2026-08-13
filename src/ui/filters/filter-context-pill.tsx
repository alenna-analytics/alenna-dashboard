import { Check, ChevronDown, CircleX, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'

export type FilterContextOption = {
  value: string
  label: string
  leading?: ReactNode
}

export type FilterContextPillProps = {
  label: string
  triggerIcon: LucideIcon
  value: string
  /** When value matches, pill uses the inactive style unless `alwaysShowValue`. */
  defaultValue?: string
  /** Always show "label: value" tint (e.g. required single-select). */
  alwaysShowValue?: boolean
  /** When active, show only the selected value (no category prefix or clear button). */
  valueOnlyWhenActive?: boolean
  options: FilterContextOption[]
  onValueChange: (value: string) => void
  onClear?: () => void
  clearAriaLabel?: string
  popoverAlign?: 'start' | 'center' | 'end'
}

const contextPillTypographyClassName =
  'text-xs font-medium leading-none font-[family-name:var(--font-display)]'

function FilterContextMenuItem({
  option,
  selected,
  onSelect,
}: {
  option: FilterContextOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground',
        'transition-colors hover:bg-muted/60',
        'focus-visible:bg-muted/60 focus-visible:outline-none',
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">{option.leading}</span>
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {selected ? (
        <Check className="size-4 shrink-0 text-foreground" aria-hidden />
      ) : (
        <span className="size-4 shrink-0" aria-hidden />
      )}
    </button>
  )
}

export function FilterContextPill({
  label,
  triggerIcon: TriggerIcon,
  value,
  defaultValue = '',
  alwaysShowValue = false,
  valueOnlyWhenActive = false,
  options,
  onValueChange,
  onClear,
  clearAriaLabel = 'Clear filter',
  popoverAlign = 'start',
}: FilterContextPillProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)
  const isActive = alwaysShowValue || (defaultValue !== '' ? value !== defaultValue : Boolean(value))
  const showClear = !valueOnlyWhenActive && isActive && Boolean(onClear)
  const valueLabel = selected?.label ?? value

  const handleSelect = (nextValue: string) => {
    onValueChange(nextValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'inline-flex max-w-full shrink-0 items-stretch overflow-hidden rounded-md',
          isActive
            ? 'bg-[color-mix(in_srgb,var(--firefly-base)_8%,white)] text-[var(--firefly-base)]'
            : 'border border-dotted border-[color:var(--filter-pill-border)] bg-white text-text-primary',
        )}
      >
        {showClear ? (
          <button
            type="button"
            className={cn(
              'flex shrink-0 items-center justify-center px-2 transition-colors',
              'text-[var(--firefly-base)]/70 hover:bg-[color-mix(in_srgb,var(--firefly-base)_12%,white)] hover:text-[var(--firefly-base)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
            )}
            aria-label={clearAriaLabel}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onClear?.()
            }}
          >
            <CircleX className="size-3.5" aria-hidden />
          </button>
        ) : null}
        <PopoverTrigger
          type="button"
          aria-expanded={open}
          aria-label={
            isActive && valueOnlyWhenActive ? `${label}: ${valueLabel}` : undefined
          }
          className={cn(
            'inline-flex h-7 min-w-0 items-center gap-1.5 px-2.5 transition-colors',
            contextPillTypographyClassName,
            isActive
              ? 'hover:bg-[color-mix(in_srgb,var(--firefly-base)_12%,white)]'
              : 'hover:border-[color:var(--filter-pill-border-hover)] hover:bg-muted/40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
          )}
        >
          <TriggerIcon
            className={cn(
              'size-3.5 shrink-0',
              isActive ? 'text-[var(--firefly-base)]' : 'text-text-secondary',
            )}
            aria-hidden
          />
          {isActive ? (
            valueOnlyWhenActive ? (
              <span className="max-w-[10rem] truncate font-medium">{valueLabel}</span>
            ) : (
              <>
                <span className="max-w-[min(40%,7rem)] shrink truncate">{label}</span>
                <span className="text-[var(--firefly-base)]/50" aria-hidden>
                  :
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{valueLabel}</span>
              </>
            )
          ) : (
            <span className="max-w-[10rem] truncate">{label}</span>
          )}
          <ChevronDown
            className={cn(
              'size-3.5 shrink-0',
              isActive ? 'text-[var(--firefly-base)]/70' : 'text-text-tertiary',
            )}
            aria-hidden
          />
        </PopoverTrigger>
      </div>
      <PopoverContent
        align={popoverAlign}
        sideOffset={6}
        className="w-[min(calc(100vw-24px),14rem)] border-border-subtle bg-white p-1 shadow-[var(--shadow-popover)] ring-1 ring-[color:var(--ring-popover)]"
      >
        <p className="px-3 pt-1.5 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <div role="menu" aria-label={label}>
          {options.map((option) => (
            <FilterContextMenuItem
              key={option.value}
              option={option}
              selected={option.value === value}
              onSelect={() => handleSelect(option.value)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
