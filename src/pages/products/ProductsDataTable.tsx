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

import type { ShellStringKey } from "@/lib/i18n/shell-strings"
import type { ProductSummaryApi } from "@/lib/types/catalog"
import { Button } from "@/ui/button"
import { DataTable } from "@/ui/data-table/data-table"
import { DataTablePagination } from "@/ui/data-table/data-table-pagination"
import { useMoney } from "@/hooks/use-money"
import { can } from "@/lib/permissions/can"
import { useLanguage } from "@/shell/providers/language-provider"
import { useWorkspace } from "@/shell/providers/workspace-context"

import { createProductColumns, type ProductTableSelectionBinding } from "./products-columns"
import { ProductCostEditorSheet } from "./product-cost-editor-sheet"
import {
  normalizeStockAlertLevelsFilter,
  type ProductsListFiltersState,
} from "./products-list-filter-state"
import { useProductListQuery } from "./use-catalog-queries"

const PAGE_SIZE = 15

const EMPTY_ITEMS: ProductSummaryApi[] = []

type ProductsDataTableProps = {
  searchQ: string
  filters: ProductsListFiltersState
  t: (key: ShellStringKey) => string
  emptyContent: React.ReactNode
  errorContent: React.ReactNode
}

export function ProductsDataTable({
  searchQ,
  filters,
  t,
  emptyContent,
  errorContent,
}: ProductsDataTableProps) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const canEditProducts = can(me, 'products.edit')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })
  const [sorting, setSorting] = useState<SortingState>([{ id: "title", desc: false }])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    created_at: false,
    listing_count: false,
    status: false,
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

  const onGoDetail = useCallback(
    (productId: string) => {
      void navigate(`/dashboard/products/${productId}`)
    },
    [navigate],
  )

  const onOpenCostEditor = useCallback((productId: string) => {
    if (!canEditProducts) return
    setCostEditorProductId(productId)
    setCostEditorOpen(true)
  }, [canEditProducts])

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
        onGoDetail,
        selection: selectionBinding,
        onOpenCostEditor: canEditProducts ? onOpenCostEditor : undefined,
      }),
    [
      t,
      formatBaseMoney,
      onGoDetail,
      selectionBinding,
      canEditProducts,
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

  const hasSelection = effectiveSelectedCount > 0

  if (listQuery.isError) {
    return <div className="rounded-md border border-border-subtle bg-bg-section px-4 py-10 text-sm">{errorContent}</div>
  }

  return (
    <div className="flex flex-col gap-3">
      {canEditProducts ? (
      <ProductCostEditorSheet
        lang={lang}
        open={costEditorOpen}
        productId={costEditorProductId}
        onOpenChange={setCostEditorOpen}
      />
      ) : null}
      <DataTable
        table={table}
        isLoading={listQuery.isLoading}
        isFetching={listQuery.isFetching}
        hasEverLoaded={listQuery.data !== undefined}
        emptyContent={emptyContent}
        skeletonRowCount={PAGE_SIZE}
        scrollClassName="overflow-x-auto"
        selectionBanner={
          hasSelection ? (
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <span className="text-sm font-medium whitespace-nowrap text-foreground tabular-nums">
                {effectiveSelectedCount} {t("productsTableSelected")}
              </span>
              {showSelectAllMatching ? (
                <>
                  <span className="h-4 w-px shrink-0 bg-border-default" aria-hidden />
                  <button
                    type="button"
                    className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                    onClick={activateSelectAllMatching}
                  >
                    {t("productsTableSelectAllWithCount").replace("{count}", String(total))}
                  </button>
                </>
              ) : null}
            </div>
          ) : null
        }
        toolbar={
          hasSelection ? (
            <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
              {t("productsTableCancelSelection")}
            </Button>
          ) : null
        }
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
