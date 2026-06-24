import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Loader2, Pencil } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'
import { Badge } from '@/ui/badge'
import { Input } from '@/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip'

import {
  costsEqual,
  formatCostDraft,
  parseCostInput,
} from './product-cost-input-utils'

type ProductCostInlineCellProps = {
  productId: string
  label: string
  cost: number | null
  costMissing: boolean
  formatMoney: (value: number) => string
  readOnly?: boolean
  readOnlyHint?: string
  isActive: boolean
  onActivate: (productId: string) => void
  onDeactivate: () => void
  onSave: (productId: string, cost: number) => Promise<void>
  isSaving: boolean
  t: (key: ShellStringKey) => string
}

function MissingCostBadge({ t }: { t: (key: ShellStringKey) => string }) {
  return (
    <Badge variant="warning" className="font-normal">
      {t('productsCostMissingBadge')}
    </Badge>
  )
}

export function ProductCostInlineCell({
  productId,
  label,
  cost,
  costMissing,
  formatMoney,
  readOnly = false,
  readOnlyHint,
  isActive,
  onActivate,
  onDeactivate,
  onSave,
  isSaving,
  t,
}: ProductCostInlineCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(() => formatCostDraft(cost))

  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isActive])

  const cancelEdit = useCallback(() => {
    setDraft(formatCostDraft(cost))
    onDeactivate()
  }, [cost, onDeactivate])

  const commitEdit = useCallback(async () => {
    const parsed = parseCostInput(draft)
    if (parsed === null) {
      cancelEdit()
      return
    }
    if (costsEqual(cost, parsed)) {
      onDeactivate()
      return
    }
    try {
      await onSave(productId, parsed)
      onDeactivate()
    } catch {
      setDraft(formatCostDraft(cost))
      onDeactivate()
    }
  }, [cancelEdit, cost, draft, onDeactivate, onSave, productId])

  const activateEdit = useCallback(
    (event?: MouseEvent) => {
      event?.stopPropagation()
      setDraft(formatCostDraft(cost))
      onActivate(productId)
    },
    [cost, onActivate, productId],
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation()
    if (event.key === 'Enter') {
      event.preventDefault()
      void commitEdit()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelEdit()
    }
  }

  const costValue = costMissing || cost == null ? null : cost

  const costDisplay = costValue != null ? (
    <span className="tabular-nums">{formatMoney(costValue)}</span>
  ) : (
    <MissingCostBadge t={t} />
  )

  const displayRow = (
    <div className="flex items-center justify-end gap-1.5">
      {!readOnly ? (
        <button
          type="button"
          className={cn(
            'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-text-tertiary outline-none',
            'opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
            'hover:bg-muted/70 hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring/30',
            isSaving && 'pointer-events-none',
          )}
          aria-label={t('productsInlineCostEditAria').replace('{label}', label)}
          title={t('productsInlineCostForwardHelp')}
          disabled={isSaving}
          onClick={activateEdit}
        >
          <Pencil className="size-3.5 shrink-0" aria-hidden />
        </button>
      ) : null}
      {costDisplay}
    </div>
  )

  if (readOnly) {
    if (!readOnlyHint) return displayRow
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            type="button"
            className="w-full cursor-default text-left outline-none"
            onClick={(event) => event.stopPropagation()}
          >
            {displayRow}
          </TooltipTrigger>
          <TooltipContent>{readOnlyHint}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (isActive) {
    return (
      <div
        className="flex items-center justify-end gap-1"
        onClick={(event) => event.stopPropagation()}
      >
        <Input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          variant="default"
          value={draft}
          disabled={isSaving}
          aria-label={t('productsInlineCostEditAria').replace('{label}', label)}
          title={t('productsInlineCostForwardHelp')}
          className="h-8 w-[7.5rem] text-right tabular-nums"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            void commitEdit()
          }}
        />
        {isSaving ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-text-tertiary" aria-hidden />
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={cn('w-full', isSaving && 'pointer-events-none opacity-60')}
      onClick={(event) => event.stopPropagation()}
    >
      {displayRow}
    </div>
  )
}
