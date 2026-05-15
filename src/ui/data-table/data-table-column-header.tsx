import type { Column } from "@tanstack/react-table"
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>
  title: string
  className?: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sortIconMuted = "size-3.5 shrink-0 opacity-60"

  if (!column.getCanSort()) {
    return (
      <div
        className={cn(
          "flex w-full min-w-0 items-center text-sm font-semibold text-text-secondary",
          className,
        )}
      >
        {title}
      </div>
    )
  }

  const sorted = column.getIsSorted()

  return (
    <div className={cn("flex w-full min-w-0 items-center gap-1", className)}>
      <button
        type="button"
        className="-ml-1.5 inline-flex h-8 shrink-0 items-center gap-1 rounded-sm px-2 text-sm font-semibold whitespace-nowrap text-text-secondary outline-none transition-colors hover:bg-muted/45 hover:text-text-primary focus-visible:border focus-visible:border-border-default focus-visible:ring-2 focus-visible:ring-ring/30"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>{title}</span>
        {sorted === "asc" ? (
          <>
            <span className="sr-only">, ascending</span>
            <ChevronUp className={sortIconMuted} aria-hidden />
          </>
        ) : sorted === "desc" ? (
          <>
            <span className="sr-only">, descending</span>
            <ChevronDown className={sortIconMuted} aria-hidden />
          </>
        ) : (
          <ChevronsUpDown className={sortIconMuted} aria-hidden />
        )}
      </button>
    </div>
  )
}
