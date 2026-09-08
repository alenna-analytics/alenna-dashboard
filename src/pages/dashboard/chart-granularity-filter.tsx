import { useMemo, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { RevenueSeriesGranularity } from '@/lib/types/reports'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'
import { TruncatedOptionLabel } from '@/ui/filters/truncated-option-label'

export type ChartGranularityFilterProps = {
  value: RevenueSeriesGranularity
  onChange: (value: RevenueSeriesGranularity) => void
  t: (key: ShellStringKey) => string
}

const granularityButtonClassName = cn(
  'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border-default bg-white px-2.5',
  'text-xs font-medium leading-none text-text-primary shadow-none transition-colors',
  'hover:bg-muted/50',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
  'data-[state=open]:bg-muted/50',
)

const popoverPanelClassName =
  'w-[min(calc(100vw-24px),12rem)] border-border-subtle bg-white p-0 shadow-[var(--shadow-popover)] ring-1 ring-[color:var(--ring-popover)] backdrop-blur-none'

export function ChartGranularityFilter({ value, onChange, t }: ChartGranularityFilterProps) {
  const [open, setOpen] = useState(false)
  const options = useMemo(
    () => [
      { value: 'month' as const, label: t('dashboardRevenueGranularityMonth') },
      { value: 'week' as const, label: t('dashboardRevenueGranularityWeek') },
      { value: 'day' as const, label: t('dashboardRevenueGranularityDay') },
    ],
    [t],
  )
  const selected = options.find((option) => option.value === value) ?? options[0]
  const label = t('dashboardRevenueGranularityLabel')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className={granularityButtonClassName}
        aria-label={`${label}: ${selected?.label ?? ''}`}
        aria-expanded={open}
      >
        <span className="whitespace-nowrap text-[color:var(--filter-pill-value-active)]">
          {selected?.label}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={6}
        positionMethod="fixed"
        collisionPadding={12}
        collisionAvoidance={{ side: 'shift', align: 'shift', fallbackAxisSide: 'end' }}
        className={popoverPanelClassName}
      >
        <Command className="bg-white">
          <CommandInput placeholder={t('filterSearch')} />
          <CommandList className="max-h-72 overflow-y-auto bg-white">
            <CommandEmpty>{t('filterComingSoon')}</CommandEmpty>
            <CommandGroup className="bg-white">
              {options.map((option) => {
                const isSelected = value === option.value
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                    className="justify-between gap-2"
                  >
                    <TruncatedOptionLabel label={option.label} />
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
