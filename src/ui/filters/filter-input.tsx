import * as React from 'react'

import { Popover, PopoverContent } from '@/ui/popover'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { FilterPillTriggerArea } from '@/ui/filters/filter-pill-trigger'

export type FilterInputProps = {
  label: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  applyLabel: string
  inputAriaLabel: string
  triggerClassName?: string
  clearAriaLabel?: string
}

export function FilterInput({
  label,
  value,
  onChange,
  placeholder,
  applyLabel,
  inputAriaLabel,
  triggerClassName,
  clearAriaLabel = 'Clear filter',
}: FilterInputProps) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState(value)

  React.useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  const summary = value.trim().length > 0 ? value : null
  const active = Boolean(summary)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FilterPillTriggerArea
        active={active}
        label={label}
        valueSummary={summary}
        onClear={active ? () => onChange('') : undefined}
        clearAriaLabel={clearAriaLabel}
        ariaExpanded={open}
        triggerClassName={triggerClassName}
      />
      <PopoverContent align="start" sideOffset={6} className="w-[min(calc(100vw-24px),20rem)] p-3">
        <div className="flex flex-col gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            aria-label={inputAriaLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onChange(draft)
                setOpen(false)
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            className="self-end"
            onClick={() => {
              onChange(draft)
              setOpen(false)
            }}
          >
            {applyLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
