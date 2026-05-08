import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Columns3 } from "lucide-react"

import type { ShellStringKey } from "@/lib/i18n/shell-strings"
import { Button } from "@/ui/button"
import { DataTable } from "@/ui/data-table/data-table"
import { DataTablePagination } from "@/ui/data-table/data-table-pagination"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu"

import { createProductColumns } from "./products-columns"
import { useProductListQuery } from "./use-catalog-queries"
import { useMoney } from "@/hooks/use-money"

const PAGE_SIZE = 10
const WATCH_STORAGE_KEY = "alenna.catalog.productWatchIds.v1"
const COLUMN_LABEL_KEY_BY_ID = {
  image: "productsColImage",
  title: "productsColProduct",
  status: "productsColStatus",
  platforms: "productsColChannels",
  brand: "productsColBrand",
  internal_sku: "productsColSku",
  cost: "productsColCost",
  listing_count: "productsColListings",
  created_at: "productsTableColCreated",
} as const

function readWatchedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(WATCH_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === "string"))
  } catch {
    return new Set()
  }
}

type ProductsDataTableProps = {
  searchQ: string
  onSearchQChange: (value: string) => void
  t: (key: ShellStringKey) => string
  emptyContent: React.ReactNode
  errorContent: React.ReactNode
}

export function ProductsDataTable({
  searchQ,
  onSearchQChange,
  t,
  emptyContent,
  errorContent,
}: ProductsDataTableProps) {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [sorting, setSorting] = useState<SortingState>([{ id: "title", desc: false }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    created_at: false,
    listing_count: false,
  })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [watchedIds, setWatchedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setWatchedIds(readWatchedIds())
  }, [])

  const sort = sorting[0]
  const sortBy = sort?.id ?? "title"
  const sortDir: "asc" | "desc" = sort?.desc ? "desc" : "asc"

  const [debouncedSearchQ, setDebouncedSearchQ] = useState(searchQ)
  useEffect(() => {
    if (searchQ.trim() === "") {
      setDebouncedSearchQ("")
      return
    }
    const id = window.setTimeout(() => setDebouncedSearchQ(searchQ), 350)
    return () => window.clearTimeout(id)
  }, [searchQ])

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [debouncedSearchQ, sortBy, sortDir])

  useEffect(() => {
    setRowSelection({})
  }, [debouncedSearchQ])

  const listQuery = useProductListQuery({
    q: debouncedSearchQ,
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
    sortBy,
    sortDir,
  })
  const { refetch } = listQuery

  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0
  const baseCurrency = listQuery.data?.base_currency ?? "USD"
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize))
  const { format: formatMoney } = useMoney()
  const formatBaseMoney = useCallback(
    (value: number) => formatMoney(value, { nativeCurrency: baseCurrency }),
    [formatMoney, baseCurrency],
  )

  const onToggleWatch = useCallback((productId: string) => {
    setWatchedIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      try {
        localStorage.setItem(WATCH_STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        return prev
      }
      return next
    })
  }, [])

  const onCopySku = useCallback(async (sku: string | null) => {
    if (!sku?.trim()) return
    try {
      await navigator.clipboard.writeText(sku)
    } catch {
      /* ignore */
    }
  }, [])

  const onGoDetail = useCallback(
    (productId: string) => {
      void navigate(`/dashboard/products/${productId}`)
    },
    [navigate]
  )

  const columns = useMemo(
    () =>
      createProductColumns({
        t,
        formatBaseMoney,
        watchedIds,
        onToggleWatch,
        onCopySku,
        onRefresh: () => {
          void refetch()
        },
        onGoDetail,
      }),
    [t, formatBaseMoney, watchedIds, onToggleWatch, onCopySku, refetch, onGoDetail]
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: items,
    columns,
    state: { pagination, sorting, columnVisibility, rowSelection },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount,
    rowCount: total,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    enableSortingRemoval: false,
  })

  const selectedCount = table.getSelectedRowModel().rows.length
  const getColumnLabel = useCallback(
    (columnId: string) => {
      const key = COLUMN_LABEL_KEY_BY_ID[columnId as keyof typeof COLUMN_LABEL_KEY_BY_ID]
      return key ? t(key) : columnId
    },
    [t]
  )

  if (listQuery.isError) {
    return <div className="rounded-md border border-border-subtle bg-bg-section px-4 py-10 text-sm">{errorContent}</div>
  }

  return (
    <div className="flex flex-col gap-3">
      <DataTable
        table={table}
        isLoading={listQuery.isLoading}
        isFetching={listQuery.isFetching}
        hasEverLoaded={listQuery.data !== undefined}
        emptyContent={emptyContent}
        skeletonRowCount={PAGE_SIZE}
        toolbar={
          <div className="flex min-w-0 items-center gap-2">
            {selectedCount > 0 ? (
              <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-glass-fill-muted px-3 py-1 text-xs font-medium text-text-primary">
                <span>
                  {selectedCount} {t("productsTableSelected")}
                </span>
                <Button type="button" variant="ghost" size="xs" onClick={() => setRowSelection({})}>
                  {t("productsTableClearSelection")}
                </Button>
              </div>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-full border border-transparent text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
                aria-label={t("productsTableColumns")}
              >
                <Columns3 className="size-4 shrink-0" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t("productsTableColumns")}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {table
                    .getAllColumns()
                    .filter((col) => col.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {getColumnLabel(column.id)}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        search={{
          value: searchQ,
          onChange: onSearchQChange,
          placeholder: t("productsSearchPlaceholder"),
          ariaLabel: t("productsSearchPlaceholder"),
          clearAriaLabel: t("productsSearchClearAria"),
        }}
        footer={
          <DataTablePagination
            table={table}
            labels={{
              ariaPrevious: t("productsTablePrev"),
              ariaNext: t("productsTableNext"),
              pageStatus: (page, totalPages) =>
                `${t("productsTablePageLabel")} ${page} ${t("productsTableOf")} ${totalPages}`,
              pageButtonAria: (page, totalPages) =>
                `${t("productsTablePageLabel")} ${page} ${t("productsTableOf")} ${totalPages}`,
            }}
          />
        }
      />
    </div>
  )
}
