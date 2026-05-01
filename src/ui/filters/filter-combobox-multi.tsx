import * as React from 'react'
import { Check } from 'lucide-react'

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

export type FilterComboboxMultiProps = {
  label: string
  options: FilterOption[]
  values: string[]
  onValuesChange: (next: string[]) => void
  searchPlaceholder: string
  emptyLabel: string
  triggerClassName?: string
  clearAriaLabel?: string
}

function toggle(list: string[], v: string): string[] {
  if (list.includes(v)) return list.filter((x) => x !== v)
  return [...list, v]
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
}: FilterComboboxMultiProps) {
  const [open, setOpen] = React.useState(false)

  const summary = React.useMemo(() => {
    if (values.length === 0) return null
    const labels = values
      .map((v) => options.find((o) => o.value === v)?.label)
      .filter((x): x is string => Boolean(x))
    if (labels.length === 0) return null
    if (labels.length <= 2) return labels.join(', ')
    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`
  }, [values, options])

  const active = Boolean(summary)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FilterPillTriggerArea
        active={active}
        label={label}
        valueSummary={summary}
        onClear={active ? () => onValuesChange([]) : undefined}
        clearAriaLabel={clearAriaLabel}
        ariaExpanded={open}
        triggerClassName={triggerClassName}
      />
      <PopoverContent align="start" sideOffset={6} className="w-[min(calc(100vw-24px),18rem)] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const checked = values.includes(o.value)
                return (
                  <CommandItem
                    key={o.value}
                    value={`${o.label} ${o.value}`}
                    onSelect={() => {
                      onValuesChange(toggle(values, o.value))
                    }}
                  >
                    <Check
                      className={cn('size-4 shrink-0', checked ? 'opacity-100' : 'opacity-0')}
                      aria-hidden
                    />
                    <span className="truncate">{o.label}</span>
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
