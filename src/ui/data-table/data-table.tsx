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
  /** Renders inside the card above the scroll area (e.g. toolbar with column visibility). */
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

  return (
    <div
      className={cn(
        'relative',
        isPlain
          ? 'w-full overflow-x-auto'
          : 'overflow-hidden rounded-md border border-border-subtle bg-bg-section',
      )}
    >
      {toolbar || selectionBanner ? (
        <div
          className={cn(
            'flex h-10 items-center justify-between gap-2 border-b border-border-subtle px-3',
            isPlain
              ? 'bg-transparent'
              : cn(
                  'rounded-t-md',
                  selectionBanner
                    ? 'bg-[color-mix(in_srgb,var(--zara-base)_22%,white)]'
                    : 'bg-white',
                ),
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {selectionBanner}
          </div>
          {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
        </div>
      ) : null}

      {/* Single scrollport so thead `position: sticky` stays fixed while tbody scrolls. */}
      <div className={cn("relative w-full", scrollClassName)}>
        {showOverlay ? (
          <div
            className="pointer-events-none sticky top-0 z-30 h-[3px] overflow-hidden bg-[color-mix(in_srgb,var(--color-accent-forest)_18%,var(--border-subtle))]"
            aria-hidden
          >
            <div className="h-full w-[38%] rounded-full bg-[var(--color-accent-forest)] connector-sync-indeterminate-bar" />
          </div>
        ) : null}
        <table className="w-full caption-bottom border-separate border-spacing-0 text-sm">
          <TableHeader className="[&_tr]:border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as ColumnMetaWithCellClass | undefined
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        "sticky top-0 z-10 border-0 align-middle shadow-[0_1px_0_var(--border-subtle)] font-medium text-muted-foreground",
                        isPlain ? "bg-transparent" : "bg-[var(--table-row-hover-bg)]",
                        meta?.headerClassName,
                      )}
                    >
                      <div className="flex min-h-10 w-full items-center text-xs font-medium leading-none text-muted-foreground">
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
                    <TableCell key={col.id}>
                      <div className="flex min-h-10 items-center text-sm leading-normal">
                        <Skeleton className="h-[1.125rem] w-full max-w-48 rounded-md" />
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
              : null}
            {!showSkeleton && showEmpty ? (
              <TableRow
                className={cn(
                  'hover:bg-transparent data-[state=selected]:bg-transparent',
                  isPlain ? 'bg-transparent' : 'bg-white hover:bg-white data-[state=selected]:bg-white',
                )}
              >
                <TableCell colSpan={table.getVisibleFlatColumns().length} className="h-32 text-center">
                  {emptyContent}
                </TableCell>
              </TableRow>
            ) : null}
            {!showSkeleton && !showEmpty
              ? rows.map((row) => {
                const isExpanded = expandedRowIds?.has(row.id) ?? false
                const colSpan = table.getVisibleFlatColumns().length
                return (
                  <Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      className={cn(
                        "group",
                        isPlain
                          ? "bg-transparent hover:bg-[var(--table-row-hover-bg)] data-[state=selected]:bg-[var(--table-row-hover-bg)]"
                          : "bg-white hover:bg-[var(--table-row-hover-bg)] data-[state=selected]:bg-[var(--table-row-hover-bg)]",
                        onRowClick && "cursor-pointer",
                      )}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as ColumnMetaWithCellClass | undefined
                        return (
                          <TableCell key={cell.id} className={meta?.cellClassName}>
                            <div className="flex min-h-10 w-full items-center text-sm leading-normal [&:has([role=checkbox])]:[&_input]:self-center">
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
      </div>
      <div className={cn(showOverlay && "pointer-events-none opacity-55")}>{footer}</div>
    </div>
  )
}
