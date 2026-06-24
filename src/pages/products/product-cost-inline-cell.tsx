import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Loader2 } from 'lucide-react'

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

const EMPTY_CELL = '—'

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

  const displayValue =
    cost != null ? (
      <span className="block text-right tabular-nums">{formatMoney(cost)}</span>
    ) : (
      <span className="block text-right tabular-nums text-text-tertiary">{EMPTY_CELL}</span>
    )

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

  if (readOnly) {
    const content = (
      <div className="flex flex-col items-end gap-1">
        {displayValue}
        {costMissing ? (
          <Badge variant="secondary" className="font-normal">
            {t('productsCostMissingBadge')}
          </Badge>
        ) : null}
      </div>
    )
    if (!readOnlyHint) return content
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            type="button"
            className="w-full cursor-default text-left outline-none"
            onClick={(event) => event.stopPropagation()}
          >
            {content}
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
    <button
      type="button"
      className={cn(
        'w-full rounded-sm px-1 py-0.5 text-right outline-none transition-colors',
        'hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/30',
        isSaving && 'pointer-events-none opacity-60',
      )}
      aria-label={t('productsInlineCostEditAria').replace('{label}', label)}
      title={t('productsInlineCostForwardHelp')}
      disabled={isSaving}
      onClick={(event) => {
        event.stopPropagation()
        setDraft(formatCostDraft(cost))
        onActivate(productId)
      }}
    >
      <div className="flex flex-col items-end gap-1">
        {displayValue}
        {costMissing ? (
          <Badge variant="secondary" className="font-normal">
            {t('productsCostMissingBadge')}
          </Badge>
        ) : null}
      </div>
    </button>
  )
}
