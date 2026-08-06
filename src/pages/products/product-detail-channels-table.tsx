import { useCallback, useMemo, useState } from 'react'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi } from '@/lib/types/catalog'
import { DataTable } from '@/ui/data-table/data-table'

import {
  createProductDetailChannelsColumns,
  sortListingsByStockAlert,
} from './product-detail-channels-columns'
import { ProductListingSettlementSheet } from './product-listing-settlement-sheet'

type ProductDetailChannelsTableProps = {
  listings: ProductListingApi[]
  isLoading: boolean
  isFetching: boolean
  t: (key: ShellStringKey) => string
  fmtBase: (value: number) => string
  periodLabel: string | null
  emptyContent: React.ReactNode
}

export function ProductDetailChannelsTable({
  listings,
  isLoading,
  isFetching,
  t,
  fmtBase,
  periodLabel,
  emptyContent,
}: ProductDetailChannelsTableProps) {
  const [selectedListing, setSelectedListing] = useState<ProductListingApi | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const onCopySku = useCallback(
    async (sku: string) => {
      try {
        await navigator.clipboard.writeText(sku)
      } catch {
        /* clipboard unavailable */
      }
    },
    [],
  )

  const columns = useMemo(
    () => createProductDetailChannelsColumns(t, fmtBase, { onCopySku }),
    [t, fmtBase, onCopySku],
  )
  const sortedListings = useMemo(() => sortListingsByStockAlert(listings), [listings])

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: sortedListings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  const onRowClick = useCallback((listing: ProductListingApi) => {
    if (!listing.period_settlement) return
    setSelectedListing(listing)
    setSheetOpen(true)
  }, [])

  return (
    <>
      <DataTable
        table={table}
        isLoading={isLoading}
        isFetching={isFetching}
        hasEverLoaded
        emptyContent={emptyContent}
        scrollClassName="max-h-[28rem] min-w-[640px] overflow-auto"
        onRowClick={onRowClick}
      />
      <ProductListingSettlementSheet
        listing={selectedListing}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        fmtBase={fmtBase}
        t={t}
        periodLabel={periodLabel}
      />
    </>
  )
}
