import { useMemo } from 'react'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi } from '@/lib/types/catalog'
import { DataTable } from '@/ui/data-table/data-table'

import { createProductDetailChannelsColumns } from './product-detail-channels-columns'

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
  const columns = useMemo(() => createProductDetailChannelsColumns(t, fmtBase), [t, fmtBase])

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: listings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      isFetching={isFetching}
      hasEverLoaded
      emptyContent={emptyContent}
      scrollClassName="max-h-[28rem] overflow-auto"
    />
  )
}
