import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { DataTable, type DataTableColumn } from '@/components/composed/data-table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type PaginatedDataTableProps<TRow> = {
  columns: DataTableColumn<TRow>[]
  rows: TRow[]
  getRowKey: (row: TRow, index: number) => string
  page: number
  pageSize: number
  total: number
  onPageChange: (nextPage: number) => void
  emptyContent?: ReactNode
  isLoading?: boolean
  columnSelectorLabel?: string
  goToPageLabel?: string
  pageLabel?: string
  rowsLabel?: string
  prevLabel?: string
  nextLabel?: string
  goLabel?: string
  toggleColumnsLabel?: string
  loadingLabel?: string
  selectAllColumnsLabel?: string
  deselectAllColumnsLabel?: string
}

export function PaginatedDataTable<TRow>({
  columns,
  rows,
  getRowKey,
  page,
  pageSize,
  total,
  onPageChange,
  emptyContent,
  isLoading = false,
  columnSelectorLabel = 'Columns',
  goToPageLabel = 'Go to',
  pageLabel = 'Page',
  rowsLabel = 'rows',
  prevLabel = 'Prev',
  nextLabel = 'Next',
  goLabel = 'Go',
  toggleColumnsLabel = 'Toggle columns',
  selectAllColumnsLabel = 'Select all',
  deselectAllColumnsLabel = 'Deselect all',
}: PaginatedDataTableProps<TRow>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages
  const pageNumbers = buildPageNumbers(page, totalPages)
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(
    columns.map((column) => column.key),
  )
  const [goToInput, setGoToInput] = useState(String(page))

  useEffect(() => {
    setGoToInput(String(page))
  }, [page])

  useEffect(() => {
    setVisibleColumnKeys((prev) => {
      const valid = new Set(columns.map((column) => column.key))
      const filtered = prev.filter((key) => valid.has(key))
      return filtered.length ? filtered : columns.map((column) => column.key)
    })
  }, [columns])

  const visibleColumns = useMemo(() => {
    const allowed = new Set(visibleColumnKeys)
    return columns.filter((column) => allowed.has(column.key))
  }, [columns, visibleColumnKeys])
  const allColumnsSelected = visibleColumnKeys.length === columns.length

  const skeletonRows = Math.min(Math.max(rows.length || pageSize, 6), 10)

  const applyGoToPage = () => {
    const parsed = Number.parseInt(goToInput, 10)
    if (!Number.isFinite(parsed)) return
    const next = Math.min(Math.max(parsed, 1), totalPages)
    onPageChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-text-tertiary">
          {pageLabel} {page} of {totalPages} · {total} {rowsLabel}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button type="button" variant="outline" size="sm">
              {columnSelectorLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{toggleColumnsLabel}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setVisibleColumnKeys(columns.map((column) => column.key))}
                disabled={allColumnsSelected}
              >
                {selectAllColumnsLabel}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setVisibleColumnKeys(columns.length ? [columns[0].key] : [])}
                disabled={visibleColumnKeys.length <= 1}
              >
                {deselectAllColumnsLabel}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {columns.map((column) => {
                const checked = visibleColumnKeys.includes(column.key)
                return (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={checked}
                    onCheckedChange={(value) => {
                      setVisibleColumnKeys((prev) => {
                        if (value) {
                          return prev.includes(column.key) ? prev : [...prev, column.key]
                        }
                        if (prev.length <= 1) return prev
                        return prev.filter((key) => key !== column.key)
                      })
                    }}
                  >
                    {column.header}
                  </DropdownMenuCheckboxItem>
                )
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative">
        {isLoading ? (
          <div className="rounded-md border border-border-subtle/60 bg-bg-surface/72 p-3">
            <div className="space-y-2">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${Math.max(visibleColumns.length, 1)}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: Math.max(visibleColumns.length, 1) }).map((_, index) => (
                  <div key={`head-${index}`} className="h-3.5 animate-pulse rounded bg-white/8" />
                ))}
              </div>
              {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className="grid items-center gap-2 rounded-md border border-border-subtle/20 bg-white/2 px-2 py-2"
                  style={{ gridTemplateColumns: `repeat(${Math.max(visibleColumns.length, 1)}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: Math.max(visibleColumns.length, 1) }).map((_, colIndex) => (
                    <div key={`cell-${rowIndex}-${colIndex}`} className="h-3.5 animate-pulse rounded bg-white/10" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <DataTable
            columns={visibleColumns}
            rows={rows}
            getRowKey={getRowKey}
            emptyContent={emptyContent}
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">{goToPageLabel}</span>
          <Input
            value={goToInput}
            onChange={(event) => setGoToInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                applyGoToPage()
              }
            }}
            className="h-8 w-20 text-center"
            inputMode="numeric"
          />
          <Button type="button" variant="outline" size="sm" onClick={applyGoToPage} disabled={isLoading}>
            {goLabel}
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canPrev || isLoading}
          >
            {prevLabel}
          </Button>
          {pageNumbers.map((item, index) =>
            typeof item === 'number' ? (
              <Button
                key={`page-${item}`}
                type="button"
                variant={item === page ? 'default' : 'outline'}
                size="sm"
                className={cn('min-w-9 px-2', item === page && 'pointer-events-none')}
                onClick={() => onPageChange(item)}
                disabled={isLoading}
              >
                {item}
              </Button>
            ) : (
              <span key={`ellipsis-${index}`} className="px-1 text-xs text-text-tertiary">
                ...
              </span>
            )
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canNext || isLoading}
          >
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function buildPageNumbers(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages]
  }
  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages]
}
