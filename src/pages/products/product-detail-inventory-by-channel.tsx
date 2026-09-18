import { useMemo } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi } from '@/lib/types/catalog'
import type { ProductLinkGroupApi } from '@/lib/types/product-links'
import { SettingsSectionHeader } from '@/pages/configuration/settings-layout'
import { cn } from '@/lib/utils'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'
import { TableEmptyCell } from '@/ui/data-table/table-empty-cell'

import {
  inventoryRowsFromGroupMembers,
  inventoryRowsFromProductDetail,
  inventoryRowsFromProductGroup,
  type InventoryByChannelRow,
  withInventoryTotalRow,
} from './product-detail-inventory-rows'
import { formatListingVelocityPerDay } from './product-detail-listing-channel-format'
import { productPlatformLabel } from './product-platform-label'
import { ProductPlatformLogoName } from './product-platform-logo-name'
import { ProductStockAlertBadge } from './product-stock-alert-ui'
import { useGroupInsight } from './vinculacion/use-group-insight'

type ShellT = (key: ShellStringKey) => string
type InventoryDimension = 'channel' | 'product'

type InventoryByChannelTableProps = {
  rows: InventoryByChannelRow[]
  t: ShellT
  isFetching?: boolean
  title?: string
  dimension?: InventoryDimension
  /** When true, keep the section visible even with zero rows (empty state). */
  showWhenEmpty?: boolean
}

const columnHelper = createColumnHelper<InventoryByChannelRow>()

const TEXT_START_META = {
  headerClassName: '[&>div]:justify-start',
  cellClassName: '[&>div]:justify-start',
} as const

const TEXT_END_META = {
  headerClassName: 'text-right',
  cellClassName: 'text-right tabular-nums',
} as const

export function InventoryByChannelTable({
  rows,
  t,
  isFetching = false,
  title,
  dimension = 'channel',
  showWhenEmpty = false,
}: InventoryByChannelTableProps) {
  const byProduct = dimension === 'product'
  const tableRows = useMemo(
    () => withInventoryTotalRow(rows, t('channelsColTotal')),
    [rows, t],
  )

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'entity',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={byProduct ? t('productsColProduct') : t('homeFilterChannels')}
          />
        ),
        cell: ({ row }) => {
          if (row.original.isTotal) {
            return (
              <span className="font-semibold text-text-primary">
                {row.original.label ?? t('channelsColTotal')}
              </span>
            )
          }
          if (byProduct) {
            const label = row.original.label ?? row.original.platform
            return (
              <span className="flex min-w-0 max-w-full items-center gap-1.5">
                <ProductPlatformLogoName
                  platformSlug={row.original.platform}
                  t={t}
                  className="shrink-0 text-sm"
                  textClassName="sr-only"
                />
                <span className="min-w-0 truncate text-sm" title={label}>
                  {label}
                </span>
              </span>
            )
          }
          return (
            <>
              <ProductPlatformLogoName
                platformSlug={row.original.platform}
                t={t}
                className="text-sm"
              />
              <span className="sr-only">{productPlatformLabel(row.original.platform, t)}</span>
            </>
          )
        },
        meta: TEXT_START_META,
      }),
      columnHelper.accessor('stock', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsDetailInventoryStock')}
            className="justify-end"
          />
        ),
        cell: ({ getValue, row }) => (
          <span className={cn(row.original.isTotal && 'font-semibold')}>
            {getValue().toLocaleString()}
          </span>
        ),
        meta: TEXT_END_META,
      }),
      columnHelper.accessor('velocity', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsDetailInventoryVelocityPerDay')}
            className="justify-end"
          />
        ),
        cell: ({ getValue, row }) => {
          const formatted = formatListingVelocityPerDay(getValue())
          if (!formatted) return <TableEmptyCell />
          return (
            <span className={cn('tabular-nums', row.original.isTotal && 'font-semibold')}>
              {formatted} {t('productsDetailInventoryVelocityUnit')}
            </span>
          )
        },
        meta: TEXT_END_META,
      }),
      columnHelper.accessor('inventoryDays', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsDetailInventoryDays')}
            className="justify-end"
          />
        ),
        cell: ({ getValue, row }) => {
          const value = getValue()
          if (value == null) return <TableEmptyCell />
          return (
            <span className={cn(row.original.isTotal && 'font-semibold')}>
              {value.toLocaleString(undefined, {
                maximumFractionDigits: 1,
                minimumFractionDigits: 0,
              })}
            </span>
          )
        },
        meta: TEXT_END_META,
      }),
      columnHelper.display({
        id: 'stockAlert',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsDetailInventoryAlert')}
            className="justify-end"
          />
        ),
        cell: ({ row }) => (
          <div className="flex w-full justify-end">
            <ProductStockAlertBadge level={row.original.stockAlert} t={t} />
          </div>
        ),
        meta: TEXT_END_META,
      }),
    ],
    [byProduct, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: tableRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) =>
      row.id ?? (row.platform.trim().toLowerCase() || row.label || 'row'),
  })

  if (rows.length === 0 && !isFetching && !showWhenEmpty) return null

  return (
    <section className="flex flex-col gap-3">
      <SettingsSectionHeader
        title={
          title ??
          (byProduct
            ? t('productsDetailInventoryByProductTitle')
            : t('productsDetailInventoryByChannelTitle'))
        }
      />
      {isFetching ? (
        <Skeleton className="h-32 w-full" aria-hidden />
      ) : (
        <DataTable
          table={table}
          variant="plain"
          density="compact"
          tableWidth="full"
          isLoading={false}
          isFetching={false}
          hasEverLoaded
          scrollClassName=""
          emptyContent={
            <EmptyState size="sm" icon="channels" title={t('reportsNoData')} />
          }
          skeletonRowCount={3}
        />
      )}
    </section>
  )
}

type ProductDetailInventoryByChannelProps = {
  detail: ProductDetailApi
  t: ShellT
  isFetching?: boolean
}

export function ProductDetailInventoryByChannel({
  detail,
  t,
  isFetching = false,
}: ProductDetailInventoryByChannelProps) {
  const rows = useMemo(() => inventoryRowsFromProductDetail(detail), [detail])
  return <InventoryByChannelTable rows={rows} t={t} isFetching={isFetching} />
}

type GroupInventoryByChannelProps = {
  group: ProductLinkGroupApi
  t: ShellT
  isFetching?: boolean
}

export function GroupInventoryByChannel({
  group,
  t,
  isFetching = false,
}: GroupInventoryByChannelProps) {
  const insight = useGroupInsight()
  const byProduct = insight.dimension === 'product'

  const rows = useMemo(() => {
    if (byProduct) {
      return inventoryRowsFromGroupMembers(insight.filteredMembers, group)
    }

    if (insight.allSelected) return inventoryRowsFromProductGroup(group)

    const platforms = new Set(
      insight.filteredMembers
        .map((member) => member.platform.trim().toLowerCase())
        .filter(Boolean),
    )
    return inventoryRowsFromProductGroup(group).filter((row) =>
      platforms.has(row.platform.trim().toLowerCase()),
    )
  }, [byProduct, group, insight.allSelected, insight.filteredMembers])

  return (
    <InventoryByChannelTable
      rows={rows}
      t={t}
      isFetching={isFetching}
      dimension={byProduct ? 'product' : 'channel'}
      showWhenEmpty
    />
  )
}
