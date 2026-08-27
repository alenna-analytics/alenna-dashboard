import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkGroupMemberApi } from '@/lib/types/product-links'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { EmptyState } from '@/ui/empty-state'

import { ProductPlatformLogoName } from '../product-platform-logo-name'
import { ProductTableThumb } from '../product-table-thumb'

type ShellT = (key: ShellStringKey) => string

type VinculacionGroupMembersTableProps = {
  members: ProductLinkGroupMemberApi[]
  t: ShellT
  isFetching: boolean
}

const TEXT_CELL_META = {
  headerClassName: '[&>div]:justify-start',
  cellClassName: '[&>div]:justify-start',
} as const

export function VinculacionGroupMembersTable({
  members,
  t,
  isFetching,
}: VinculacionGroupMembersTableProps) {
  const columns = useMemo(() => createColumns(t), [t])

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.product_id,
  })

  return (
    <DataTable
      table={table}
      isLoading={false}
      isFetching={isFetching}
      hasEverLoaded
      emptyContent={<EmptyState size="sm" icon="products" title={t('productsVinculacionGroupMissing')} />}
      scrollClassName="max-h-[28rem] overflow-auto"
      tableWidth="full"
    />
  )
}

function createColumns(t: ShellT): ColumnDef<ProductLinkGroupMemberApi>[] {
  return [
    {
      id: 'product',
      accessorFn: (row) => row.variant_label || row.title,
      meta: TEXT_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsColProduct')} />
      ),
      cell: ({ row }) => {
        const member = row.original
        const label = member.variant_label || member.title
        return (
          <Link
            to={`/dashboard/products/${member.product_id}`}
            className="flex min-w-0 items-center gap-2"
          >
            <ProductTableThumb url={member.image_url} alt={label} />
            <span className="min-w-0 truncate font-medium">{label}</span>
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
