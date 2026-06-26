/* eslint-disable react-refresh/only-export-components -- types + date helpers + hook + picker component */
import * as React from 'react'
import type { DateRange } from 'react-day-picker'
import { Check, ChevronDown, Clock } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Calendar } from '@/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'

const DATE_RANGE_POPOVER_MAX_W = 740
const DATE_RANGE_VIEWPORT_PAD = 24
const DATE_RANGE_EDGE_MARGIN = 12

export type DateRangePickerStrings = {
  applyLabel: string
  todayLabel: string
  placeholder: string
  presetLast7Days: string
  presetLast30Days: string
  presetLast6Months: string
  presetLastYearRolling: string
  presetCurrentYear: string
  presetPreviousYear: string
}

export type DateRangePickerProps = {
  strings: DateRangePickerStrings
  startValue: string
  endValue: string
  onStartChange: (value: string | undefined) => void
  onEndChange: (value: string | undefined) => void
  className?: string
  onClear?: () => void
  clearAriaLabel?: string
}

type PresetId = 'last7' | 'last30' | 'last6m' | 'last12m' | 'ytd' | 'lastYear' | 'custom'

function sob(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function toYmdFromDate(d: Date | undefined): string | undefined {
  if (!d || Number.isNaN(d.getTime())) return undefined
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseYmd(v: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim())
  if (!match) return undefined
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(d.getTime()) ? undefined : sob(d)
}

export function fmtDisplayDate(d: Date | undefined): string {
  if (!d) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function rangeForPreset(id: Exclude<PresetId, 'custom'>): { from: Date; to: Date } {
  const today = sob(new Date())

  const subDays = (n: number) => {
    const r = sob(today)
    r.setDate(r.getDate() - n)
    return r
  }
  const subMonths = (n: number) => {
    const r = sob(today)
    r.setMonth(r.getMonth() - n)
    return r
  }

  switch (id) {
    case 'last7':
      return { from: subDays(6), to: today }
    case 'last30':
      return { from: subDays(29), to: today }
    case 'last6m':
      return { from: subMonths(6), to: today }
    case 'last12m':
      return { from: subMonths(12), to: today }
    case 'ytd':
      return { from: new Date(today.getFullYear(), 0, 1), to: today }
    case 'lastYear': {
      const y = today.getFullYear() - 1
      return { from: new Date(y, 0, 1), to: sob(new Date(y, 11, 31)) }
    }
  }
}

export function presetDateRangeYmd(id: Exclude<PresetId, 'custom'>): { start: string; end: string } {
  const r = rangeForPreset(id)
  return {
    start: toYmdFromDate(r.from) ?? '',
    end: toYmdFromDate(r.to) ?? '',
  }
}

const CALENDAR_COLUMN_MIN_FOR_TWO_MONTHS = 520

function guessPreset(from?: Date, to?: Date): PresetId {
  if (!from || !to) return 'custom'
  const ids: Exclude<PresetId, 'custom'>[] = [
    'last7',
    'last30',
    'last6m',
    'last12m',
    'ytd',
    'lastYear',
  ]
  for (const id of ids) {
    const r = rangeForPreset(id)
    if (r.from.getTime() === sob(from).getTime() && r.to.getTime() === sob(to).getTime()) return id
  }
  return 'custom'
}

function buildPresets(strings: DateRangePickerStrings): { id: PresetId; label: string; divider?: boolean }[] {
  return [
    { id: 'last7', label: strings.presetLast7Days },
    { id: 'last30', label: strings.presetLast30Days },
    { id: 'last6m', label: strings.presetLast6Months },
    { id: 'last12m', label: strings.presetLastYearRolling },
    { id: 'ytd', label: strings.presetCurrentYear, divider: true },
    { id: 'lastYear', label: strings.presetPreviousYear },
  ]
}

function triggerLabelForPreset(
  preset: PresetId,
  presets: { id: PresetId; label: string }[],
  strings: DateRangePickerStrings,
  startDisplay: string,
  endDisplay: string,
  hasRange: boolean,
): string {
  if (!hasRange) return strings.placeholder
  if (preset !== 'custom') {
    const found = presets.find((p) => p.id === preset)
    if (found) return found.label
  }
  return `${startDisplay} - ${endDisplay}`
}

export type DateRangePickerModel = {
  strings: DateRangePickerStrings
  preset: PresetId
  applyPreset: (id: PresetId) => void
  presets: { id: PresetId; label: string; divider?: boolean }[]
  draft: DateRange
  setDraft: React.Dispatch<React.SetStateAction<DateRange>>
  visibleMonth: Date
  setVisibleMonth: React.Dispatch<React.SetStateAction<Date>>
  handleApply: () => void
  handleToday: () => void
  triggerLabel: string
}

export function useDateRangePickerModel({
  strings,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: DateRangePickerProps): DateRangePickerModel & {
  open: boolean
  handleOpenChange: (next: boolean) => void
  parsedStart: Date | undefined
  parsedEnd: Date | undefined
  startDisplay: string
  endDisplay: string
} {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<DateRange>(() => ({
    from: parseYmd(startValue),
    to: parseYmd(endValue),
  }))
  const [preset, setPreset] = React.useState<PresetId>(() =>
    guessPreset(parseYmd(startValue), parseYmd(endValue)),
  )

  const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

  const [visibleMonth, setVisibleMonth] = React.useState<Date>(() => {
    const from = parseYmd(startValue)
    if (from) return monthStart(from)
    const to = parseYmd(endValue)
    if (to) return monthStart(to)
    return monthStart(new Date())
  })

  const presets = React.useMemo(() => buildPresets(strings), [strings])

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const from = parseYmd(startValue)
      const to = parseYmd(endValue)
      setDraft({ from, to })
      setPreset(guessPreset(from, to))
      if (from) setVisibleMonth(monthStart(from))
      else if (to) setVisibleMonth(monthStart(to))
    }
    setOpen(next)
  }

  const applyPreset = (id: PresetId) => {
    setPreset(id)
    if (id === 'custom') return
    const r = rangeForPreset(id)
    setDraft({ from: r.from, to: r.to })
    setVisibleMonth(monthStart(r.from))
  }

  const handleApply = () => {
    if (!draft.from || !draft.to) return
    onStartChange(toYmdFromDate(draft.from))
    onEndChange(toYmdFromDate(draft.to))
    setOpen(false)
  }

  const handleToday = () => {
    const today = sob(new Date())
    setDraft({ from: today, to: today })
    setPreset('custom')
    setVisibleMonth(monthStart(today))
  }

  const parsedStart = parseYmd(startValue)
  const parsedEnd = parseYmd(endValue)
  const startDisplay = fmtDisplayDate(parsedStart)
  const endDisplay = fmtDisplayDate(parsedEnd)
  const hasRange = Boolean(parsedStart && parsedEnd)

  const displayPreset = guessPreset(parsedStart, parsedEnd)

  const triggerLabel = triggerLabelForPreset(
    displayPreset,
    presets,
    strings,
    startDisplay,
    endDisplay,
    hasRange,
  )

  return {
    open,
    handleOpenChange,
    strings,
    preset,
    applyPreset,
    presets,
    draft,
    setDraft,
    visibleMonth,
    setVisibleMonth,
    handleApply,
    handleToday,
    triggerLabel,
    parsedStart,
    parsedEnd,
    startDisplay,
    endDisplay,
  }
}

export function DateRangePickerTrigger({
  label,
  open,
  className,
}: {
  label: string
  open: boolean
  className?: string
}) {
  return (
    <PopoverTrigger
      type="button"
      className={cn(
        'inline-flex h-9 max-w-full min-w-0 shrink-0 items-center gap-2 rounded-md border border-border-default bg-white px-3 text-sm font-medium text-text-primary shadow-none transition-colors',
        'hover:bg-[var(--platinum-blonde-300)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
        'data-[state=open]:border-border-strong',
        className,
      )}
      aria-expanded={open}
    >
      <Clock className="size-4 shrink-0 text-text-secondary" aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
      <ChevronDown className="ml-auto size-4 shrink-0 text-text-secondary" aria-hidden />
    </PopoverTrigger>
  )
}

export function DateRangePickerPanel({
  strings,
  preset,
  applyPreset,
  presets,
  draft,
  setDraft,
  visibleMonth,
  setVisibleMonth,
  handleApply,
  handleToday,
}: DateRangePickerModel) {
  const calendarColumnRef = React.useRef<HTMLDivElement>(null)
  const [numberOfMonths, setNumberOfMonths] = React.useState<1 | 2>(2)

  React.useLayoutEffect(() => {
    const node = calendarColumnRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const w = Math.round(node.getBoundingClientRect().width)
      if (w < 40) return
      setNumberOfMonths(w >= CALENDAR_COLUMN_MIN_FOR_TWO_MONTHS ? 2 : 1)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="flex min-w-0 flex-col bg-white sm:flex-row sm:items-stretch">
      <nav
        aria-label="Date presets"
        className="flex w-full shrink-0 flex-col gap-0.5 border-b border-[var(--shell-divider)] p-2 sm:w-44 sm:border-r sm:border-b-0"
      >
        {presets.map((p) => (
          <React.Fragment key={p.id}>
            {p.divider ? <div className="my-1 h-px bg-[var(--shell-divider)]" /> : null}
            <button
              type="button"
              onClick={() => applyPreset(p.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                preset === p.id
                  ? 'bg-[var(--zara-400)] font-medium text-text-primary'
                  : 'text-text-secondary hover:bg-[var(--platinum-blonde-300)] hover:text-text-primary',
              )}
            >
              <span className="flex size-3.5 shrink-0 items-center justify-center">
                {preset === p.id ? <Check className="size-3.5" aria-hidden /> : null}
              </span>
              <span className="truncate">{p.label}</span>
            </button>
          </React.Fragment>
        ))}
      </nav>

      <div
        ref={calendarColumnRef}
        className="flex min-h-88 min-w-0 flex-1 flex-col bg-white sm:min-h-96"
      >
        <div className="flex min-w-0 flex-1 flex-col p-3">
          <Calendar
            mode="range"
            captionLayout="dropdown"
            startMonth={new Date(new Date().getFullYear() - 10, 0, 1)}
            endMonth={new Date(new Date().getFullYear() + 1, 11, 31)}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            showOutsideDays={false}
            selected={draft}
            onSelect={(range: DateRange | undefined) => {
              setDraft(range ?? { from: undefined, to: undefined })
              applyPreset('custom')
            }}
            numberOfMonths={numberOfMonths}
            className="bg-white p-0"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--shell-divider)] bg-white px-4 py-3">
          <Button type="button" variant="primary" size="sm" onClick={handleToday}>
            {strings.todayLabel}
          </Button>
          <Button
            type="button"
            variant="accent"
            size="sm"
            disabled={!draft.from || !draft.to}
            onClick={handleApply}
          >
            {strings.applyLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

const popoverContentClassName =
  'max-h-[min(90dvh,calc(100dvh-32px))] w-[min(calc(100vw-24px),740px)] max-w-[calc(100vw-24px)] min-w-0 overflow-x-auto overflow-y-auto border-[var(--shell-divider)] bg-white p-0 shadow-[var(--shadow-popover)] ring-1 ring-[color:var(--ring-popover)]'

export function DateRangePicker({
  strings,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  className,
}: DateRangePickerProps) {
  const m = useDateRangePickerModel({
    strings,
    startValue,
    endValue,
    onStartChange,
    onEndChange,
  })

  const pickerShellRef = React.useRef<HTMLDivElement>(null)
  const [popoverAlign, setPopoverAlign] = React.useState<'start' | 'end'>('start')

  React.useLayoutEffect(() => {
    if (!m.open) {
      setPopoverAlign('start')
      return
    }
    const root = pickerShellRef.current
    const btn = root?.querySelector('button[aria-expanded="true"]')
    if (!(btn instanceof HTMLElement)) return
    const r = btn.getBoundingClientRect()
    const vw = window.innerWidth
    const maxW = Math.min(vw - DATE_RANGE_VIEWPORT_PAD, DATE_RANGE_POPOVER_MAX_W)
    const overflowRight = r.left + maxW > vw - DATE_RANGE_EDGE_MARGIN
    const overflowLeftIfEnd = r.right - maxW < DATE_RANGE_EDGE_MARGIN
    const next: 'start' | 'end' = overflowRight && !overflowLeftIfEnd ? 'end' : 'start'
    setPopoverAlign(next)
  }, [m.open])

  return (
    <div ref={pickerShellRef} className="inline-flex max-w-full min-w-0 flex-col">
      <Popover open={m.open} onOpenChange={m.handleOpenChange}>
        <DateRangePickerTrigger label={m.triggerLabel} open={m.open} className={className} />
        <PopoverContent
          align={popoverAlign}
          sideOffset={6}
          positionMethod="fixed"
          collisionPadding={12}
          collisionAvoidance={{ side: 'shift', align: 'none', fallbackAxisSide: 'none' }}
          className={popoverContentClassName}
        >
          <DateRangePickerPanel
            strings={m.strings}
            preset={m.preset}
            applyPreset={m.applyPreset}
            presets={m.presets}
            draft={m.draft}
            setDraft={m.setDraft}
            visibleMonth={m.visibleMonth}
            setVisibleMonth={m.setVisibleMonth}
            handleApply={m.handleApply}
            handleToday={m.handleToday}
            triggerLabel={m.triggerLabel}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
