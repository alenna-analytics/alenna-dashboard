import { useMemo } from 'react'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductVariantSummaryApi } from '@/lib/types/catalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { DataTable } from '@/ui/data-table/data-table'

import {
  createProductDetailVariantsColumns,
  sortVariantsByStockAlert,
} from './product-detail-variants-columns'

type ProductDetailVariantsTableProps = {
  variants: ProductVariantSummaryApi[]
  t: (key: ShellStringKey) => string
  fmtBase: (value: number) => string
}

export function ProductDetailVariantsTable({
  variants,
  t,
  fmtBase,
}: ProductDetailVariantsTableProps) {
  const columns = useMemo(() => createProductDetailVariantsColumns(t, fmtBase), [t, fmtBase])
  const sortedVariants = useMemo(() => sortVariantsByStockAlert(variants), [variants])

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: sortedVariants,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  if (variants.length === 0) {
    return null
  }

  return (
    <Card
      id="product-variants-section"
      className="scroll-mt-24 rounded-none border-none p-0 shadow-none hover:shadow-none"
    >
      <CardHeader className="p-0">
        <CardTitle className="text-xl">{t('productsDetailVariantsTitle')}</CardTitle>
        <CardDescription className="text-xs">{t('productsDetailVariantsDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable
          table={table}
          isLoading={false}
          isFetching={false}
          hasEverLoaded
          emptyContent={
            <p className="py-8 text-center text-sm text-text-tertiary">—</p>
          }
          scrollClassName="max-h-[28rem] overflow-auto"
        />
      </CardContent>
    </Card>
  )
}
