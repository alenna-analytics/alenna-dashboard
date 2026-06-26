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
import { Columns3, X } from "lucide-react"

import type { ShellStringKey } from "@/lib/i18n/shell-strings"
import type { ProductSummaryApi } from "@/lib/types/catalog"
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
import { useMoney } from "@/hooks/use-money"
import { useLanguage } from "@/shell/providers/language-provider"

import { createProductColumns, type ProductTableSelectionBinding } from "./products-columns"
import { ProductCostEditorSheet } from "./product-cost-editor-sheet"
import { writeBulkCogsScope } from "./bulk-cogs/bulk-cogs-scope"
import {
  normalizeStockAlertLevelsFilter,
  type ProductsListFiltersState,
} from "./products-list-filter-state"
import { useProductListQuery } from "./use-catalog-queries"

const PAGE_SIZE = 10
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

const EMPTY_ITEMS: ProductSummaryApi[] = []

type ProductsDataTableProps = {
  searchQ: string
  onSearchQChange: (value: string) => void
  filters: ProductsListFiltersState
  t: (key: ShellStringKey) => string
  emptyContent: React.ReactNode
  errorContent: React.ReactNode
}

export function ProductsDataTable({
  searchQ,
  onSearchQChange,
  filters,
  t,
  emptyContent,
  errorContent,
}: ProductsDataTableProps) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [sorting, setSorting] = useState<SortingState>([{ id: "title", desc: false }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    created_at: false,
    listing_count: false,
  })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [bulkAllMatching, setBulkAllMatching] = useState(false)
  const [excludedIds, setExcludedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [costEditorOpen, setCostEditorOpen] = useState(false)
  const [costEditorProductId, setCostEditorProductId] = useState<string | null>(null)

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

  const stockAlertLevels = useMemo(
    () => normalizeStockAlertLevelsFilter(filters.stockAlertLevels),
    [filters.stockAlertLevels],
  )

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [debouncedSearchQ, sortBy, sortDir, filters.statuses, filters.platforms, stockAlertLevels])

  useEffect(() => {
    setRowSelection({})
    setBulkAllMatching(false)
    setExcludedIds(new Set())
  }, [debouncedSearchQ, filters.statuses, filters.platforms, stockAlertLevels])

  const listQuery = useProductListQuery({
    q: debouncedSearchQ,
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
    sortBy,
    sortDir,
    statuses: filters.statuses,
    platforms: filters.platforms,
    stockAlertLevels,
  })

  const items = listQuery.data?.items ?? EMPTY_ITEMS
  const total = listQuery.data?.total ?? 0
  const baseCurrency = listQuery.data?.base_currency ?? "USD"
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize))
  const { format: formatMoney } = useMoney()
  const formatBaseMoney = useCallback(
    (value: number) => formatMoney(value, { nativeCurrency: baseCurrency }),
    [formatMoney, baseCurrency],
  )

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
    [navigate],
  )

  const onOpenCostEditor = useCallback((productId: string) => {
    setCostEditorProductId(productId)
    setCostEditorOpen(true)
  }, [])

  const pageIds = useMemo(() => items.map((i) => i.id), [items])

  const explicitSelectedCount = useMemo(
    () => Object.entries(rowSelection).filter(([, v]) => v).length,
    [rowSelection],
  )

  const effectiveSelectedCount =
    bulkAllMatching ? Math.max(0, total - excludedIds.size) : explicitSelectedCount

  const headerChecked = useMemo(() => {
    if (pageIds.length === 0) return false
    if (bulkAllMatching) return pageIds.every((id) => !excludedIds.has(id))
    return pageIds.every((id) => rowSelection[id])
  }, [pageIds, bulkAllMatching, excludedIds, rowSelection])

  const headerIndeterminate = useMemo(() => {
    if (pageIds.length === 0) return false
    if (bulkAllMatching) {
      const n = pageIds.filter((id) => !excludedIds.has(id)).length
      return n > 0 && n < pageIds.length
    }
    const n = pageIds.filter((id) => rowSelection[id]).length
    return n > 0 && n < pageIds.length
  }, [pageIds, bulkAllMatching, excludedIds, rowSelection])

  const onHeaderToggle = useCallback(
    (checked: boolean) => {
      if (bulkAllMatching) {
        setExcludedIds((prev) => {
          const next = new Set(prev)
          for (const id of pageIds) {
            if (checked) next.delete(id)
            else next.add(id)
          }
          return next
        })
      } else {
        setRowSelection((prev) => {
          const next = { ...prev }
          for (const id of pageIds) {
            if (checked) next[id] = true
            else delete next[id]
          }
          return next
        })
      }
    },
    [bulkAllMatching, pageIds],
  )

  const onRowToggle = useCallback((productId: string, checked: boolean) => {
    if (bulkAllMatching) {
      setExcludedIds((prev) => {
        const next = new Set(prev)
        if (checked) next.delete(productId)
        else next.add(productId)
        return next
      })
    } else {
      setRowSelection((prev) => ({ ...prev, [productId]: checked }))
    }
  }, [bulkAllMatching])

  const isRowSelected = useCallback(
    (productId: string) => {
      if (bulkAllMatching) return !excludedIds.has(productId)
      return !!rowSelection[productId]
    },
    [bulkAllMatching, excludedIds, rowSelection],
  )

  useEffect(() => {
    if (!bulkAllMatching || total <= 0) return
    if (total - excludedIds.size <= 0) {
      setBulkAllMatching(false)
      setExcludedIds(new Set())
      setRowSelection({})
    }
  }, [bulkAllMatching, total, excludedIds])

  useEffect(() => {
    if (!bulkAllMatching) return
    const next: RowSelectionState = {}
    for (const row of items) {
      if (!excludedIds.has(row.id)) next[row.id] = true
    }
    setRowSelection((prev) => {
      const ids = new Set([...Object.keys(prev), ...Object.keys(next)])
      for (const id of ids) {
        if ((!!prev[id]) !== (!!next[id])) return next
      }
      return prev
    })
  }, [bulkAllMatching, items, excludedIds])

  const clearSelection = useCallback(() => {
    setBulkAllMatching(false)
    setExcludedIds(new Set())
    setRowSelection({})
  }, [])

  const activateSelectAllMatching = useCallback(() => {
    setBulkAllMatching(true)
    setExcludedIds(new Set())
    setRowSelection({})
  }, [])

  const openBulkCogsEditor = useCallback(() => {
    const filterScope = {
      q: debouncedSearchQ,
      statuses: filters.statuses,
      platforms: filters.platforms,
      stockAlertLevels,
    }
    if (bulkAllMatching) {
      writeBulkCogsScope({
        mode: "filter",
        filters: filterScope,
        excludeParentIds: [...excludedIds],
      })
    } else if (effectiveSelectedCount > 0) {
      const parentProductIds = Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => id)
      writeBulkCogsScope({ mode: "parents", parentProductIds })
    } else {
      writeBulkCogsScope({ mode: "filter", filters: filterScope })
    }
    void navigate("/dashboard/products/bulk-cogs")
  }, [
    bulkAllMatching,
    debouncedSearchQ,
    effectiveSelectedCount,
    excludedIds,
    filters.platforms,
    filters.statuses,
    navigate,
    rowSelection,
    stockAlertLevels,
  ])

  const selectionBinding: ProductTableSelectionBinding = useMemo(
    () => ({
      headerChecked,
      headerIndeterminate,
      onHeaderToggle,
      isRowSelected,
      onRowToggle,
    }),
    [headerChecked, headerIndeterminate, onHeaderToggle, isRowSelected, onRowToggle],
  )

  const columns = useMemo(
    () =>
      createProductColumns({
        t,
        formatBaseMoney,
        onCopySku,
        onGoDetail,
        selection: selectionBinding,
        onOpenCostEditor,
      }),
    [
      t,
      formatBaseMoney,
      onCopySku,
      onGoDetail,
      selectionBinding,
      onOpenCostEditor,
    ],
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

  const showSelectAllMatching =
    effectiveSelectedCount > 0 && !bulkAllMatching && total > effectiveSelectedCount && total > 0

  const getColumnLabel = useCallback(
    (columnId: string) => {
      const key = COLUMN_LABEL_KEY_BY_ID[columnId as keyof typeof COLUMN_LABEL_KEY_BY_ID]
      return key ? t(key) : columnId
    },
    [t],
  )

  if (listQuery.isError) {
    return <div className="rounded-md border border-border-subtle bg-bg-section px-4 py-10 text-sm">{errorContent}</div>
  }

  return (
    <div className="flex flex-col gap-3">
      <ProductCostEditorSheet
        lang={lang}
        open={costEditorOpen}
        productId={costEditorProductId}
        onOpenChange={setCostEditorOpen}
      />
      <DataTable
        table={table}
        isLoading={listQuery.isLoading}
        isFetching={listQuery.isFetching}
        hasEverLoaded={listQuery.data !== undefined}
        emptyContent={emptyContent}
        skeletonRowCount={PAGE_SIZE}
        toolbar={
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openBulkCogsEditor}>
              {t("productsBulkCogsEntry")}
            </Button>
            {effectiveSelectedCount > 0 ? (
              <div className="flex h-8 max-w-full shrink-0 items-center gap-2 rounded-md border border-border-subtle bg-glass-fill-muted px-2.5 text-xs font-medium text-text-primary sm:gap-3 sm:px-3">
                <span className="whitespace-nowrap tabular-nums">
                  {effectiveSelectedCount} {t("productsTableSelected")}
                </span>
                {showSelectAllMatching ? (
                  <button
                    type="button"
                    className="shrink-0 text-left text-xs font-semibold text-primary underline underline-offset-2 hover:text-primary/85"
                    onClick={activateSelectAllMatching}
                  >
                    {t("productsTableSelectAllWithCount").replace("{count}", String(total))}
                  </button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-7 shrink-0 rounded-md text-text-secondary hover:text-text-primary"
                  aria-label={t("productsTableClearSelection")}
                  onClick={clearSelection}
                >
                  <X className="size-3.5 shrink-0" aria-hidden />
                </Button>
              </div>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-transparent text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
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
              goToPageLabel: t("productsTableGoToPage"),
              goToPageAria: t("productsTableGoToPageAria"),
            }}
          />
        }
      />
    </div>
  )
}
