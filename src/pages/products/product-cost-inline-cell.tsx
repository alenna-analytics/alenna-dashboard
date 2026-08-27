import type { MouseEvent } from 'react'
import { Pencil } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'
import { TableEmptyCell } from '@/ui/data-table/table-empty-cell'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip'

type ProductCostInlineCellProps = {
  productId: string
  label: string
  cost: number | null
  costMissing: boolean
  formatMoney: (value: number) => string
  readOnly?: boolean
  readOnlyHint?: string
  onOpenEditor?: (productId: string) => void
  t: (key: ShellStringKey) => string
}

const PENCIL_SLOT_CLASS = 'relative inline-flex max-w-full items-center justify-end pr-4'
const PENCIL_ABS_CLASS =
  'pointer-events-none absolute right-0 size-3 shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'

function MissingCostMark({ replaceWithPencil }: { replaceWithPencil: boolean }) {
  if (!replaceWithPencil) {
    return <TableEmptyCell />
  }
  return (
    <span className="inline-flex min-w-[1em] items-center justify-end">
      <TableEmptyCell className="group-hover:hidden group-focus-within:hidden" />
      <Pencil
        className="hidden size-3 text-text-tertiary group-hover:inline group-focus-within:inline"
        aria-hidden
      />
    </span>
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
  const canEdit = Boolean(onOpenEditor) && !readOnly
  const openEditor = (event?: MouseEvent) => {
    event?.stopPropagation()
    onOpenEditor?.(productId)
  }

  const costValue = costMissing || cost == null ? null : cost
  const editAria = t('productsInlineCostEditAria').replace('{label}', label)
  const hasCost = costValue != null

  const valueNode = hasCost ? (
    <span className="truncate tabular-nums text-text-primary">{formatMoney(costValue)}</span>
  ) : (
    <MissingCostMark replaceWithPencil={canEdit} />
  )

  const displayRow = canEdit ? (
    <button
      type="button"
      className={cn(
        hasCost ? PENCIL_SLOT_CLASS : 'relative inline-flex max-w-full items-center justify-end',
        'rounded-md border border-transparent px-2 py-1 outline-none',
        'hover:border-border-subtle hover:bg-muted/50',
        'focus-visible:border-border-subtle focus-visible:ring-2 focus-visible:ring-ring/30',
      )}
      aria-label={editAria}
      title={hasCost ? t('productsInlineCostForwardHelp') : undefined}
      onClick={openEditor}
    >
      {valueNode}
      {hasCost ? <Pencil className={PENCIL_ABS_CLASS} aria-hidden /> : null}
    </button>
  ) : (
    <div className="inline-flex max-w-full justify-end px-2 py-1">{valueNode}</div>
  )

  const aligned = (
    <div className="flex w-full justify-end" onClick={(event) => event.stopPropagation()}>
      {displayRow}
    </div>
  )

  if (!canEdit && readOnlyHint) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            type="button"
            className="flex w-full cursor-default justify-end text-right outline-none"
            onClick={(event) => event.stopPropagation()}
          >
            {displayRow}
          </TooltipTrigger>
          <TooltipContent>{readOnlyHint}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return aligned
}
