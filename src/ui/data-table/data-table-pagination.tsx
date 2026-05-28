import { useEffect, useState } from "react"
import type { Table as TableType } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { cn } from "@/lib/utils"

import { getPaginationPageItems } from "./data-table-pagination-items"

type DataTablePaginationLabels = {
  ariaPrevious: string
  ariaNext: string
  pageStatus: (page: number, totalPages: number) => string
  pageButtonAria: (page: number, totalPages: number) => string
  goToPageLabel: string
  goToPageAria: string
}

type DataTablePaginationProps<TData> = {
  table: TableType<TData>
  labels: DataTablePaginationLabels
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

  const [goToDraft, setGoToDraft] = useState(String(pageIndex + 1))

  useEffect(() => {
    setGoToDraft(String(pageIndex + 1))
  }, [pageIndex])

  const commitGoToPage = () => {
    const parsed = Number.parseInt(goToDraft.trim(), 10)
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > pageCount) {
      setGoToDraft(String(pageIndex + 1))
      return
    }
    table.setPageIndex(parsed - 1)
  }

  const navCtl =
    "size-7 min-w-7 shrink-0 border-0 bg-transparent px-0 text-foreground shadow-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring hover:bg-[color-mix(in_srgb,var(--bg-section)_72%,white_28%)] [&_svg]:pointer-events-none [&_svg]:size-3.5"
  const arrowBtn = `${navCtl} rounded-sm`
  const pageBtn = `${navCtl} rounded-full text-xs font-medium tabular-nums leading-none`

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t border-border-subtle bg-glass-fill-raised px-3 py-3 sm:flex-row rounded-b-md",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground sm:text-sm">{`Total: ${totalItems}`}</p>
      <div className="flex max-w-full flex-wrap items-center justify-end gap-3">
        <div className="inline-flex flex-nowrap items-center gap-1 overflow-hidden">
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
                  "pointer-events-none flex items-center justify-center text-muted-foreground",
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
                    : "bg-transparent",
                )}
                onClick={() => table.setPageIndex(item)}
                aria-label={labels.pageButtonAria(item + 1, pageCount)}
                aria-current={item === pageIndex ? "page" : undefined}
              >
                {item + 1}
              </Button>
            ),
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

        {pageCount > 1 ? (
          <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault()
              commitGoToPage()
            }}
          >
            <label htmlFor="table-go-to-page" className="sr-only">
              {labels.goToPageAria}
            </label>
            <span className="shrink-0 text-xs text-muted-foreground">{labels.goToPageLabel}</span>
            <Input
              id="table-go-to-page"
              type="number"
              min={1}
              max={pageCount}
              inputMode="numeric"
              value={goToDraft}
              onChange={(e) => setGoToDraft(e.target.value)}
              onBlur={commitGoToPage}
              aria-label={labels.goToPageAria}
              className="h-7 w-14 px-2 text-center text-xs tabular-nums"
            />
          </form>
        ) : null}
      </div>
    </div>
  )
}
