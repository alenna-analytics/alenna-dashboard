import * as React from 'react'
import { Check } from 'lucide-react'

import { LoadingIcon } from '@/ui/app-icon'

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
import { FilterPillTriggerArea } from '@/ui/filters/filter-pill-trigger'
import type { FilterOption } from '@/ui/filters/types'
import { TruncatedOptionLabel } from '@/ui/filters/truncated-option-label'

export type FilterComboboxMultiProps = {
  label: string
  options: FilterOption[]
  values: string[]
  onValuesChange: (next: string[]) => void
  selectionMode?: 'multi'
  searchPlaceholder: string
  emptyLabel: string
  triggerClassName?: string
  clearAriaLabel?: string
  onSearchChange?: (query: string) => void
  loading?: boolean
  loadingLabel?: string
  showSelectAllToggle?: boolean
  showSelectAllContainingToggle?: boolean
  selectAllLabel?: string
  deselectAllLabel?: string
  selectAllContainingLabel?: string
  deselectAllContainingLabel?: string
  allContainingSummaryLabel?: string
  onOpenChange?: (open: boolean) => void
}

function toggle(list: string[], v: string): string[] {
  if (list.includes(v)) return list.filter((x) => x !== v)
  return [...list, v]
}

function truncateLabel(label: string, maxLen: number): string {
  if (label.length <= maxLen) return label
  return `${label.slice(0, maxLen)}...`
}

export function FilterComboboxMulti({
  label,
  options,
  values,
  onValuesChange,
  searchPlaceholder,
  emptyLabel,
  triggerClassName,
  clearAriaLabel = 'Clear filter',
  onSearchChange,
  loading = false,
  loadingLabel,
  showSelectAllToggle = true,
  showSelectAllContainingToggle = false,
  selectAllLabel = 'Select all',
  deselectAllLabel = 'Deselect all',
  selectAllContainingLabel = 'Select all containing: {query}',
  deselectAllContainingLabel = 'Deselect all containing: {query}',
  allContainingSummaryLabel = 'all containing {query}',
  onOpenChange,
}: FilterComboboxMultiProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [appliedContainsQuery, setAppliedContainsQuery] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (values.length > 0) return
    setAppliedContainsQuery(null)
  }, [values])

  const applyValues = React.useCallback(
    (next: string[], containsQuery: string | null = null) => {
      onValuesChange(next)
      setAppliedContainsQuery(containsQuery && next.length > 0 ? containsQuery : null)
    },
    [onValuesChange],
  )

  const summary = React.useMemo(() => {
    if (values.length === 0) return null
    if (appliedContainsQuery) {
      return allContainingSummaryLabel.replace('{query}', appliedContainsQuery)
    }
    const labels = values
      .map((v) => options.find((o) => o.value === v)?.label)
      .filter((x): x is string => Boolean(x))
      .map((x) => truncateLabel(x, 15))
    if (labels.length === 0) return null
    if (labels.length <= 2) return labels.join(', ')
    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`
  }, [values, options, appliedContainsQuery, allContainingSummaryLabel])

  const active = Boolean(summary)

  const normalizedQuery = query.trim().toLowerCase()
  const filteredOptions = React.useMemo(() => {
    if (!normalizedQuery) return options
    return options.filter((o) => {
      const haystack = `${o.label} ${o.value}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [options, normalizedQuery])

  const allOptionValues = React.useMemo(() => options.map((o) => o.value), [options])
  const filteredOptionValues = React.useMemo(
    () => filteredOptions.map((o) => o.value),
    [filteredOptions],
  )

  const allSelected =
    allOptionValues.length > 0 && allOptionValues.every((v) => values.includes(v))
  const filteredSelected =
    filteredOptionValues.length > 0 &&
    filteredOptionValues.every((v) => values.includes(v))

  const toggleSelectAll = React.useCallback(() => {
    const next = allSelected
      ? values.filter((v) => !allOptionValues.includes(v))
      : Array.from(new Set([...values, ...allOptionValues]))
    applyValues(next, null)
  }, [allOptionValues, allSelected, applyValues, values])

  const toggleSelectAllContaining = React.useCallback(() => {
    const next = filteredSelected
      ? values.filter((v) => !filteredOptionValues.includes(v))
      : Array.from(new Set([...values, ...filteredOptionValues]))
    const q = query.trim()
    applyValues(next, q.length > 0 ? q : null)
  }, [applyValues, filteredOptionValues, filteredSelected, query, values])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        onOpenChange?.(next)
      }}
    >
      <FilterPillTriggerArea
        active={active}
        label={label}
        valueSummary={summary}
        onClear={active ? () => applyValues([], null) : undefined}
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
        className="w-[min(calc(100vw-24px),18rem)] border-border-subtle bg-white shadow-[var(--shadow-popover)] ring-1 ring-[color:var(--ring-popover)] p-0 backdrop-blur-none"
      >
        <Command shouldFilter={false} className="bg-white">
          <CommandInput
            className="bg-white"
            placeholder={searchPlaceholder}
            onValueChange={(next) => {
              setQuery(next)
              onSearchChange?.(next)
            }}
          />
          <CommandList className="max-h-72 overflow-y-auto bg-white">
            <CommandEmpty>
              {loading ? (
                <span
                  className="flex w-full items-center justify-center gap-2 py-8 text-sm text-text-secondary"
                  role="status"
                  aria-live="polite"
                >
                  <LoadingIcon className="size-4 shrink-0" />
                  <span>{loadingLabel ?? searchPlaceholder}</span>
                </span>
              ) : (
                emptyLabel
              )}
            </CommandEmpty>
            {(showSelectAllToggle || showSelectAllContainingToggle) && !loading ? (
              <CommandGroup>
                {showSelectAllToggle && (
                  <CommandItem
                    value="__toggle-all__"
                    onSelect={toggleSelectAll}
                  >
                    <TruncatedOptionLabel
                      label={allSelected ? deselectAllLabel : selectAllLabel}
                      className="font-medium"
                    />
                  </CommandItem>
                )}
                {showSelectAllContainingToggle && normalizedQuery && (
                  <CommandItem
                    value="__toggle-filtered__"
                    onSelect={toggleSelectAllContaining}
                    disabled={filteredOptionValues.length === 0}
                  >
                    <span className="truncate font-medium">
                      {filteredSelected
                        ? deselectAllContainingLabel.replace('{query}', query)
                        : selectAllContainingLabel.replace('{query}', query)}
                    </span>
                  </CommandItem>
                )}
              </CommandGroup>
            ) : null}
            <CommandGroup>
              {!loading &&
                filteredOptions.map((o) => {
                const checked = values.includes(o.value)
                return (
                  <CommandItem
                    key={o.value}
                    value={`${o.label} ${o.value}`}
                    onSelect={() => {
                      applyValues(toggle(values, o.value), null)
                    }}
                  >
                    <span
                      className={cn(
                        'grid size-4 shrink-0 place-items-center rounded-[4px] border border-border-default',
                        checked
                          ? 'bg-secondary text-primary-foreground'
                          : 'bg-bg-default text-transparent',
                      )}
                      aria-hidden
                    >
                      <Check className="size-3" />
                    </span>
                    <TruncatedOptionLabel label={o.label} />
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
