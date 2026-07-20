import * as React from 'react'

import type { AmountCompareOp } from '@/pages/expenses/expenses-helpers'
import { Button } from '@/ui/button'
import { FilterPillTriggerArea } from '@/ui/filters/filter-pill-trigger'
import type { FilterOption } from '@/ui/filters/types'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Popover, PopoverContent } from '@/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'

export type ExpensesAmountFilterProps = {
  label: string
  filterByLabel: string
  op: AmountCompareOp
  amount: string
  opOptions: FilterOption[]
  onApply: (next: { op: AmountCompareOp; amount: string }) => void
  onClear: () => void
  opLabel: string
  amountPlaceholder: string
  applyLabel: string
  clearAriaLabel: string
}

function opShortLabel(op: AmountCompareOp): string {
  if (op === 'gte') return '≥'
  if (op === 'lte') return '≤'
  return '='
}

export function ExpensesAmountFilter({
  label,
  filterByLabel,
  op,
  amount,
  opOptions,
  onApply,
  onClear,
  opLabel,
  amountPlaceholder,
  applyLabel,
  clearAriaLabel,
}: ExpensesAmountFilterProps) {
  const [open, setOpen] = React.useState(false)
  const [draftOp, setDraftOp] = React.useState<AmountCompareOp>(op)
  const [draftAmount, setDraftAmount] = React.useState(amount)

  React.useEffect(() => {
    if (open) {
      setDraftOp(op)
      setDraftAmount(amount)
    }
  }, [open, op, amount])

  const trimmed = amount.trim()
  const active = trimmed.length > 0
  const summary = active ? `${opShortLabel(op)} ${trimmed}` : null
  const draftOpLabel =
    opOptions.find((option) => option.value === draftOp)?.label ?? draftOp

  const commit = () => {
    onApply({ op: draftOp, amount: draftAmount.trim() })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <FilterPillTriggerArea
        active={active}
        label={label}
        valueSummary={summary}
        onClear={active ? onClear : undefined}
        clearAriaLabel={clearAriaLabel}
        ariaExpanded={open}
      />
      <PopoverContent align="start" sideOffset={6} className="w-[min(calc(100vw-24px),18rem)] p-3">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-text-primary">{filterByLabel}</p>
          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">{opLabel}</Label>
            <Select
              value={draftOp}
              itemToStringLabel={(value) =>
                opOptions.find((option) => option.value === value)?.label ?? String(value)
              }
              onValueChange={(value) => {
                if (value) setDraftOp(value as AmountCompareOp)
              }}
            >
              <SelectTrigger className="h-9 w-full rounded-md">
                <SelectValue placeholder={opLabel}>{draftOpLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {opOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} label={option.label}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">{amountPlaceholder}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={draftAmount}
              onChange={(e) => setDraftAmount(e.target.value)}
              placeholder={amountPlaceholder}
              aria-label={amountPlaceholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
              }}
            />
          </div>
          <Button type="button" variant="accent" size="sm" className="w-full" onClick={commit}>
            {applyLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
