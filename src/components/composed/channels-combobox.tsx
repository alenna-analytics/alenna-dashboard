import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { comboboxPopoverSurfaceClassName } from '@/lib/combobox-popover'
import { cn } from '@/lib/utils'

type Platform = 'shopify' | 'amazon' | 'mercadolibre'

type ChannelsComboboxProps = {
  platforms: Platform[]
  labels: Record<Platform, string>
  selected: Platform[] | undefined
  allSelectedLabel: string
  searchPlaceholder: string
  onToggle: (p: Platform) => void
  onSelectAll: () => void
  className?: string
}

export function ChannelsCombobox({
  platforms,
  labels,
  selected,
  allSelectedLabel,
  searchPlaceholder,
  onToggle,
  onSelectAll,
  className,
}: ChannelsComboboxProps) {
  const [open, setOpen] = useState(false)
  const active = selected ?? platforms
  const allSelected = !selected || selected.length === platforms.length
  const label = allSelected
    ? allSelectedLabel
    : active.map((p) => labels[p]).join(', ')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex h-9 min-w-[168px] max-w-[260px] items-center justify-between gap-2 rounded-[10px] border border-border-subtle bg-white/[0.03] px-3 text-xs font-medium text-text-secondary outline-none transition-colors hover:border-border-default hover:bg-white/[0.05] focus-visible:border-border-default focus-visible:ring-2 focus-visible:ring-white/10 dark:border-border-default dark:bg-white/[0.04] dark:hover:border-border-strong dark:hover:bg-white/[0.06]',
          className
        )}
      >
        <span className="truncate text-left">{label}</span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'flex w-[260px] max-w-[min(100vw-1rem,280px)] flex-col gap-0 overflow-hidden p-0',
          comboboxPopoverSurfaceClassName
        )}
        align="start"
        sideOffset={6}
      >
        <Command className="max-h-[min(360px,50dvh)]">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandGroup className="p-0">
              <CommandItem
                value="__all__"
                onSelect={() => {
                  onSelectAll()
                  setOpen(false)
                }}
              >
                <span className="flex w-4 shrink-0 justify-center" aria-hidden>
                  <Check
                    className={cn(
                      'size-4 text-accent dark:text-accent-light',
                      allSelected ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </span>
                <span className="min-w-0 flex-1 truncate">{allSelectedLabel}</span>
              </CommandItem>
              {platforms.map((p) => {
                const isExplicitlyOn =
                  selected !== undefined && selected.includes(p)
                return (
                  <CommandItem
                    key={p}
                    value={p}
                    keywords={[labels[p], p]}
                    onSelect={() => onToggle(p)}
                  >
                    <span className="flex w-4 shrink-0 justify-center" aria-hidden>
                      <Check
                        className={cn(
                          'size-4 text-accent dark:text-accent-light',
                          isExplicitlyOn ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-text-primary">
                      {labels[p]}
                    </span>
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
