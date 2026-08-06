import { useCallback, useMemo, useState } from 'react'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi } from '@/lib/types/catalog'
import { DataTable } from '@/ui/data-table/data-table'

import {
  createProductDetailChannelsColumns,
  sortListingsByStockAlert,
} from './product-detail-channels-columns'
import { SettlementMiniWaterfall } from './settlement-mini-waterfall'

type ProductDetailChannelsTableProps = {
  listings: ProductListingApi[]
  isLoading: boolean
  isFetching: boolean
  t: (key: ShellStringKey) => string
  fmtBase: (value: number) => string
  emptyContent: React.ReactNode
}

export function ProductDetailChannelsTable({
  listings,
  isLoading,
  isFetching,
  t,
  fmtBase,
  emptyContent,
}: ProductDetailChannelsTableProps) {
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(() => new Set())

  const onToggleExpand = useCallback((listingId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev)
      if (next.has(listingId)) {
        next.delete(listingId)
      } else {
        next.add(listingId)
      }
      return next
    })
  }, [])

  const columns = useMemo(
    () =>
      createProductDetailChannelsColumns(t, fmtBase, {
        expandedRowIds,
        onToggleExpand,
      }),
    [t, fmtBase, expandedRowIds, onToggleExpand],
  )
  const sortedListings = useMemo(() => sortListingsByStockAlert(listings), [listings])

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: sortedListings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  const renderExpandedContent = useCallback(
    (listing: ProductListingApi) => {
      if (!listing.period_settlement) return null
      return (
        <div className="max-w-md px-2">
          <p className="mb-2 text-xs font-medium text-text-secondary">
            {t('productsDetailListingSettlementBreakdown')}
          </p>
          <SettlementMiniWaterfall
            settlement={listing.period_settlement}
            fmtBase={fmtBase}
            t={t}
            compact
          />
        </div>
      )
    },
    [fmtBase, t],
  )

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      isFetching={isFetching}
      hasEverLoaded
      emptyContent={emptyContent}
      scrollClassName="max-h-[28rem] min-w-[640px] overflow-auto"
      expandedRowIds={expandedRowIds}
      renderExpandedContent={renderExpandedContent}
    />
  )
}
