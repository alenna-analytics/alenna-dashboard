import * as React from 'react'
import { Check } from 'lucide-react'

import { LoadingIcon } from '@/ui/app-icon'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/ui/command'
import { Popover, PopoverContent } from '@/ui/popover'
import { FilterPillTriggerArea } from '@/ui/filters/filter-pill-trigger'
import type { FilterOption } from '@/ui/filters/types'
import { TruncatedOptionLabel } from '@/ui/filters/truncated-option-label'

export type FilterComboboxSelectionMode = 'single' | 'multi'

const filterComboboxPanelClassName =
  'w-[min(calc(100vw-24px),18rem)] border-border-subtle bg-white shadow-[var(--shadow-popover)] ring-1 ring-[color:var(--ring-popover)] p-0 backdrop-blur-none'

export type FilterComboboxSingleProps = {
  label: string
  options: FilterOption[]
  value: string
  onValueChange: (value: string) => void
  searchPlaceholder: string
  emptyLabel: string
  /** Single-select closes on pick; multi-select toggles checkboxes (use FilterComboboxMulti for full multi UX). */
  selectionMode?: Extract<FilterComboboxSelectionMode, 'single'>
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
  popoverAlign?: 'start' | 'center' | 'end'
  popoverSide?: 'top' | 'bottom' | 'left' | 'right'
}

export function FilterComboboxSingle({
  label,
  options,
  value,
  onValueChange,
  searchPlaceholder,
  emptyLabel,
  triggerClassName,
  clearAriaLabel = 'Clear filter',
  onSearchChange,
  loading = false,
  loadingLabel,
  allowClear = true,
  popoverAlign = 'start',
  popoverSide = 'bottom',
}: FilterComboboxSingleProps) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o) => o.value === value)
  const summary = selected?.label ?? (value ? value : null)
  const active = Boolean(value && summary)

  const serverSide = typeof onSearchChange === 'function'

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
        align={popoverAlign}
        side={popoverSide}
        sideOffset={6}
        positionMethod="fixed"
        collisionPadding={12}
        collisionAvoidance={{ side: 'shift', align: 'shift', fallbackAxisSide: 'end' }}
        className={filterComboboxPanelClassName}
      >
        <Command shouldFilter={!serverSide} className="bg-white">
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={onSearchChange}
          />
          <CommandList className="max-h-72 overflow-y-auto bg-white">
            <CommandEmpty>
              {loading ? (
                <span className="inline-flex items-center gap-2 text-text-secondary">
                  <LoadingIcon className="size-4" />
                  <span>{loadingLabel || emptyLabel}</span>
                </span>
              ) : (
                emptyLabel
              )}
            </CommandEmpty>
            <CommandGroup className="bg-white">
              {options.map((o) => {
                const isSelected = value === o.value
                return (
                  <CommandItem
                    key={o.value}
                    value={serverSide ? o.value : `${o.label} ${o.value}`}
                    onSelect={() => {
                      onValueChange(o.value)
                      setOpen(false)
                    }}
                    className="justify-between gap-2"
                  >
                    <TruncatedOptionLabel label={o.label} />
                    {isSelected ? (
                      <Check className="size-4 shrink-0 text-secondary" aria-hidden />
                    ) : (
                      <span className="size-4 shrink-0" aria-hidden />
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
