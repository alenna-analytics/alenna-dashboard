import type { Table as TableType } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/ui/button"
import { cn } from "@/lib/utils"

/** 0-based page indices and ellipsis markers for compact pagination UI. */
function getPaginationPageItems(pageIndex: number, pageCount: number): (number | "ellipsis")[] {
  if (pageCount <= 1) return [0]
  if (pageCount <= 9) {
    return Array.from({ length: pageCount }, (_, i) => i)
  }
  const last = pageCount - 1
  const left = Math.max(1, pageIndex - 1)
  const right = Math.min(last - 1, pageIndex + 1)
  const items: (number | "ellipsis")[] = [0]
  if (left > 1) items.push("ellipsis")
  for (let i = left; i <= right; i++) {
    items.push(i)
  }
  if (right < last - 1) items.push("ellipsis")
  items.push(last)
  const out: (number | "ellipsis")[] = []
  for (const x of items) {
    if (x === "ellipsis" && out[out.length - 1] === "ellipsis") continue
    out.push(x)
  }
  return out
}

type DataTablePaginationProps<TData> = {
  table: TableType<TData>
  labels: {
    ariaPrevious: string
    ariaNext: string
    pageStatus: (page: number, totalPages: number) => string
    /** Short label for numbered page button (e.g. "Page 3 of 10"). */
    pageButtonAria: (page: number, totalPages: number) => string
  }
  className?: string
}

export function DataTablePagination<TData>({
  table,
  labels,
  className,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex
  const pageCount = table.getPageCount()
  const totalItems = table.getRowCount()
  const pageItems = getPaginationPageItems(pageIndex, pageCount)

  const baseBtn =
    "size-7 min-w-7 shrink-0 border-0 bg-transparent px-0 text-foreground shadow-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring hover:bg-[color-mix(in_srgb,var(--bg-section)_72%,white_28%)] [&_svg]:pointer-events-none [&_svg]:size-4"
  const pageBtn = `${baseBtn} rounded-full font-medium tabular-nums`
  const arrowBtn = `${baseBtn} rounded-sm`

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t border-border-subtle px-3 py-3 sm:flex-row bg-glass-fill-raised rounded-b-md",
        className
      )}
    >
      <p className="text-xs text-muted-foreground sm:text-sm">{`Total: ${totalItems}`}</p>
      <div className="inline-flex max-w-full flex-nowrap items-center gap-1 overflow-hidden">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className={arrowBtn}
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label={labels.ariaPrevious}
        >
          <ChevronLeft />
        </Button>
        {pageItems.map((item, idx) =>
          item === "ellipsis" ? (
            <span
              key={`e-${idx}`}
              className={cn(
                pageBtn,
                "pointer-events-none flex items-center justify-center text-muted-foreground"
              )}
              aria-hidden
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant="outline"
              size="icon-sm"
              className={cn(
                pageBtn,
                item === pageIndex
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary"
                  : "bg-transparent"
              )}
              onClick={() => table.setPageIndex(item)}
              aria-label={labels.pageButtonAria(item + 1, pageCount)}
              aria-current={item === pageIndex ? "page" : undefined}
            >
              {item + 1}
            </Button>
          )
        )}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className={arrowBtn}
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label={labels.ariaNext}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
