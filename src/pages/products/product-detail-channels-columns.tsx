import type { ColumnDef } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi, StockAlertLevel } from '@/lib/types/catalog'
import { Badge } from '@/ui/badge'
import { fmtCurrency } from '@/pages/reports/reports-ui-helpers'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { cn } from '@/lib/utils'

import { ProductPlatformLogoName } from './product-platform-logo-name'

const NUM = 'font-numeric tabular-nums'

function alertRank(level: StockAlertLevel): number {
  if (level === 'out') return 0
  if (level === 'low') return 1
  return 2
}

export function sortListingsByStockAlert(listings: ProductListingApi[]): ProductListingApi[] {
  return [...listings].sort((a, b) => {
    const d = alertRank(a.stock_alert) - alertRank(b.stock_alert)
    if (d !== 0) return d
    return a.platform.localeCompare(b.platform)
  })
}

function alertLabel(t: (key: ShellStringKey) => string, level: StockAlertLevel): string {
  if (level === 'out') return t('productsDetailStockAlertOutShort')
  if (level === 'low') return t('productsDetailStockAlertLowShort')
  return '—'
}

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
        <div className="flex min-w-0 w-full items-center">
          <ProductPlatformLogoName
            platformSlug={row.original.platform}
            t={t}
            className="max-w-56 text-sm text-text-primary"
          />
        </div>
      ),
    },
    {
      id: 'platform_sku',
      accessorKey: 'platform_sku',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsDetailListingColSku')} />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-0 w-full items-center">
          <span
            className="block max-w-40 min-w-0 truncate font-mono text-sm leading-normal"
            title={row.original.platform_sku}
          >
            {row.original.platform_sku}
          </span>
        </div>
      ),
    },
    {
      id: 'stock_quantity',
      accessorKey: 'stock_quantity',
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColStock')}
        />
      ),
      cell: ({ row }) => (
        <span className={cn('block w-full text-right text-sm', NUM)}>
          {row.original.stock_quantity != null ? row.original.stock_quantity : '—'}
        </span>
      ),
    },
    {
      id: 'stock_alert',
      accessorKey: 'stock_alert',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsDetailListingColAlert')} />
      ),
      cell: ({ row }) => {
        const level = row.original.stock_alert
        if (level === 'none') {
          return <span className="text-sm text-text-tertiary">—</span>
        }
        return (
          <Badge variant={level === 'out' ? 'error' : 'warning'} className="text-[10px]">
            {alertLabel(t, level)}
          </Badge>
        )
      },
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
        <span className={cn('block w-full text-right text-sm', NUM)}>
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
        <span className={cn('block w-full text-right text-sm', NUM)}>{row.original.period_orders}</span>
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
        <span className={cn('block w-full text-right text-sm', NUM)}>{row.original.period_units_sold}</span>
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
          <span className={cn('block w-full text-right text-sm', NUM)}>
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
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColPlatformCurrency')}
        />
      ),
      cell: ({ row }) => (
        <span className="block w-full text-right text-sm text-text-secondary">
          {row.original.currency ?? '—'}
        </span>
      ),
    },
  ]
}
