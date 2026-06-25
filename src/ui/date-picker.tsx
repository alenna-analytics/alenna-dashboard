import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Calendar } from '@/ui/calendar'
import { fmtDisplayDate, parseYmd, toYmdFromDate } from '@/ui/date-range-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'

export type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  className?: string
  placeholder?: string
  openAriaLabel?: string
  /** Earliest selectable date (YYYY-MM-DD). Dates before this are disabled. */
  minDate?: string
  /** Latest selectable date (YYYY-MM-DD). Dates after this are disabled. */
  maxDate?: string
  /** Earliest month available in month/year dropdowns. Defaults to 10 years ago. */
  startMonth?: Date
  /** Latest month available in month/year dropdowns. Defaults to end of next calendar year. */
  endMonth?: Date
}

function defaultPickerStartMonth(): Date {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 10)
  d.setDate(1)
  return d
}

function defaultPickerEndMonth(): Date {
  return new Date(new Date().getFullYear() + 1, 11, 31)
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  id,
  className,
  placeholder = '—',
  openAriaLabel = 'Open calendar',
  minDate,
  maxDate,
  startMonth = defaultPickerStartMonth(),
  endMonth = defaultPickerEndMonth(),
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const parsed = parseYmd(value)
  const minParsed = minDate ? parseYmd(minDate) : null
  const maxParsed = maxDate ? parseYmd(maxDate) : null
  const disabledMatchers = [
    minParsed ? { before: minParsed } : null,
    maxParsed ? { after: maxParsed } : null,
  ].filter((matcher): matcher is { before: Date } | { after: Date } => matcher !== null)
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => parsed ?? maxParsed ?? minParsed ?? new Date())

  const handleOpenChange = (next: boolean) => {
    if (next && parsed) {
      setVisibleMonth(parsed)
    }
    setOpen(next)
  }

  const handleSelect = (date: Date | undefined) => {
    const next = toYmdFromDate(date)
    if (!next) return
    onChange(next)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={openAriaLabel}
            className={cn(
              'h-9 w-full justify-start gap-2 px-3 font-normal',
              !parsed && 'text-muted-foreground',
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-4 shrink-0 text-text-tertiary" aria-hidden />
        <span className="truncate">{parsed ? fmtDisplayDate(parsed) : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto border-border-subtle p-0 shadow-[var(--shadow-popover)] ring-1 ring-[color:var(--ring-popover)]"
      >
        <Calendar
          mode="single"
          captionLayout="dropdown"
          startMonth={minParsed ?? startMonth}
          endMonth={maxParsed ?? endMonth}
          month={visibleMonth}
          onMonthChange={setVisibleMonth}
          showOutsideDays={false}
          selected={parsed}
          onSelect={handleSelect}
          disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}
