import { useCallback, useMemo, useState } from 'react'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductVariantSummaryApi } from '@/lib/types/catalog'
import { useLanguage } from '@/shell/providers/language-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { DataTable } from '@/ui/data-table/data-table'

import {
  createProductDetailVariantsColumns,
  sortVariantsByStockAlert,
} from './product-detail-variants-columns'
import { showProductCostErrorToast, showProductCostSuccessToast } from './product-cost-toast'
import { usePatchProductCostMutation } from './use-catalog-queries'

type ProductDetailVariantsTableProps = {
  variants: ProductVariantSummaryApi[]
  parentProductId: string
  t: (key: ShellStringKey) => string
  fmtBase: (value: number) => string
}

export function ProductDetailVariantsTable({
  variants,
  parentProductId,
  t,
  fmtBase,
}: ProductDetailVariantsTableProps) {
  const { lang } = useLanguage()
  const [activeEditProductId, setActiveEditProductId] = useState<string | null>(null)
  const patchCostMutation = usePatchProductCostMutation()

  const onEditActivate = useCallback((productId: string) => {
    setActiveEditProductId(productId)
  }, [])

  const onEditDeactivate = useCallback(() => {
    setActiveEditProductId(null)
  }, [])

  const onSaveCost = useCallback(
    async (productId: string, cost: number) => {
      try {
        await patchCostMutation.mutateAsync({
          productId,
          parentProductId,
          cost,
        })
        showProductCostSuccessToast(lang)
      } catch (error) {
        showProductCostErrorToast(lang, error)
        throw error
      }
    },
    [lang, parentProductId, patchCostMutation],
  )

  const columns = useMemo(
    () =>
      createProductDetailVariantsColumns({
        t,
        fmtBase,
        activeEditProductId,
        onEditActivate,
        onEditDeactivate,
        onSaveCost,
        saveCostPending: patchCostMutation.isPending,
      }),
    [
      t,
      fmtBase,
      activeEditProductId,
      onEditActivate,
      onEditDeactivate,
      onSaveCost,
      patchCostMutation.isPending,
    ],
  )
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
