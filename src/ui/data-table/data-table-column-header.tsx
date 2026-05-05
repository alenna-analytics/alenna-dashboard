import type { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"

import { Button } from "@/ui/button"
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
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="-ml-1.5 h-8 px-2 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>{title}</span>
        {column.getIsSorted() === "desc" ? (
          <ArrowDown className="size-3.5 shrink-0" aria-hidden />
        ) : column.getIsSorted() === "asc" ? (
          <ArrowUp className="size-3.5 shrink-0" aria-hidden />
        ) : (
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
        )}
      </Button>
    </div>
  )
}
