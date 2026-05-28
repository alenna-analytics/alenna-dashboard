import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import type { ProductVariantSummaryApi, StockAlertLevel } from '@/lib/types/catalog'
import { Badge } from '@/ui/badge'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'

import { ProductDetailColumnHeaderWithHelp } from './product-detail-column-header-with-help'
import { productDetailChannelPillClassName } from './product-detail-platform-badges'
import {
  formatListingInventoryDays,
  formatListingVelocityPerDay,
} from './product-detail-listing-channel-format'
import { productPlatformLabel } from './product-platform-label'
import { ProductTableThumb } from './product-table-thumb'
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

export function sortVariantsByStockAlert(
  variants: ProductVariantSummaryApi[],
): ProductVariantSummaryApi[] {
  return [...variants].sort((a, b) => {
    const d = alertRank(a.stock_alert) - alertRank(b.stock_alert)
    if (d !== 0) return d
    const labelA = a.variant_label ?? a.title
    const labelB = b.variant_label ?? b.title
    return labelA.localeCompare(labelB)
  })
}

export function createProductDetailVariantsColumns(
  t: (key: ShellStringKey) => string,
  fmtBase: (value: number) => string,
): ColumnDef<ProductVariantSummaryApi>[] {
  return [
    {
      id: 'variant',
      accessorFn: (row) => row.variant_label ?? row.title,
      meta: {
        ...TEXT_CELL_META,
        headerClassName: 'min-w-[12rem]',
        cellClassName: 'min-w-[12rem] [&>div]:justify-start',
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsDetailVariantsColName')} />
      ),
      cell: ({ row }) => {
        const label = row.original.variant_label ?? row.original.title
        return (
          <div className="flex min-w-0 items-center gap-2">
            <ProductTableThumb url={row.original.image_url} alt={label} />
            <Link
              to={`/dashboard/products/${row.original.id}`}
              className="min-w-0 truncate font-medium text-[var(--country-green-base)] hover:text-[var(--country-green-100)] hover:underline"
              title={label}
            >
              {label}
            </Link>
          </div>
        )
      },
    },
    {
      id: 'platforms',
      accessorKey: 'platforms',
      meta: TEXT_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsColChannels')} />
      ),
      cell: ({ row }) => {
        const platforms = row.original.platforms ?? []
        if (platforms.length === 0) {
          return <span className="text-sm text-text-tertiary">—</span>
        }
        return (
          <div className="flex flex-wrap gap-1">
            {platforms.map((platform) => {
              const slug = platform.trim().toLowerCase()
              const ui = slug ? INTEGRATION_UI[slug] : undefined
              return (
                <Badge
                  key={platform}
                  variant="outline"
                  className={productDetailChannelPillClassName}
                >
                  {ui?.logoSrc != null ? (
                    <img
                      src={ui.logoSrc}
                      alt=""
                      className="size-4 shrink-0 object-contain"
                      aria-hidden
                    />
                  ) : null}
                  <span>{productPlatformLabel(platform, t)}</span>
                </Badge>
              )
            })}
          </div>
        )
      },
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
      cell: ({ row }) => (
        <ProductStockAlertBadge level={row.original.stock_alert ?? 'none'} t={t} />
      ),
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
        <span className="text-sm tabular-nums">
          {formatListingInventoryDays(row.original, t)}
        </span>
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
