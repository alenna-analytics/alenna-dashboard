import { Popover, PopoverContent } from '@/ui/popover'
import {
  DateRangePickerPanel,
  type DateRangePickerProps,
  useDateRangePickerModel,
} from '@/ui/date-range-picker'
import { cn } from '@/lib/utils'
import { FilterPillTriggerArea } from '@/ui/filters/filter-pill-trigger'

export type FilterDatesProps = DateRangePickerProps & {
  label: string
  showSummary?: boolean
  triggerClassName?: string
}

export function FilterDates({
  label,
  showSummary = true,
  triggerClassName,
  strings,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  onClear,
  clearAriaLabel,
}: FilterDatesProps) {
  const m = useDateRangePickerModel({
    strings,
    startValue,
    endValue,
    onStartChange,
    onEndChange,
  })

  const inactiveLabel = label.trim() || strings.presetCustom
  const active = Boolean(m.parsedStart && m.parsedEnd)
  const activeLabel = showSummary ? label.trim() : ''
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
        triggerClassName={triggerClassName}
      />
      <PopoverContent
        align="start"
        sideOffset={6}
        positionMethod="fixed"
        collisionPadding={12}
        collisionAvoidance={{ side: 'shift', align: 'none', fallbackAxisSide: 'none' }}
        className={cn(
          'max-h-[min(90dvh,calc(100dvh-32px))] w-[min(calc(100vw-24px),740px)] max-w-[calc(100vw-24px)] min-w-0 overflow-x-auto overflow-y-auto border-border-subtle shadow-[var(--shadow-popover)] ring-1 ring-[color:var(--ring-popover)] p-0',
        )}
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
