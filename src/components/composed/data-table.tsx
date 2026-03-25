import type { ReactNode } from 'react'

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
}

export function DataTable<TRow>({
  columns,
  rows,
  getRowKey,
  emptyContent,
}: DataTableProps<TRow>) {
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
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
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
