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

  const editAria = t('productsInlineCostEditAria').replace('{label}', label)
  const pencilClassName =
    'size-3 shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'

  const displayRow =
    !readOnly && costValue != null ? (
      <button
        type="button"
        className={cn(
          'inline-flex max-w-full items-center gap-1.5 rounded-md border border-transparent px-2 py-1 outline-none',
          'text-text-primary hover:border-border-subtle hover:bg-muted/50',
          'focus-visible:border-border-subtle focus-visible:ring-2 focus-visible:ring-ring/30',
        )}
        aria-label={editAria}
        title={t('productsInlineCostForwardHelp')}
        onClick={openEditor}
      >
        <span className="truncate tabular-nums">{formatMoney(costValue)}</span>
        <Pencil className={pencilClassName} aria-hidden />
      </button>
    ) : !readOnly && costValue == null ? (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/30"
        aria-label={editAria}
        onClick={openEditor}
      >
        <MissingCostBadge t={t} />
        <Pencil className={pencilClassName} aria-hidden />
      </button>
    ) : (
      <div className="inline-flex max-w-full justify-end px-2 py-1">
        {costValue != null ? (
          <span className="truncate tabular-nums text-text-primary">{formatMoney(costValue)}</span>
        ) : (
          <MissingCostBadge t={t} />
        )}
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
    <div className="flex w-full justify-end" onClick={(event) => event.stopPropagation()}>
      {displayRow}
    </div>
  )
}
