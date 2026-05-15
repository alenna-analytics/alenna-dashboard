import * as React from 'react'
import { Check, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/ui/command'
import { Popover, PopoverContent } from '@/ui/popover'
import { Button } from '@/ui/button'
import { FilterPillTriggerArea } from '@/ui/filters/filter-pill-trigger'
import type { FilterOption } from '@/ui/filters/types'
import { TruncatedOptionLabel } from '@/ui/filters/truncated-option-label'

export type FilterComboboxSingleProps = {
  label: string
  options: FilterOption[]
  value: string
  onValueChange: (value: string) => void
  applyLabel: string
  searchPlaceholder: string
  emptyLabel: string
  triggerClassName?: string
  clearAriaLabel?: string
  /**
   * When provided, opts the combobox into server-side search:
   * - The list bypasses cmdk's local filter (each item's `value=o.value`
   *   so cmdk treats the search as no-op) and renders the raw `options`.
   * - Caller debounces & refetches `options` whenever `query` changes.
   * Use for very large catalogs (e.g. tenants with >200 products).
   */
  onSearchChange?: (query: string) => void
  /** Optional loading state shown in place of empty when fetching. */
  loading?: boolean
  loadingLabel?: string
  /** When false, the pill cannot be cleared (required selection). */
  allowClear?: boolean
}

export function FilterComboboxSingle({
  label,
  options,
  value,
  onValueChange,
  applyLabel,
  searchPlaceholder,
  emptyLabel,
  triggerClassName,
  clearAriaLabel = 'Clear filter',
  onSearchChange,
  loading = false,
  loadingLabel,
  allowClear = true,
}: FilterComboboxSingleProps) {
  const [open, setOpen] = React.useState(false)
  const [draftValue, setDraftValue] = React.useState(value)
  const selected = options.find((o) => o.value === value)
  const summary = selected?.label ?? (value ? value : null)
  const active = Boolean(value && summary)

  const serverSide = typeof onSearchChange === 'function'

  React.useEffect(() => {
    if (!open) return
    setDraftValue(value)
  }, [open, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FilterPillTriggerArea
        active={active}
        label={label}
        valueSummary={summary}
        onClear={active && allowClear ? () => onValueChange('') : undefined}
        clearAriaLabel={clearAriaLabel}
        ariaExpanded={open}
        triggerClassName={triggerClassName}
      />
      <PopoverContent
        align="start"
        sideOffset={6}
        positionMethod="fixed"
        collisionPadding={12}
        collisionAvoidance={{ side: 'shift', align: 'none', fallbackAxisSide: 'none' }}
        className="w-[min(calc(100vw-24px),18rem)] border-border-subtle shadow-[var(--shadow-popover)] ring-1 ring-[color:var(--ring-popover)] p-0"
      >
        <Command shouldFilter={!serverSide}>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={onSearchChange}
          />
          <CommandList className="max-h-72 overflow-y-auto">
            <CommandEmpty>
              {loading ? (
                <span className="inline-flex items-center gap-2 text-text-secondary">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  <span>{loadingLabel || emptyLabel}</span>
                </span>
              ) : (
                emptyLabel
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={serverSide ? o.value : `${o.label} ${o.value}`}
                  onSelect={() => {
                    setDraftValue(o.value)
                  }}
                >
                  <span
                    className={cn(
                      'grid size-4 shrink-0 place-items-center rounded-[4px] border border-border-default',
                      draftValue === o.value
                        ? 'bg-secondary text-primary-foreground'
                        : 'bg-bg-default text-transparent',
                    )}
                    aria-hidden
                  >
                    <Check className="size-3" />
                  </span>
                  <TruncatedOptionLabel label={o.label} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="border-t border-border-default p-2">
            <Button
              type="button"
              variant="default"
              size="xs"
              className="w-full"
              onClick={() => {
                onValueChange(draftValue)
                setOpen(false)
              }}
            >
              {applyLabel}
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
