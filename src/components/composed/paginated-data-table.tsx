import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  /** When set, renders a custom row list instead of a table (pagination unchanged). */
  renderRow?: (row: TRow, index: number) => ReactNode
  /** Applied to the scrollable list body in list mode (e.g. max height + overflow). */
  listBodyClassName?: string
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
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSortChange?: (key: string) => void
}

export function PaginatedDataTable<TRow>({
  columns,
  rows,
  getRowKey,
  renderRow,
  listBodyClassName,
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
  sortBy,
  sortDir,
  onSortChange,
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
  const listMode = Boolean(renderRow)

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
        {listMode ? null : (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" />}>
            {columnSelectorLabel}
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
        )}
      </div>

      <div className="relative">
        {isLoading && rows.length === 0 ? (
          <div className="rounded-xl border border-border-subtle/60 bg-bg-surface/72 p-2">
            {listMode ? (
              <div
                className={cn(
                  'divide-y divide-border-subtle/50',
                  listBodyClassName,
                )}
              >
                {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                  <div key={`sk-${rowIndex}`} className="flex items-center gap-4 px-3 py-4">
                    <div className="size-12 shrink-0 animate-pulse rounded-xl bg-white/10" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-2/5 max-w-xs animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-1/4 animate-pulse rounded bg-white/8" />
                    </div>
                    <div className="hidden h-4 w-16 animate-pulse rounded bg-white/8 sm:block" />
                  </div>
                ))}
              </div>
            ) : (
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
            )}
          </div>
        ) : rows.length === 0 && emptyContent ? (
          <div className="rounded-xl border border-border-subtle/60 bg-bg-surface/40 px-4 py-12 text-center text-sm text-text-secondary">
            {emptyContent}
          </div>
        ) : listMode && renderRow ? (
          <>
            <div className="overflow-hidden rounded-xl border border-border-subtle/70 bg-muted/15 shadow-sm">
              <div
                className={cn('divide-y divide-border-subtle/60', listBodyClassName)}
              >
                {rows.map((row, index) => (
                  <div
                    key={getRowKey(row, index)}
                    className="transition-[background-color] duration-150 hover:bg-muted/45"
                  >
                    {renderRow(row, index)}
                  </div>
                ))}
              </div>
            </div>
            {isLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/18 backdrop-blur-[1px]">
                <div
                  className="size-7 animate-spin rounded-full border-2 border-accent/35 border-t-accent"
                  aria-label="loading"
                />
              </div>
            ) : null}
          </>
        ) : (
          <>
            <DataTable
              columns={visibleColumns}
              rows={rows}
              getRowKey={getRowKey}
              emptyContent={emptyContent}
              sortBy={sortBy}
              sortDir={sortDir}
              onSortChange={onSortChange}
            />
            {isLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-black/18 backdrop-blur-[1px]">
                <div
                  className="size-7 animate-spin rounded-full border-2 border-accent/35 border-t-accent"
                  aria-label="loading"
                />
              </div>
            ) : null}
          </>
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
          <Button type="button" variant="outline" size="sm" onClick={applyGoToPage}>
            {goLabel}
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={!canPrev}
            aria-label={prevLabel}
            title={prevLabel}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">{prevLabel}</span>
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
                disabled={false}
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
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={!canNext}
            aria-label={nextLabel}
            title={nextLabel}
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">{nextLabel}</span>
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
