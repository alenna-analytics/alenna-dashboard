import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DatePickerFieldProps = {
  value?: Date
  onChange?: (d: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePickerField({
  value,
  onChange,
  placeholder = 'Pick date',
  className,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex h-8 w-[min(100%,240px)] items-center justify-start gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm font-normal outline-none transition-colors select-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          className
        )}
      >
        <CalendarIcon className="size-4 shrink-0 opacity-60" />
        {value ? format(value, 'PP') : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange?.(d)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
