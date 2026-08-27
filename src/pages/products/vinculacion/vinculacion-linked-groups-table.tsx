import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Eye, MoreVertical, Unlink } from 'lucide-react'
import { getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'
import type { ProductLinkGroupApi, ProductLinkGroupMemberApi } from '@/lib/types/product-links'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { EmptyState } from '@/ui/empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

import { productsLinkingGroupPath } from '../products-inner-nav'
import { ProductPlatformLogoName } from '../product-platform-logo-name'
import { ProductTableThumb } from '../product-table-thumb'

type ShellT = (key: ShellStringKey) => string

type VinculacionLinkedGroupsTableProps = {
  groups: ProductLinkGroupApi[]
  t: ShellT
  canEdit: boolean
  isLoading: boolean
  isFetching: boolean
  hasEverLoaded: boolean
  unlinkingId: string | null
  onUnlink: (groupId: string) => void
}

const TEXT_CELL_META = {
  headerClassName: '[&>div]:justify-start',
  cellClassName: '[&>div]:justify-start',
} as const

export function VinculacionLinkedGroupsTable({
  groups,
  t,
  canEdit,
  isLoading,
  isFetching,
  hasEverLoaded,
  unlinkingId,
  onUnlink,
}: VinculacionLinkedGroupsTableProps) {
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const expandedRowIds = useMemo(
    () => (expandedId ? new Set([expandedId]) : new Set<string>()),
    [expandedId],
  )
  const columns = useMemo(
    () => createColumns({ t, canEdit, unlinkingId, onUnlink, navigate, expandedId }),
    [canEdit, expandedId, navigate, onUnlink, t, unlinkingId],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: groups,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      isFetching={isFetching}
      hasEverLoaded={hasEverLoaded}
      emptyContent={
        <EmptyState
          icon="products"
          title={t('productsVinculacionLinkedEmptyTitle')}
          description={t('productsVinculacionLinkedEmptyDescription')}
        />
      }
      tableWidth="full"
      expandedRowIds={expandedRowIds}
      onRowClick={(group) => {
        setExpandedId((current) => (current === group.id ? null : group.id))
      }}
      renderExpandedContent={(group) => <LinkedGroupExpandedDetail group={group} t={t} />}
    />
  )
}

type CreateColumnsArgs = {
  t: ShellT
  canEdit: boolean
  unlinkingId: string | null
  onUnlink: (groupId: string) => void
  navigate: ReturnType<typeof useNavigate>
  expandedId: string | null
}

function createColumns({
  t,
  canEdit,
  unlinkingId,
  onUnlink,
  navigate,
  expandedId,
}: CreateColumnsArgs): ColumnDef<ProductLinkGroupApi>[] {
  return [
    {
      id: 'group',
      accessorFn: (row) => row.title,
      meta: TEXT_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsVinculacionTabLinked')} />
      ),
      cell: ({ row }) => {
        const group = row.original
        const expanded = expandedId === group.id
        return (
          <div className="flex min-w-0 items-center gap-2">
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-text-tertiary transition-transform',
                expanded ? 'rotate-0' : '-rotate-90',
              )}
              aria-hidden
            />
            <div className="min-w-0 truncate">
              <span className="font-medium text-text-primary">{group.title}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: 'productCount',
      accessorFn: (row) => row.members.length,
      enableSorting: false,
      meta: {
        headerClassName: '[&>div]:justify-end',
        cellClassName: 'w-[7.5rem] text-right [&>div]:justify-end',
      },
      header: () => <span className="sr-only">{t('productsVinculacionSectionProducts')}</span>,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-text-tertiary">
          {t('productsVinculacionMatchProductCount').replace(
            '{count}',
            String(row.original.members.length),
          )}
        </span>
      ),
    },
    {
      id: 'actions',
      enableSorting: false,
      meta: { headerClassName: '[&>div]:justify-end', cellClassName: 'w-12 text-right [&>div]:justify-end' },
      header: () => <span className="sr-only">{t('productsTableActions')}</span>,
      cell: ({ row }) => {
        const group = row.original
        return (
          <div
            className="flex justify-end"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-full border border-transparent text-foreground outline-none',
                  'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30',
                )}
                aria-label={t('productsTableActions')}
              >
                <MoreVertical className="size-4 shrink-0" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t('productsTableActions')}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      void navigate(productsLinkingGroupPath(group.id))
                    }}
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    <span>{t('productsVinculacionViewGroup')}</span>
                  </DropdownMenuItem>
                  {canEdit ? (
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={unlinkingId !== null}
                      onClick={() => onUnlink(group.id)}
                    >
                      <Unlink className="h-4 w-4" aria-hidden />
                      <span>{t('productsVinculacionUnlink')}</span>
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}

function LinkedGroupExpandedDetail({
  group,
  t,
}: {
  group: ProductLinkGroupApi
  t: ShellT
}) {
  return (
    <ul className="divide-y divide-border-subtle border-b border-border-subtle">
      {group.members.map((member) => (
        <li key={member.product_id}>
          <LinkedMemberLine product={member} t={t} />
        </li>
      ))}
    </ul>
  )
}

function LinkedMemberLine({
  product,
  t,
}: {
  product: ProductLinkGroupMemberApi
  t: ShellT
}) {
  const slug = product.platform.trim().toLowerCase()
  const label = product.variant_label || product.title
  return (
    <div className="flex min-w-0 items-center gap-3 py-2.5 pr-4 pl-8 hover:bg-[var(--table-row-hover-bg)]">
      <Link
        to={`/dashboard/products/${product.product_id}`}
        className="flex min-w-0 flex-1 items-center gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <ProductTableThumb url={product.image_url} alt={label} />
        <span className="min-w-0 truncate font-medium">{label}</span>
      </Link>
      <ProductPlatformLogoName platformSlug={slug} t={t} className="shrink-0" />
    </div>
  )
}
