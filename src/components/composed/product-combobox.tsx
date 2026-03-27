import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { comboboxPopoverSurfaceClassName } from '@/lib/combobox-popover'
import { cn } from '@/lib/utils'
import type { ProductCandidate } from '@/lib/analytics-types'

type ProductComboboxProps = {
  items: ProductCandidate[]
  /** `undefined` or empty = no filter (all products). */
  selectedIds: string[] | undefined
  onToggleProduct: (productId: string) => void
  onSelectAllProducts: () => void
  triggerLabel: string
  placeholder: string
  allLabel: string
  searchPlaceholder: string
  emptyLabel: string
  isLoading?: boolean
  className?: string
}

export function ProductCombobox({
  items,
  selectedIds,
  onToggleProduct,
  onSelectAllProducts,
  triggerLabel,
  placeholder,
  allLabel,
  searchPlaceholder,
  emptyLabel,
  isLoading,
  className,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false)

  const hasFilter = Boolean(selectedIds?.length)
  const isProductOn = (id: string) => Boolean(selectedIds?.includes(id))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex h-9 min-w-[200px] max-w-[min(100%,360px)] items-center justify-between gap-2 rounded-[12px] border border-border-subtle bg-white/[0.03] px-3 text-xs font-medium text-text-secondary outline-none transition-colors duration-200 hover:border-border-default hover:bg-white/[0.05] focus-visible:border-border-default focus-visible:ring-2 focus-visible:ring-white/10 dark:border-border-default dark:bg-white/[0.04] dark:hover:border-border-strong dark:hover:bg-white/[0.06]',
          className
        )}
      >
        <span className="truncate text-left">{triggerLabel || placeholder}</span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'flex w-[min(100vw-1rem,360px)] max-w-[min(100vw-1rem,360px)] flex-col gap-0 overflow-hidden p-0',
          comboboxPopoverSurfaceClassName
        )}
        align="start"
        sideOffset={6}
      >
        <Command className="max-h-[min(400px,50dvh)]">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-xs text-text-tertiary">
              {isLoading ? '…' : emptyLabel}
            </CommandEmpty>
            <CommandGroup className="p-0">
              <CommandItem
                value="__all__"
                onSelect={() => {
                  onSelectAllProducts()
                  setOpen(false)
                }}
              >
                <span className="flex w-4 shrink-0 justify-center" aria-hidden>
                  <Check
                    className={cn(
                      'size-4 text-accent dark:text-accent-light',
                      !hasFilter ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </span>
                <span className="min-w-0 flex-1 truncate">{allLabel}</span>
              </CommandItem>
              {items.map((p) => (
                <CommandItem
                  key={p.product_id}
                  value={p.product_id}
                  keywords={[p.title, p.internal_sku ?? '', p.product_id]}
                  onSelect={() => {
                    onToggleProduct(p.product_id)
                  }}
                >
                  <span className="flex w-4 shrink-0 justify-center" aria-hidden>
                    <Check
                      className={cn(
                        'size-4 text-accent dark:text-accent-light',
                        isProductOn(p.product_id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-text-primary">
                    {p.internal_sku ? `${p.title} (${p.internal_sku})` : p.title}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
