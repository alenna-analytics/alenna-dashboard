import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Eye, MoreVertical, Unlink } from 'lucide-react'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
} from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'
import type { ProductLinkGroupApi, ProductLinkGroupMemberApi } from '@/lib/types/product-links'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { DataTablePagination } from '@/ui/data-table/data-table-pagination'
import { EmptyState } from '@/ui/empty-state'
import { StatusPill } from '@/ui/status-pill'
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
import {
  primaryProductImageUrl,
  uniquePlatformSlugs,
  VINCULACION_DETAIL_ROW_GRID,
} from './vinculacion-table-helpers'

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
  /** When set with pagination handlers, shows total + pager like the products table. */
  total?: number
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
}

export function VinculacionLinkedGroupsTable({
  groups,
  t,
  canEdit,
  isLoading,
  isFetching,
  hasEverLoaded,
  unlinkingId,
  onUnlink,
  total,
  pagination,
  onPaginationChange,
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
  const showPagination = Boolean(pagination && onPaginationChange && total !== undefined)
  const pageCount = showPagination
    ? Math.max(1, Math.ceil((total ?? 0) / (pagination?.pageSize ?? 15)))
    : 1

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: groups,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    manualPagination: showPagination,
    pageCount: showPagination ? pageCount : undefined,
    rowCount: showPagination ? total : undefined,
    onPaginationChange: showPagination ? onPaginationChange : undefined,
    state: showPagination && pagination ? { pagination } : undefined,
  })

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      isFetching={isFetching}
      hasEverLoaded={hasEverLoaded}
      skeletonRowCount={pagination?.pageSize ?? 10}
      emptyContent={
        <EmptyState
          icon="products"
          title={t('productsVinculacionLinkedEmptyTitle')}
          description={t('productsVinculacionLinkedEmptyDescription')}
        />
      }
      tableWidth="full"
      fixedLayout
      scrollClassName="overflow-x-auto"
      expandedRowIds={expandedRowIds}
      onRowClick={(group) => {
        setExpandedId((current) => (current === group.id ? null : group.id))
      }}
      renderExpandedContent={(group) => <LinkedGroupExpandedDetail group={group} t={t} />}
      footer={
        showPagination ? (
          <DataTablePagination
            table={table}
            labels={{
              ariaPrevious: t('productsTablePrev'),
              ariaNext: t('productsTableNext'),
              pageStatus: (page, totalPages) =>
                `${t('productsTablePageLabel')} ${page} ${t('productsTableOf')} ${totalPages}`,
              pageButtonAria: (page, totalPages) =>
                `${t('productsTablePageLabel')} ${page} ${t('productsTableOf')} ${totalPages}`,
              goToPageLabel: t('productsTableGoToPage'),
              goToPageAria: t('productsTableGoToPageAria'),
            }}
          />
        ) : undefined
      }
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
      id: 'image',
      enableSorting: false,
      meta: {
        headerClassName: 'w-[4.5rem] [&>div]:justify-start',
        cellClassName: 'w-[4.5rem] [&>div]:justify-start',
      },
      header: () => <span className="sr-only">{t('productsColImage')}</span>,
      cell: ({ row }) => {
        const group = row.original
        return (
          <div className="flex items-center gap-2">
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-text-tertiary transition-transform duration-300 ease-out motion-reduce:transition-none',
                expandedId === group.id ? 'rotate-0' : '-rotate-90',
              )}
              aria-hidden
            />
            <ProductTableThumb url={groupImageUrl(group)} alt={group.title} />
          </div>
        )
      },
    },
    {
      id: 'name',
      accessorFn: (row) => row.title,
      meta: {
        headerClassName: 'w-[40%] min-w-0 [&>div]:justify-start',
        cellClassName: 'w-[40%] min-w-0 overflow-hidden [&>div]:justify-start',
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsColProduct')} />
      ),
      cell: ({ row }) => {
        const group = row.original
        return (
          <Link
            to={productsLinkingGroupPath(group.id)}
            className="block min-w-0 truncate font-medium text-text-primary underline underline-offset-2 hover:text-text-primary"
            title={group.title}
            onClick={(event) => event.stopPropagation()}
          >
            {group.title}
          </Link>
        )
      },
    },
    {
      id: 'matchType',
      enableSorting: false,
      meta: {
        headerClassName: 'w-[20%] min-w-0 [&>div]:justify-start',
        cellClassName: 'w-[20%] min-w-0 overflow-hidden [&>div]:justify-start',
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsVinculacionColMatchType')} />
      ),
      cell: () => (
        <StatusPill variant="neutral">{t('productsVinculacionKindLinked')}</StatusPill>
      ),
    },
    {
      id: 'productCount',
      accessorFn: (row) => row.members.length,
      enableSorting: false,
      meta: {
        headerClassName: 'w-[20%] min-w-0 [&>div]:justify-start',
        cellClassName: 'w-[20%] min-w-0 whitespace-nowrap [&>div]:justify-start',
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsVinculacionSectionProducts')} />
      ),
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
      id: 'channels',
      accessorFn: (row) => groupPlatforms(row).join(','),
      enableSorting: false,
      meta: {
        headerClassName: 'w-[20%] min-w-0 [&>div]:justify-start',
        cellClassName: 'w-[20%] min-w-0 overflow-hidden align-middle [&>div]:items-center [&>div]:justify-start',
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsColChannels')} />
      ),
      cell: ({ row }) => {
        const group = row.original
        const platforms = groupPlatforms(group)
        return (
          <div className="flex w-full min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col justify-center gap-1">
              {platforms.map((slug) => (
                <ProductPlatformLogoName
                  key={slug}
                  platformSlug={slug}
                  t={t}
                  className="min-w-0"
                  textClassName="truncate"
                />
              ))}
            </div>
            <div
              className="shrink-0"
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
    <ul className="divide-y divide-border-subtle border-b border-border-subtle bg-[var(--table-expanded-row-bg)]">
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
    <div
      className={cn(
        VINCULACION_DETAIL_ROW_GRID,
        'bg-[var(--table-expanded-row-bg)] py-2.5',
      )}
    >
      <div className="flex items-center justify-start px-2 pl-8">
        <ProductTableThumb url={product.image_url} alt={label} />
      </div>
      <div className="min-w-0 overflow-hidden px-2">
        <Link
          to={`/dashboard/products/${product.product_id}`}
          className="block min-w-0 truncate font-medium text-text-primary"
          title={label}
          onClick={(event) => event.stopPropagation()}
        >
          {label}
        </Link>
      </div>
      <div aria-hidden />
      <div aria-hidden />
      <div className="min-w-0 overflow-hidden px-2">
        <ProductPlatformLogoName platformSlug={slug} t={t} className="min-w-0" textClassName="truncate" />
      </div>
    </div>
  )
}

function groupImageUrl(group: ProductLinkGroupApi): string | null {
  const shopify = group.members.find(
    (member) => member.platform.trim().toLowerCase() === 'shopify',
  )
  return primaryProductImageUrl([
    shopify?.image_url ?? null,
    ...group.members.map((member) => member.image_url),
  ])
}

function groupPlatforms(group: ProductLinkGroupApi): string[] {
  return uniquePlatformSlugs(group.members.map((member) => member.platform))
}
