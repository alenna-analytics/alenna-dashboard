import { flexRender, type Table as TableType } from "@tanstack/react-table"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/ui/skeleton"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table"

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
  footer?: React.ReactNode
}

export function DataTable<TData>({
  table,
  isLoading,
  isFetching,
  hasEverLoaded,
  emptyContent,
  skeletonRowCount = 10,
  scrollClassName = "max-h-[22rem] overflow-auto",
  toolbar,
  footer,
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows
  const showSkeleton = isLoading && !hasEverLoaded
  const showOverlay = isFetching && hasEverLoaded
  const showEmpty = !isLoading && hasEverLoaded && rows.length === 0

  return (
    <div className="relative rounded-md border border-border-subtle bg-bg-section shadow-[var(--shadow-ink-xs)]">
      {showOverlay ? (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-md bg-bg-section/55 backdrop-blur-[1px]"
          aria-busy
          aria-label="Loading"
        >
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : null}

      {toolbar ? (
        <div className="flex min-h-10 items-center gap-2 border-b border-border-subtle bg-glass-fill-raised px-3 py-2">
          {toolbar}
        </div>
      ) : null}

      {/* Single scrollport so thead `position: sticky` stays fixed while tbody scrolls. */}
      <div className={cn("relative w-full", scrollClassName)}>
        <table className="w-full caption-bottom border-separate border-spacing-0 text-sm">
          <TableHeader className="[&_tr]:border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className="sticky top-0 z-10 bg-glass-fill-raised shadow-[0_1px_0_var(--border-subtle)]"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showSkeleton
              ? Array.from({ length: skeletonRowCount }).map((_, i) => (
                  <TableRow key={`sk-${i}`} className="hover:bg-transparent">
                    {table.getVisibleFlatColumns().map((col) => (
                      <TableCell key={col.id}>
                        <Skeleton className="h-8 w-full max-w-48" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
            {!showSkeleton && showEmpty ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={table.getVisibleFlatColumns().length} className="h-32 text-center">
                  {emptyContent}
                </TableCell>
              </TableRow>
            ) : null}
            {!showSkeleton && !showEmpty
              ? rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
          </TableBody>
        </table>
      </div>
      {footer}
    </div>
  )
}
