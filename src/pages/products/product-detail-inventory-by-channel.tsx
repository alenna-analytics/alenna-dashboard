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
  inventoryRowsFromProductDetail,
  inventoryRowsFromProductGroup,
  type InventoryByChannelRow,
} from './product-detail-inventory-rows'
import { productPlatformLabel } from './product-platform-label'
import { ProductPlatformLogoName } from './product-platform-logo-name'
import { useGroupInsight } from './vinculacion/use-group-insight'

type ShellT = (key: ShellStringKey) => string

type InventoryByChannelTableProps = {
  rows: InventoryByChannelRow[]
  t: ShellT
  isFetching?: boolean
  title?: string
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
  showWhenEmpty = false,
}: InventoryByChannelTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'channel',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('homeFilterChannels')} />
        ),
        cell: ({ row }) => (
          <>
            <ProductPlatformLogoName
              platformSlug={row.original.platform}
              t={t}
              className="text-sm"
            />
            <span className="sr-only">{productPlatformLabel(row.original.platform, t)}</span>
          </>
        ),
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
    [t],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.platform.trim().toLowerCase(),
  })

  if (rows.length === 0 && !isFetching && !showWhenEmpty) return null

  return (
    <section className="flex flex-col gap-3">
      <SettingsSectionHeader title={title ?? t('productsDetailInventoryByChannelTitle')} />
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
  const rows = useMemo(() => {
    if (insight.allSelected) return inventoryRowsFromProductGroup(group)

    if (insight.dimension === 'product') {
      const bySlug = new Map<string, InventoryByChannelRow>()
      for (const member of insight.filteredMembers) {
        const key = member.platform.trim().toLowerCase()
        if (!key) continue
        const existing = bySlug.get(key)
        const stock = member.stock_quantity ?? 0
        if (!existing) {
          bySlug.set(key, {
            platform: member.platform,
            stock,
            velocity: null,
            inventoryDays: null,
          })
          continue
        }
        existing.stock += stock
      }
      return [...bySlug.values()]
    }

    const platforms = new Set(
      insight.filteredMembers.map((member) => member.platform.trim().toLowerCase()).filter(Boolean),
    )
    return inventoryRowsFromProductGroup(group).filter((row) =>
      platforms.has(row.platform.trim().toLowerCase()),
    )
  }, [group, insight.allSelected, insight.dimension, insight.filteredMembers])
  return (
    <InventoryByChannelTable
      rows={rows}
      t={t}
      isFetching={isFetching}
      showWhenEmpty
    />
  )
}
