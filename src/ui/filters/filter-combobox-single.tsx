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

export type FilterComboboxSingleProps = {
  label: string
  options: FilterOption[]
  value: string
  onValueChange: (value: string) => void
  searchPlaceholder: string
  emptyLabel: string
  triggerClassName?: string
  clearAriaLabel?: string
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
}: FilterComboboxSingleProps) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o) => o.value === value)
  const summary = selected?.label ?? (value ? value : null)
  const active = Boolean(value && summary)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FilterPillTriggerArea
        active={active}
        label={label}
        valueSummary={summary}
        onClear={active ? () => onValueChange('') : undefined}
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
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={`${o.label} ${o.value}`}
                  onSelect={() => {
                    onValueChange(o.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      value === o.value ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden
                  />
                  <span className="truncate">{o.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
