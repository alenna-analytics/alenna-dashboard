/* eslint-disable react-refresh/only-export-components -- types + date helpers + hook + picker component */
import * as React from 'react'
import type { DateRange } from 'react-day-picker'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Calendar } from '@/ui/calendar'
import { Popover, PopoverContent } from '@/ui/popover'
import { FilterPillTriggerArea } from '@/ui/filters/filter-pill-trigger'

export type DateRangePickerStrings = {
  startLabel: string
  endLabel: string
  applyLabel: string
  presetCustom: string
  presetLast7Days: string
  presetLast30Days: string
  presetLast3Months: string
  presetLast12Months: string
  presetCurrentMonth: string
  presetCurrentQuarter: string
  presetYtd: string
  presetLastYear: string
}

export type DateRangePickerProps = {
  strings: DateRangePickerStrings
  startValue: string
  endValue: string
  onStartChange: (value: string | undefined) => void
  onEndChange: (value: string | undefined) => void
  className?: string
  /** Label next to the range when active (img 1). If omitted, only the violet date span shows when active. */
  filterLabel?: string
  /** Clears to caller-defined defaults (e.g. reset persisted range). */
  onClear?: () => void
  clearAriaLabel?: string
}

type PresetId =
  | 'last7'
  | 'last30'
  | 'last3m'
  | 'last12m'
  | 'currentMonth'
  | 'currentQuarter'
  | 'ytd'
  | 'lastYear'
  | 'custom'

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

function parseYmd(v: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim())
  if (!match) return undefined
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(d.getTime()) ? undefined : sob(d)
}

export function fmtDisplayDate(d: Date | undefined): string {
  if (!d) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function rangeForPreset(id: Exclude<PresetId, 'custom'>): { from: Date; to: Date } {
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
  const som = new Date(today.getFullYear(), today.getMonth(), 1)
  const eom = sob(new Date(today.getFullYear(), today.getMonth() + 1, 0))
  const q0 = Math.floor(today.getMonth() / 3) * 3
  const soq = new Date(today.getFullYear(), q0, 1)
  const eoq = sob(new Date(today.getFullYear(), q0 + 3, 0))

  switch (id) {
    case 'last7':
      return { from: subDays(6), to: today }
    case 'last30':
      return { from: subDays(29), to: today }
    case 'last3m':
      return { from: subMonths(3), to: today }
    case 'last12m':
      return { from: subMonths(12), to: today }
    case 'currentMonth':
      return { from: som, to: eom }
    case 'currentQuarter':
      return { from: soq, to: eoq }
    case 'ytd':
      return { from: new Date(today.getFullYear(), 0, 1), to: today }
    case 'lastYear': {
      const y = today.getFullYear() - 1
      return { from: new Date(y, 0, 1), to: sob(new Date(y, 11, 31)) }
    }
  }
}

function guessPreset(from?: Date, to?: Date): PresetId {
  if (!from || !to) return 'custom'
  const ids: Exclude<PresetId, 'custom'>[] = [
    'last7',
    'last30',
    'last3m',
    'last12m',
    'currentMonth',
    'currentQuarter',
    'ytd',
    'lastYear',
  ]
  for (const id of ids) {
    const r = rangeForPreset(id)
    if (r.from.getTime() === sob(from).getTime() && r.to.getTime() === sob(to).getTime()) return id
  }
  return 'custom'
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

  const presets: { id: PresetId; label: string; divider?: boolean }[] = [
    { id: 'last7', label: strings.presetLast7Days },
    { id: 'last30', label: strings.presetLast30Days },
    { id: 'last3m', label: strings.presetLast3Months },
    { id: 'last12m', label: strings.presetLast12Months },
    { id: 'currentMonth', label: strings.presetCurrentMonth, divider: true },
    { id: 'currentQuarter', label: strings.presetCurrentQuarter },
    { id: 'ytd', label: strings.presetYtd },
    { id: 'lastYear', label: strings.presetLastYear },
    { id: 'custom', label: strings.presetCustom, divider: true },
  ]

  const parsedStart = parseYmd(startValue)
  const parsedEnd = parseYmd(endValue)
  const startDisplay = fmtDisplayDate(parsedStart)
  const endDisplay = fmtDisplayDate(parsedEnd)

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
    parsedStart,
    parsedEnd,
    startDisplay,
    endDisplay,
  }
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
}: DateRangePickerModel) {
  return (
    <div className="flex flex-col sm:flex-row">
      <nav
        aria-label="Date presets"
        className="flex w-full shrink-0 flex-col gap-0.5 border-b border-border-subtle/70 p-1.5 sm:w-40 sm:border-b-0 sm:border-r sm:rounded-l-md"
      >
        {presets.map((p) => (
          <React.Fragment key={p.id}>
            {p.divider ? <div className="my-1 h-px bg-border-subtle/70" /> : null}
            <button
              type="button"
              onClick={() => applyPreset(p.id)}
              className={cn(
                'flex w-full items-center gap-1.5 rounded-full px-2 py-1.5 text-left text-xs transition-colors',
                preset === p.id
                  ? 'bg-bg-surface font-medium text-text-primary shadow-sm backdrop-blur-sm'
                  : 'text-text-secondary hover:bg-glass-fill-muted hover:text-text-primary',
              )}
            >
              <span className="flex size-3 shrink-0 items-center justify-center">
                {preset === p.id ? <Check className="size-3" aria-hidden /> : null}
              </span>
              <span className="truncate">{p.label}</span>
            </button>
          </React.Fragment>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="p-2">
          <Calendar
            mode="range"
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            showOutsideDays={false}
            selected={draft}
            onSelect={(range: DateRange | undefined) => {
              setDraft(range ?? { from: undefined, to: undefined })
              applyPreset('custom')
            }}
            numberOfMonths={2}
          />
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle/70 px-3 py-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {fmtDisplayDate(draft.from)} → {fmtDisplayDate(draft.to)}
          </span>
          <Button type="button" size="sm" disabled={!draft.from || !draft.to} onClick={handleApply}>
            {strings.applyLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function DateRangePicker({
  strings,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  className,
  filterLabel,
  onClear,
  clearAriaLabel,
}: DateRangePickerProps) {
  const m = useDateRangePickerModel({
    strings,
    startValue,
    endValue,
    onStartChange,
    onEndChange,
  })

  const inactiveLabel = filterLabel?.trim() || strings.presetCustom
  const active = Boolean(m.parsedStart && m.parsedEnd)
  const activeLabel = filterLabel?.trim() ?? ''
  const valueSummary = active ? `${m.startDisplay} - ${m.endDisplay}` : null

  return (
    <Popover open={m.open} onOpenChange={m.handleOpenChange}>
      <FilterPillTriggerArea
        active={active}
        label={active ? activeLabel : inactiveLabel}
        valueSummary={valueSummary}
        onClear={onClear}
        clearAriaLabel={clearAriaLabel ?? 'Clear date range'}
        ariaExpanded={m.open}
        triggerClassName={className}
      />

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[min(calc(100vw-24px),740px)] overflow-hidden p-0"
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
        />
      </PopoverContent>
    </Popover>
  )
}
