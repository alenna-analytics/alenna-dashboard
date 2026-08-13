import { useCallback, useMemo, useState } from 'react'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi } from '@/lib/types/catalog'
import { DataTable } from '@/ui/data-table/data-table'

import {
  createProductDetailChannelsColumns,
  sortListingsByStockAlert,
} from './product-detail-channels-columns'
import { sharedStockListingIds } from './product-detail-listing-stock'
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

  const onViewSettlement = useCallback((listing: ProductListingApi) => {
    if (!listing.period_settlement) return
    setSelectedListing(listing)
    setSheetOpen(true)
  }, [])

  const sortedListings = useMemo(() => sortListingsByStockAlert(listings), [listings])
  const sharedStockIds = useMemo(() => sharedStockListingIds(sortedListings), [sortedListings])

  const columns = useMemo(
    () => createProductDetailChannelsColumns(t, fmtBase, { onViewSettlement, sharedStockListingIds: sharedStockIds }),
    [t, fmtBase, onViewSettlement, sharedStockIds],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: sortedListings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <>
      <DataTable
        table={table}
        isLoading={isLoading}
        isFetching={isFetching}
        hasEverLoaded
        emptyContent={emptyContent}
        scrollClassName="max-h-[28rem] min-w-[640px] overflow-auto"
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
