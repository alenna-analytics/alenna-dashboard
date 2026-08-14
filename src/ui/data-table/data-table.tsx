import { flexRender, type Table as TableType } from "@tanstack/react-table"
import { Fragment, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/ui/skeleton"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"

type ColumnMetaWithCellClass = {
  cellClassName?: string
  headerClassName?: string
}

type DataTableProps<TData> = {
  table: TableType<TData>
  isLoading: boolean
  isFetching: boolean
  hasEverLoaded: boolean
  emptyContent: ReactNode
  skeletonRowCount?: number
  /** Max height so ~8 rows are visible with vertical scroll (page size may be 10). */
  scrollClassName?: string
  /** `card` (default) keeps bordered section shell; `plain` is borderless for flat analytics layouts. */
  variant?: 'card' | 'plain'
  /** Compact grid (Supabase-style): 12px type, tighter rows, cell borders. */
  density?: 'default' | 'compact'
  /** Compact tables hug content by default; `full` stretches to the container. */
  tableWidth?: 'content' | 'full'
  /** Renders above the table (outside the card), e.g. bulk selection. */
  toolbar?: ReactNode
  /** Renders in the toolbar row on the left (e.g. bulk selection summary). */
  selectionBanner?: ReactNode
  footer?: ReactNode
  onRowClick?: (row: TData) => void
  expandedRowIds?: ReadonlySet<string>
  renderExpandedContent?: (row: TData) => ReactNode
}

export function DataTable<TData>({
  table,
  isLoading,
  isFetching,
  hasEverLoaded,
  emptyContent,
  skeletonRowCount = 10,
  scrollClassName = "max-h-[32rem] overflow-auto",
  variant = 'card',
  density = 'default',
  tableWidth = 'content',
  toolbar,
  selectionBanner,
  footer,
  onRowClick,
  expandedRowIds,
  renderExpandedContent,
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows
  const showSkeleton = isLoading && !hasEverLoaded
  const showOverlay = isFetching && hasEverLoaded
  const showEmpty = !isLoading && hasEverLoaded && rows.length === 0
  const isPlain = variant === 'plain'
  const isCompact = density === 'compact'
  const stretchTable = !isCompact || tableWidth === 'full'

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      {toolbar || selectionBanner ? (
        <div className="flex min-h-8 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {selectionBanner}
          </div>
          {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
        </div>
      ) : null}

      <div
        className={cn(
          'relative',
          isCompact
            ? cn(
                'overflow-x-auto rounded-md border border-border-subtle bg-background',
                stretchTable ? 'w-full' : 'w-max max-w-full',
              )
            : isPlain
              ? 'w-full overflow-x-auto'
              : 'overflow-hidden rounded-md border border-border-subtle bg-bg-section',
        )}
      >
        <div className={cn('relative w-full', scrollClassName)}>
        {showOverlay ? (
          <div
            className="pointer-events-none sticky top-0 z-30 h-[3px] overflow-hidden bg-[color-mix(in_srgb,var(--color-accent-forest)_18%,var(--border-subtle))]"
            aria-hidden
          >
            <div className="h-full w-[38%] rounded-full bg-[var(--color-accent-forest)] connector-sync-indeterminate-bar" />
          </div>
        ) : null}
        {showEmpty && !showSkeleton ? (
          <div
            className={cn(
              'flex items-center justify-center',
              isCompact ? 'min-h-[10rem]' : 'min-h-[22rem]',
              isPlain && !isCompact ? 'bg-transparent' : 'bg-white',
            )}
          >
            {emptyContent}
          </div>
        ) : (
        <table
          className={cn(
            'caption-bottom border-separate border-spacing-0',
            isCompact ? cn('text-xs', stretchTable ? 'w-full' : 'w-max min-w-0') : 'w-full text-sm',
          )}
        >
          <TableHeader className="[&_tr]:border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as ColumnMetaWithCellClass | undefined
                  const sort = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      aria-sort={
                        header.column.getCanSort()
                          ? sort === 'asc'
                            ? 'ascending'
                            : sort === 'desc'
                              ? 'descending'
                              : 'none'
                          : undefined
                      }
                      className={cn(
                        "sticky top-0 z-10 align-middle font-medium text-muted-foreground",
                        isCompact
                          ? "h-9 border-0 border-r border-b border-border-subtle px-2.5 py-0 last:border-r-0 shadow-none bg-[var(--table-row-hover-bg)]"
                          : cn(
                              "border-0 shadow-[0_1px_0_var(--border-subtle)]",
                              isPlain ? "bg-transparent" : "bg-[var(--table-row-hover-bg)]",
                            ),
                        meta?.headerClassName,
                      )}
                    >
                      <div
                        className={cn(
                          "flex w-full items-center font-medium leading-none text-muted-foreground",
                          isCompact ? "min-h-9 text-xs" : "min-h-10 text-xs",
                        )}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={cn(showOverlay && "pointer-events-none opacity-55")}>
            {showSkeleton
              ? Array.from({ length: skeletonRowCount }).map((_, i) => (
                <TableRow
                  key={`sk-${i}`}
                  className={cn(
                    'hover:bg-transparent data-[state=selected]:bg-transparent',
                    isPlain ? 'bg-transparent' : 'bg-white hover:bg-white data-[state=selected]:bg-white',
                  )}
                >
                  {table.getVisibleFlatColumns().map((col) => (
                    <TableCell
                      key={col.id}
                      className={cn(
                        isCompact &&
                          'h-9 border-0 border-r border-b border-border-subtle px-2.5 py-0 last:border-r-0',
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center leading-normal',
                          isCompact ? 'min-h-9 text-xs' : 'min-h-10 text-sm',
                        )}
                      >
                        <Skeleton className="h-[1.125rem] w-full max-w-48 rounded-md" />
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
              : null}
            {!showSkeleton
              ? rows.map((row) => {
                const isExpanded = expandedRowIds?.has(row.id) ?? false
                const colSpan = table.getVisibleFlatColumns().length
                return (
                  <Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      className={cn(
                        "group",
                        isCompact
                          ? "border-0 bg-background hover:bg-[var(--table-row-hover-bg)] data-[state=selected]:bg-[var(--table-row-hover-bg)]"
                          : isPlain
                            ? "bg-transparent hover:bg-[var(--table-row-hover-bg)] data-[state=selected]:bg-[var(--table-row-hover-bg)]"
                            : "bg-white hover:bg-[var(--table-row-hover-bg)] data-[state=selected]:bg-[var(--table-row-hover-bg)]",
                        onRowClick && "cursor-pointer",
                      )}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as ColumnMetaWithCellClass | undefined
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              isCompact &&
                                'h-9 border-0 border-r border-b border-border-subtle px-2.5 py-0 last:border-r-0',
                              meta?.cellClassName,
                            )}
                          >
                            <div
                              className={cn(
                                'flex w-full items-center leading-normal [&:has([role=checkbox])]:[&_input]:self-center',
                                isCompact ? 'min-h-9 text-xs' : 'min-h-10 text-sm',
                              )}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    {isExpanded && renderExpandedContent ? (
                      <TableRow
                        key={`${row.id}-detail`}
                        className={cn(
                          isPlain ? 'bg-transparent' : 'bg-[color-mix(in_srgb,var(--bg-section)_80%,white)]',
                        )}
                      >
                        <TableCell colSpan={colSpan} className="py-3">
                          {renderExpandedContent(row.original)}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                )
              })
              : null}
          </TableBody>
        </table>
        )}
      </div>
      </div>
      {footer ? (
        <div className={cn(showOverlay && 'pointer-events-none opacity-55')}>{footer}</div>
      ) : null}
    </div>
  )
}
