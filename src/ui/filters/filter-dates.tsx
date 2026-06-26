import { Popover, PopoverContent } from '@/ui/popover'
import {
  DateRangePickerPanel,
  DateRangePickerTrigger,
  type DateRangePickerProps,
  useDateRangePickerModel,
} from '@/ui/date-range-picker'
import { cn } from '@/lib/utils'

export type FilterDatesProps = DateRangePickerProps & {
  triggerClassName?: string
}

export function FilterDates({
  triggerClassName,
  strings,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: FilterDatesProps) {
  const m = useDateRangePickerModel({
    strings,
    startValue,
    endValue,
    onStartChange,
    onEndChange,
  })

  return (
    <Popover open={m.open} onOpenChange={m.handleOpenChange}>
      <DateRangePickerTrigger
        label={m.triggerLabel}
        open={m.open}
        className={triggerClassName}
      />
      <PopoverContent
        align="start"
        sideOffset={6}
        positionMethod="fixed"
        collisionPadding={12}
        collisionAvoidance={{ side: 'shift', align: 'none', fallbackAxisSide: 'none' }}
        className={cn(
          'max-h-[min(90dvh,calc(100dvh-32px))] w-[min(calc(100vw-24px),740px)] max-w-[calc(100vw-24px)] min-w-0 overflow-x-auto overflow-y-auto border-[var(--shell-divider)] bg-white p-0 shadow-[var(--shadow-popover)] ring-1 ring-[color:var(--ring-popover)]',
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
          handleToday={m.handleToday}
          triggerLabel={m.triggerLabel}
        />
      </PopoverContent>
    </Popover>
  )
}
