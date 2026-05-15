import type { ColumnDef } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi } from '@/lib/types/catalog'
import { fmtCurrency } from '@/pages/reports/reports-ui-helpers'
import { Badge } from '@/ui/badge'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { cn } from '@/lib/utils'

import { formatPlatformSlug } from './product-detail-range'

const NUM = 'font-numeric tabular-nums'

export function createProductDetailChannelsColumns(
  t: (key: ShellStringKey) => string,
  fmtBase: (value: number) => string,
): ColumnDef<ProductListingApi>[] {
  return [
    {
      id: 'platform',
      accessorKey: 'platform',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsDetailListingColPlatform')} />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-normal">
          {formatPlatformSlug(row.original.platform)}
        </Badge>
      ),
    },
    {
      id: 'platform_sku',
      accessorKey: 'platform_sku',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsDetailListingColSku')} />
      ),
      cell: ({ row }) => (
        <span className="block max-w-40 truncate font-mono text-xs" title={row.original.platform_sku}>
          {row.original.platform_sku}
        </span>
      ),
    },
    {
      id: 'period_sales',
      accessorKey: 'period_sales',
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColSales')}
        />
      ),
      cell: ({ row }) => (
        <span className={cn('block text-right text-xs', NUM)}>
          {fmtBase(row.original.period_sales)}
        </span>
      ),
    },
    {
      id: 'period_orders',
      accessorKey: 'period_orders',
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColOrders')}
        />
      ),
      cell: ({ row }) => (
        <span className={cn('block text-right text-xs', NUM)}>{row.original.period_orders}</span>
      ),
    },
    {
      id: 'period_units_sold',
      accessorKey: 'period_units_sold',
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColUnits')}
        />
      ),
      cell: ({ row }) => (
        <span className={cn('block text-right text-xs', NUM)}>{row.original.period_units_sold}</span>
      ),
    },
    {
      id: 'platform_price',
      accessorKey: 'platform_price',
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColPrice')}
        />
      ),
      cell: ({ row }) => {
        const li = row.original
        return (
          <span className={cn('block text-right text-xs', NUM)}>
            {li.platform_price != null && li.currency
              ? fmtCurrency(li.platform_price, li.currency)
              : '—'}
          </span>
        )
      },
    },
    {
      id: 'currency',
      accessorKey: 'currency',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsDetailListingColPlatformCurrency')} />
      ),
      cell: ({ row }) => (
        <span className={cn('text-xs', NUM)}>{row.original.currency ?? '—'}</span>
      ),
    },
  ]
}
