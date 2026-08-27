import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkGroupMemberApi } from '@/lib/types/product-links'
import { Button } from '@/ui/button'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { TableEmptyCell } from '@/ui/data-table/table-empty-cell'
import { EmptyState } from '@/ui/empty-state'

import { ProductPlatformLogoName } from '../product-platform-logo-name'
import { ProductTableThumb } from '../product-table-thumb'

type ShellT = (key: ShellStringKey) => string

type VinculacionGroupMembersTableProps = {
  members: ProductLinkGroupMemberApi[]
  t: ShellT
  canEdit: boolean
  fmtMoney: (value: number) => string
  isFetching: boolean
  removingId: string | null
  onRemove: (productId: string) => void
}

const NUMERIC_CELL_META = {
  headerClassName: '[&>div]:justify-end',
  cellClassName: '[&>div]:justify-end',
} as const
const TEXT_CELL_META = {
  headerClassName: '[&>div]:justify-start',
  cellClassName: '[&>div]:justify-start',
} as const

export function VinculacionGroupMembersTable({
  members,
  t,
  canEdit,
  fmtMoney,
  isFetching,
  removingId,
  onRemove,
}: VinculacionGroupMembersTableProps) {
  const columns = useMemo(
    () => createColumns(t, fmtMoney, canEdit, removingId, onRemove),
    [canEdit, fmtMoney, onRemove, removingId, t],
  )

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
      scrollClassName="max-h-[28rem] min-w-[640px] overflow-auto"
      tableWidth="full"
    />
  )
}

function createColumns(
  t: ShellT,
  fmtMoney: (value: number) => string,
  canEdit: boolean,
  removingId: string | null,
  onRemove: (productId: string) => void,
): ColumnDef<ProductLinkGroupMemberApi>[] {
  const columns: ColumnDef<ProductLinkGroupMemberApi>[] = [
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
    {
      id: 'cost',
      accessorKey: 'cost',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader className="justify-end" column={column} title={t('productsColCost')} />
      ),
      cell: ({ row }) =>
        row.original.cost != null ? (
          <span className="tabular-nums">{fmtMoney(row.original.cost)}</span>
        ) : (
          <TableEmptyCell />
        ),
    },
    {
      id: 'stock',
      accessorFn: (row) => row.consolidated_stock_quantity ?? row.stock_quantity,
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColStock')}
        />
      ),
      cell: ({ row }) => {
        const stock = row.original.consolidated_stock_quantity ?? row.original.stock_quantity
        return stock != null ? <span className="tabular-nums">{stock}</span> : <TableEmptyCell />
      },
    },
    {
      id: 'price',
      accessorKey: 'platform_price',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsVinculacionColPrice')}
        />
      ),
      cell: ({ row }) =>
        row.original.platform_price != null ? (
          <span className="tabular-nums">{fmtMoney(Number(row.original.platform_price))}</span>
        ) : (
          <TableEmptyCell />
        ),
    },
  ]

  if (canEdit) {
    columns.push({
      id: 'actions',
      enableSorting: false,
      meta: { headerClassName: '[&>div]:justify-end', cellClassName: '[&>div]:justify-end' },
      header: () => null,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="tiny"
          loading={removingId === row.original.product_id}
          disabled={removingId !== null && removingId !== row.original.product_id}
          onClick={() => onRemove(row.original.product_id)}
        >
          {t('productsVinculacionRemoveMember')}
        </Button>
      ),
    })
  }

  return columns
}
