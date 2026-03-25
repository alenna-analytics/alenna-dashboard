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
          'inline-flex h-9 w-[min(100%,240px)] items-center justify-start gap-2 rounded-[10px] border border-border-subtle bg-white/[0.03] px-3 text-xs font-medium text-text-secondary outline-none transition-colors select-none hover:border-border-default hover:bg-white/[0.05] focus-visible:border-border-default focus-visible:ring-2 focus-visible:ring-white/10',
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
