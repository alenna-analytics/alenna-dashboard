import * as React from 'react'

import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'
import { filterPillInactiveClassName } from '@/ui/filters/filter-pill-classes'
import { FilterPillTrigger } from '@/ui/filters/filter-pill-trigger'

export type FilterMoreProps = {
  label: string
  body: React.ReactNode
  triggerClassName?: string
}

export function FilterMore({ label, body, triggerClassName }: FilterMoreProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className={cn(filterPillInactiveClassName(), triggerClassName)}
        aria-expanded={open}
      >
        <FilterPillTrigger label={label} />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="max-w-xs p-3 text-sm text-text-secondary">
        {body}
      </PopoverContent>
    </Popover>
  )
}
