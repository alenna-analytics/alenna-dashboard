import type { ColumnSizingState } from '@tanstack/react-table'

/** Wider default for the concept / label column. */
export const STATEMENT_CONCEPT_COLUMN_SIZE = {
  size: 280,
  minSize: 140,
  maxSize: 480,
} as const

/** Narrower default for money / metric columns. */
export const STATEMENT_VALUE_COLUMN_SIZE = {
  size: 120,
  minSize: 72,
  maxSize: 280,
} as const

/**
 * Session-only column resize defaults for statement / matrix tables (not persisted).
 * Per-column `size` / `minSize` should still be set (concept vs value).
 */
export const statementTableColumnResize = {
  enableColumnResizing: true,
  columnResizeMode: 'onChange' as const,
  defaultColumn: {
    minSize: STATEMENT_VALUE_COLUMN_SIZE.minSize,
    size: STATEMENT_VALUE_COLUMN_SIZE.size,
    maxSize: STATEMENT_VALUE_COLUMN_SIZE.maxSize,
  },
}

type ClampColumnMeta = {
  id: string
  minSize: number
  /** Current rendered size (from column.getSize / defaults). */
  size: number
}

/**
 * Keep the sum of column widths within `maxTotal` so the table does not overflow
 * its container. Shrinks the resized column first when possible.
 * Returns the original `sizing` when no clamp is needed.
 */
export function clampColumnSizingToContainer(
  sizing: ColumnSizingState,
  columns: ClampColumnMeta[],
  maxTotal: number,
  resizingColumnId: string | false | null,
): ColumnSizingState {
  if (!Number.isFinite(maxTotal) || maxTotal <= 0 || columns.length === 0) return sizing

  const resolved = columns.map((col) => {
    const raw = sizing[col.id]
    const size = typeof raw === 'number' && Number.isFinite(raw) ? raw : col.size
    return { id: col.id, minSize: col.minSize, size: Math.max(col.minSize, size) }
  })

  const total = resolved.reduce((sum, col) => sum + col.size, 0)
  if (total <= maxTotal) return sizing

  let overflow = total - maxTotal
  const preferId =
    typeof resizingColumnId === 'string' && resizingColumnId
      ? resizingColumnId
      : resolved[resolved.length - 1]?.id

  const shrink = (id: string) => {
    const col = resolved.find((c) => c.id === id)
    if (!col || overflow <= 0) return
    const reducible = col.size - col.minSize
    if (reducible <= 0) return
    const take = Math.min(reducible, overflow)
    col.size -= take
    overflow -= take
  }

  if (preferId) shrink(preferId)
  for (const col of [...resolved].reverse()) {
    if (overflow <= 0) break
    shrink(col.id)
  }

  return Object.fromEntries(resolved.map((col) => [col.id, col.size]))
}
