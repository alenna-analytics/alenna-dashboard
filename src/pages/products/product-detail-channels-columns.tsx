import type { ColumnDef } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductListingApi, StockAlertLevel } from '@/lib/types/catalog'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'

import { ProductDetailColumnHeaderWithHelp } from './product-detail-column-header-with-help'
import {
  formatListingInventoryDays,
  formatListingVelocityPerDay,
} from './product-detail-listing-channel-format'
import { ProductPlatformLogoName } from './product-platform-logo-name'
import {
  ProductStockAlertBadge,
  ProductStockQuantityCell,
} from './product-stock-alert-ui'

const NUMERIC_CELL_META = {
  headerClassName: '[&>div]:justify-end',
  cellClassName: '[&>div]:justify-end',
} as const
const TEXT_CELL_META = {
  headerClassName: '[&>div]:justify-start',
  cellClassName: '[&>div]:justify-start',
} as const

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

export function createProductDetailChannelsColumns(
  t: (key: ShellStringKey) => string,
  fmtBase: (value: number) => string,
): ColumnDef<ProductListingApi>[] {
  return [
    {
      id: 'platform',
      accessorKey: 'platform',
      meta: TEXT_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsDetailListingColChannel')} />
      ),
      cell: ({ row }) => (
        <ProductPlatformLogoName
          platformSlug={row.original.platform}
          t={t}
          className="max-w-56 text-sm text-text-primary"
        />
      ),
    },
    {
      id: 'platform_sku',
      accessorKey: 'platform_sku',
      meta: {
        ...TEXT_CELL_META,
        headerClassName: 'min-w-[14rem]',
        cellClassName: 'min-w-[14rem] [&>div]:justify-start',
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsDetailListingColSku')} />
      ),
      cell: ({ row }) => (
        <span
          className="block min-w-0 max-w-[18rem] truncate font-mono text-sm leading-normal"
          title={row.original.platform_sku}
        >
          {row.original.platform_sku}
        </span>
      ),
    },
    {
      id: 'stock_quantity',
      accessorKey: 'stock_quantity',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColStock')}
        />
      ),
      cell: ({ row }) => <ProductStockQuantityCell quantity={row.original.stock_quantity} />,
    },
    {
      id: 'stock_alert',
      accessorKey: 'stock_alert',
      meta: TEXT_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsDetailListingColAlert')} />
      ),
      cell: ({ row }) => <ProductStockAlertBadge level={row.original.stock_alert} t={t} />,
    },
    {
      id: 'velocity_units_per_day_90d',
      accessorKey: 'velocity_units_per_day_90d',
      meta: NUMERIC_CELL_META,
      header: () => (
        <div className="flex w-full min-w-0 items-center justify-end text-sm font-semibold text-text-secondary">
          <ProductDetailColumnHeaderWithHelp
            title={t('productsDetailListingColVelocityPerDay')}
            helpText={t('productsDetailListingColVelocityPerDayHelp')}
          />
        </div>
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatListingVelocityPerDay(row.original.velocity_units_per_day_90d)}
        </span>
      ),
    },
    {
      id: 'inventory_days',
      accessorKey: 'inventory_days',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColInventoryDays')}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{formatListingInventoryDays(row.original, t)}</span>
      ),
    },
    {
      id: 'period_sales',
      accessorKey: 'period_sales',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColSales')}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{fmtBase(row.original.period_sales)}</span>
      ),
    },
    {
      id: 'period_orders',
      accessorKey: 'period_orders',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColOrders')}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.original.period_orders}</span>
      ),
    },
    {
      id: 'period_units_sold',
      accessorKey: 'period_units_sold',
      meta: NUMERIC_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader
          className="justify-end"
          column={column}
          title={t('productsDetailListingColUnits')}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.original.period_units_sold}</span>
      ),
    },
  ]
}
