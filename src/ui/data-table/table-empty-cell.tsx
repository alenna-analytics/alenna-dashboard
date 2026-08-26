/* eslint-disable react-refresh/only-export-components -- empty mark + helpers used by table cells */
import { cn } from '@/lib/utils'

export const TABLE_EMPTY_CELL = '—'

const emptyCellClassName =
  'font-sans font-normal normal-nums tracking-normal text-text-tertiary'

export function isTableEmptyText(value: string | null | undefined): boolean {
  const text = value?.trim() ?? ''
  if (!text) return true
  return /^\p{Pd}+$/u.test(text)
}

export function tableTextOrEmpty(raw: string | null | undefined): string {
  if (isTableEmptyText(raw)) return TABLE_EMPTY_CELL
  return raw!.trim()
}

type TableEmptyCellProps = {
  className?: string
}

export function TableEmptyCell({ className }: TableEmptyCellProps) {
  return (
    <span data-slot="table-empty-cell" className={cn(emptyCellClassName, className)} aria-hidden>
      {TABLE_EMPTY_CELL}
    </span>
  )
}
