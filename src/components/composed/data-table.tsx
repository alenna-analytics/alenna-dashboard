import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type DataTableColumn<TRow> = {
  key: string
  header: string
  align?: 'left' | 'right'
  mono?: boolean
  cell: (row: TRow) => ReactNode
}

type DataTableProps<TRow> = {
  columns: DataTableColumn<TRow>[]
  rows: TRow[]
  getRowKey: (row: TRow, index: number) => string
  emptyContent?: ReactNode
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSortChange?: (key: string) => void
}

export function DataTable<TRow>({
  columns,
  rows,
  getRowKey,
  emptyContent,
  sortBy,
  sortDir,
  onSortChange,
}: DataTableProps<TRow>) {
  const [internalSortBy, setInternalSortBy] = useState<string | null>(null)
  const [internalSortDir, setInternalSortDir] = useState<'asc' | 'desc'>('asc')

  const activeSortBy = sortBy ?? internalSortBy
  const activeSortDir = sortDir ?? internalSortDir

  const handleSort = (key: string) => {
    if (onSortChange) {
      onSortChange(key)
      return
    }
    if (internalSortBy === key) {
      setInternalSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setInternalSortBy(key)
    setInternalSortDir('asc')
  }

  const sortedRows = useMemo(() => {
    if (onSortChange) return rows
    if (!activeSortBy) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = getComparableValue(a, activeSortBy)
      const bv = getComparableValue(b, activeSortBy)
      const dir = activeSortDir === 'asc' ? 1 : -1
      if (av === bv) return 0
      if (av === null) return 1
      if (bv === null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
    return copy
  }, [rows, activeSortBy, activeSortDir, onSortChange])

  if (rows.length === 0 && emptyContent) {
    return <div className="text-sm text-text-secondary">{emptyContent}</div>
  }

  return (
    <Table className="w-full text-sm">
      <TableHeader>
        <TableRow className="border-border-subtle hover:bg-transparent">
          {columns.map((col) => (
            <TableHead
              key={col.key}
              className={cn(
                'py-3 font-semibold text-xs text-text-secondary tracking-wider uppercase',
                col.align === 'right' ? 'px-4 text-right' : 'px-4 text-left'
                )}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-text-primary"
                onClick={() => handleSort(col.key)}
              >
                <span>{col.header}</span>
                {activeSortBy === col.key ? (
                  activeSortDir === 'asc' ? (
                    <ArrowUpIcon className="size-3 text-text-primary" />
                  ) : (
                    <ArrowDownIcon className="size-3 text-text-primary" />
                  )
                ) : (
                  <ArrowUpDownIcon className="size-3 text-text-tertiary" />
                )}
              </button>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRows.map((row, index) => (
          <TableRow
            key={getRowKey(row, index)}
            className="h-10 border-border-subtle transition-colors even:bg-bg-elevated/40 hover:cursor-pointer hover:bg-accent/5"
          >
            {columns.map((col) => (
              <TableCell
                key={col.key}
                className={cn(
                  'py-2.5 text-text-primary',
                  col.align === 'right'
                    ? 'px-4 text-right font-mono'
                    : 'px-4 text-left',
                  col.mono && col.align !== 'right' && 'font-mono'
                )}
              >
                {col.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function getComparableValue<TRow>(row: TRow, key: string): string | number | null {
  const value = (row as Record<string, unknown>)[key]
  if (value == null) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const numeric = Number(value.replace(/[%,$,\s]/g, ''))
    if (!Number.isNaN(numeric) && value.trim() !== '') return numeric
    return value.toLowerCase()
  }
  if (typeof value === 'boolean') return value ? 1 : 0
  return String(value)
}
