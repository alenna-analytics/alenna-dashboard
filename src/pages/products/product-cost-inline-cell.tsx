import type { MouseEvent } from 'react'
import { Pencil } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'
import { Badge } from '@/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip'

type ProductCostInlineCellProps = {
  productId: string
  label: string
  cost: number | null
  costMissing: boolean
  formatMoney: (value: number) => string
  readOnly?: boolean
  readOnlyHint?: string
  onOpenEditor: (productId: string) => void
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
  onOpenEditor,
  t,
}: ProductCostInlineCellProps) {
  const openEditor = (event?: MouseEvent) => {
    event?.stopPropagation()
    onOpenEditor(productId)
  }

  const costValue = costMissing || cost == null ? null : cost

  const costDisplay = costValue != null ? (
    <span className="tabular-nums">{formatMoney(costValue)}</span>
  ) : (
    <MissingCostBadge t={t} />
  )

  const editButton = !readOnly ? (
    <button
      type="button"
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-text-tertiary outline-none',
        'invisible group-hover:visible focus-visible:visible',
        'hover:bg-muted/70 hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring/30',
      )}
      aria-label={t('productsInlineCostEditAria').replace('{label}', label)}
      title={t('productsInlineCostForwardHelp')}
      onClick={openEditor}
    >
      <Pencil className="size-3.5 shrink-0" aria-hidden />
    </button>
  ) : (
    <span className="inline-block size-7 shrink-0" aria-hidden />
  )

  const displayRow = (
    <div className="grid w-full grid-cols-[1.75rem_minmax(0,1fr)] items-center justify-items-end gap-1.5">
      {editButton}
      <div className="min-w-0 justify-self-end">{costDisplay}</div>
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

  return (
    <div className="w-full" onClick={(event) => event.stopPropagation()}>
      {displayRow}
    </div>
  )
}
