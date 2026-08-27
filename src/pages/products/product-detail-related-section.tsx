import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi, ProductLinkSiblingApi } from '@/lib/types/catalog'
import { SettingsSectionHeader } from '@/pages/configuration/settings-layout'
import { buttonVariants } from '@/ui/button'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { EmptyState } from '@/ui/empty-state'

import { uniqueActivePlatforms } from './product-detail-header-utils'
import { productsLinkingGroupPath } from './products-inner-nav'
import { ProductPlatformLogoName } from './product-platform-logo-name'
import { ProductTableThumb } from './product-table-thumb'

type ShellT = (key: ShellStringKey) => string

type RelatedProductRow = {
  product_id: string
  title: string
  platform: string
  image_url: string | null
}

type ProductDetailRelatedSectionProps = {
  detail: ProductDetailApi
  t: ShellT
}

const TEXT_CELL_META = {
  headerClassName: '[&>div]:justify-start',
  cellClassName: '[&>div]:justify-start',
} as const

export function ProductDetailRelatedSection({ detail, t }: ProductDetailRelatedSectionProps) {
  const groupId = detail.link_group_id
  const rows = useMemo(() => relatedProductsFromDetail(detail), [detail])
  const columns = useMemo(() => createColumns(t), [t])

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.product_id,
  })

  if (!groupId) return null

  const groupTitle = detail.link_group_title?.trim() || t('productsVinculacionHubCrumb')

  return (
    <section className="space-y-4">
      <SettingsSectionHeader
        title={groupTitle}
        description={t('productsDetailRelatedDescription')}
        aside={
          <Link
            to={productsLinkingGroupPath(groupId)}
            className={buttonVariants({ variant: 'outline', size: 'tiny' })}
          >
            {t('productsVinculacionViewGroup')}
          </Link>
        }
      />
      <DataTable
        table={table}
        isLoading={false}
        isFetching={false}
        hasEverLoaded
        emptyContent={
          <EmptyState size="sm" icon="products" title={t('productsVinculacionGroupMissing')} />
        }
        tableWidth="full"
      />
    </section>
  )
}

function relatedProductsFromDetail(detail: ProductDetailApi): RelatedProductRow[] {
  const currentPlatform = uniqueActivePlatforms(detail.listings)[0] ?? ''
  const current: RelatedProductRow = {
    product_id: detail.id,
    title: detail.variant_label || detail.title,
    platform: currentPlatform,
    image_url: detail.image_url,
  }
  const siblings = (detail.link_siblings ?? []).map((sibling) => siblingToRow(sibling))
  return [current, ...siblings.filter((row) => row.product_id !== detail.id)]
}

function siblingToRow(sibling: ProductLinkSiblingApi): RelatedProductRow {
  return {
    product_id: sibling.product_id,
    title: sibling.platform_title || sibling.title,
    platform: sibling.platform,
    image_url: sibling.image_url,
  }
}

function createColumns(t: ShellT): ColumnDef<RelatedProductRow>[] {
  return [
    {
      id: 'product',
      accessorFn: (row) => row.title,
      meta: TEXT_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsColProduct')} />
      ),
      cell: ({ row }) => {
        const product = row.original
        return (
          <Link
            to={`/dashboard/products/${product.product_id}`}
            className="flex min-w-0 items-center gap-2"
          >
            <ProductTableThumb url={product.image_url} alt={product.title} />
            <span className="min-w-0 truncate font-medium">{product.title}</span>
          </Link>
        )
      },
    },
    {
      id: 'channel',
      accessorKey: 'platform',
      meta: TEXT_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsColChannels')} />
      ),
      cell: ({ row }) => <ProductPlatformLogoName platformSlug={row.original.platform} t={t} />,
    },
  ]
}
