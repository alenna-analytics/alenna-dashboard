import { flexRender, type Table as TableType } from "@tanstack/react-table"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/ui/input"
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
  emptyContent: React.ReactNode
  skeletonRowCount?: number
  /** Max height so ~8 rows are visible with vertical scroll (page size may be 10). */
  scrollClassName?: string
  /** Renders inside the card above the scroll area (e.g. toolbar with column visibility). */
  toolbar?: React.ReactNode
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    ariaLabel?: string
    className?: string
  }
  footer?: React.ReactNode
}

export function DataTable<TData>({
  table,
  isLoading,
  isFetching,
  hasEverLoaded,
  emptyContent,
  skeletonRowCount = 10,
  scrollClassName = "max-h-[32rem] overflow-auto",
  toolbar,
  search,
  footer,
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows
  const showSkeleton = isLoading && !hasEverLoaded
  const showOverlay = isFetching && hasEverLoaded
  const showEmpty = !isLoading && hasEverLoaded && rows.length === 0

  return (
    <div className="relative rounded-md border border-border-subtle bg-bg-section shadow-[var(--shadow-ink-xs)]">
      {toolbar || search ? (
        <div className="flex min-h-10 items-center justify-between gap-2 border-b border-border-subtle rounded-t-md bg-white px-3 py-2">
          <div className="min-w-0 flex-1">
            {search ? (
              <div className={cn("relative w-full max-w-xs", search.className)}>
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 z-20 size-4 -translate-y-1/2 text-[var(--ink)]/55"
                  aria-hidden
                />
                <Input
                  value={search.value}
                  onChange={(e) => search.onChange(e.target.value)}
                  placeholder={search.placeholder}
                  aria-label={search.ariaLabel}
                  className="relative z-0 h-8 border-border-subtle bg-glass-fill-raised pl-8 focus-visible:border-border-subtle focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            ) : null}
          </div>
          <div className="shrink-0">{toolbar}</div>
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
                        "sticky top-0 z-10 bg-glass-fill-raised shadow-[0_1px_0_var(--border-subtle)]",
                        meta?.headerClassName,
                      )}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                  className="bg-white hover:bg-white data-[state=selected]:bg-white"
                >
                  {table.getVisibleFlatColumns().map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton className="h-4 w-full max-w-48 rounded-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
              : null}
            {!showSkeleton && showEmpty ? (
              <TableRow className="bg-white hover:bg-white data-[state=selected]:bg-white">
                <TableCell colSpan={table.getVisibleFlatColumns().length} className="h-32 text-center">
                  {emptyContent}
                </TableCell>
              </TableRow>
            ) : null}
            {!showSkeleton && !showEmpty
              ? rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="bg-white hover:bg-[color-mix(in_srgb,var(--bg-section)_38%,white_62%)] data-[state=selected]:bg-[color-mix(in_srgb,var(--bg-section)_45%,white_55%)]"
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as ColumnMetaWithCellClass | undefined
                    return (
                      <TableCell key={cell.id} className={meta?.cellClassName}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
              : null}
          </TableBody>
        </table>
      </div>
      <div className={cn(showOverlay && "pointer-events-none opacity-55")}>{footer}</div>
    </div>
  )
}
