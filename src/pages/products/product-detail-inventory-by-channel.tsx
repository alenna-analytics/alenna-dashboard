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
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'

import {
  inventoryRowsFromGroupMembers,
  inventoryRowsFromProductDetail,
  inventoryRowsFromProductGroup,
  type InventoryByChannelRow,
} from './product-detail-inventory-rows'
import { productPlatformLabel } from './product-platform-label'
import { ProductPlatformLogoName } from './product-platform-logo-name'
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
        cell: ({ getValue }) => getValue().toLocaleString(),
        meta: TEXT_END_META,
      }),
      columnHelper.accessor('velocity', {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('productsDetailInventoryVelocity')}
            className="justify-end"
          />
        ),
        cell: ({ getValue }) => {
          const value = getValue()
          return value == null ? '—' : value.toFixed(2)
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
        cell: ({ getValue }) => {
          const value = getValue()
          return value == null ? '—' : value.toLocaleString()
        },
        meta: TEXT_END_META,
      }),
    ],
    [byProduct, t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: rows,
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
