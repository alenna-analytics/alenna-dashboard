import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, X } from 'lucide-react'
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
import type {
  ProductLinkSuggestionApi,
  ProductLinkSuggestionProductApi,
} from '@/lib/types/product-links'
import { Button } from '@/ui/button'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { DataTablePagination } from '@/ui/data-table/data-table-pagination'
import { EmptyState } from '@/ui/empty-state'
import { StatusPill } from '@/ui/status-pill'

import { ProductPlatformLogoName } from '../product-platform-logo-name'
import { ProductTableThumb } from '../product-table-thumb'
import {
  primaryProductImageUrl,
  uniquePlatformSlugs,
  VINCULACION_DETAIL_ROW_GRID,
} from './vinculacion-table-helpers'

type ShellT = (key: ShellStringKey) => string

type VinculacionSuggestionsTableProps = {
  items: ProductLinkSuggestionApi[]
  t: ShellT
  canEdit: boolean
  isLoading: boolean
  isFetching: boolean
  hasEverLoaded: boolean
  busy: boolean
  acceptingId: string | null
  rejectingId: string | null
  onAccept: (suggestionId: string) => void
  onReject: (suggestionId: string) => void
  total?: number
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
}

export function VinculacionSuggestionsTable({
  items,
  t,
  canEdit,
  isLoading,
  isFetching,
  hasEverLoaded,
  busy,
  acceptingId,
  rejectingId,
  onAccept,
  onReject,
  total,
  pagination,
  onPaginationChange,
}: VinculacionSuggestionsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const expandedRowIds = useMemo(
    () => (expandedId ? new Set([expandedId]) : new Set<string>()),
    [expandedId],
  )
  const columns = useMemo(() => createColumns({ t, expandedId }), [expandedId, t])
  const showPagination = Boolean(pagination && onPaginationChange && total !== undefined)
  const pageCount = showPagination
    ? Math.max(1, Math.ceil((total ?? 0) / (pagination?.pageSize ?? 15)))
    : 1

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: items,
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
          title={t('productsVinculacionEmptyTitle')}
          description={t('productsVinculacionEmptyDescription')}
        />
      }
      tableWidth="full"
      fixedLayout
      expandedRowIds={expandedRowIds}
      onRowClick={(item) => {
        setExpandedId((current) => (current === item.id ? null : item.id))
      }}
      renderExpandedContent={(item) => (
        <SuggestionExpandedDetail
          item={item}
          t={t}
          canEdit={canEdit}
          busy={busy}
          accepting={acceptingId === item.id}
          rejecting={rejectingId === item.id}
          onAccept={() => onAccept(item.id)}
          onReject={() => onReject(item.id)}
        />
      )}
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
  expandedId: string | null
}

function createColumns({ t, expandedId }: CreateColumnsArgs): ColumnDef<ProductLinkSuggestionApi>[] {
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
        const title = proposedGroupTitle(row.original)
        return (
          <div className="flex items-center gap-2">
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-text-tertiary transition-transform duration-300 ease-out motion-reduce:transition-none',
                expandedId === row.original.id ? 'rotate-0' : '-rotate-90',
              )}
              aria-hidden
            />
            <ProductTableThumb url={suggestionImageUrl(row.original)} alt={title} />
          </div>
        )
      },
    },
    {
      id: 'name',
      accessorFn: (row) => proposedGroupTitle(row),
      meta: {
        headerClassName: 'w-[40%] min-w-0 [&>div]:justify-start',
        cellClassName: 'w-[40%] min-w-0 overflow-hidden [&>div]:justify-start',
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsColProduct')} />
      ),
      cell: ({ row }) => {
        const title = proposedGroupTitle(row.original)
        return (
          <span className="block min-w-0 truncate font-medium text-text-primary" title={title}>
            {title}
          </span>
        )
      },
    },
    {
      id: 'matchType',
      accessorFn: (row) => row.kind,
      enableSorting: false,
      meta: {
        headerClassName: 'w-[20%] min-w-0 [&>div]:justify-start',
        cellClassName: 'w-[20%] min-w-0 overflow-hidden [&>div]:justify-start',
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsVinculacionColMatchType')} />
      ),
      cell: ({ row }) => (
        <StatusPill variant={row.original.kind === 'sku' ? 'info' : 'neutral'}>
          {suggestionKindLabel(row.original, t)}
        </StatusPill>
      ),
    },
    {
      id: 'productCount',
      accessorFn: (row) => suggestionProducts(row).length,
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
          {suggestionProductCountLabel(row.original, t)}
        </span>
      ),
    },
    {
      id: 'channels',
      accessorFn: (row) => suggestionPlatforms(row).join(','),
      enableSorting: false,
      meta: {
        headerClassName: 'w-[20%] min-w-0 [&>div]:justify-start',
        cellClassName: 'w-[20%] min-w-0 overflow-hidden align-middle [&>div]:items-center [&>div]:justify-start',
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsColChannels')} />
      ),
      cell: ({ row }) => {
        const platforms = suggestionPlatforms(row.original)
        if (platforms.length === 0) return null
        return (
          <div className="flex w-full min-w-0 flex-col justify-center gap-1">
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
        )
      },
    },
  ]
}

type SuggestionExpandedDetailProps = {
  item: ProductLinkSuggestionApi
  t: ShellT
  canEdit: boolean
  busy: boolean
  accepting: boolean
  rejecting: boolean
  onAccept: () => void
  onReject: () => void
}

function SuggestionExpandedDetail({
  item,
  t,
  canEdit,
  busy,
  accepting,
  rejecting,
  onAccept,
  onReject,
}: SuggestionExpandedDetailProps) {
  const products = suggestionProducts(item)
  return (
    <div className="border-b border-border-subtle">
      <ul className="divide-y divide-border-subtle">
        {products.map((product) => (
          <li key={product.product_id}>
            <SuggestionProductLine product={product} t={t} />
          </li>
        ))}
      </ul>
      {canEdit ? (
        <div className="flex justify-end gap-2 border-t border-border-subtle px-4 py-3">
          <Button
            type="button"
            variant="destructive"
            size="tiny"
            disabled={busy}
            loading={rejecting}
            onClick={(event) => {
              event.stopPropagation()
              onReject()
            }}
          >
            <X aria-hidden />
            {t('productsVinculacionReject')}
          </Button>
          <Button
            type="button"
            variant="accent"
            size="tiny"
            disabled={busy}
            loading={accepting}
            onClick={(event) => {
              event.stopPropagation()
              onAccept()
            }}
          >
            <Check aria-hidden />
            {t('productsVinculacionAccept')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

type SuggestionProductLineProps = {
  product: ProductLinkSuggestionProductApi
  t: ShellT
}

function SuggestionProductLine({ product, t }: SuggestionProductLineProps) {
  const slug = product.platform.trim().toLowerCase()
  return (
    <div
      className={cn(
        VINCULACION_DETAIL_ROW_GRID,
        'py-2.5 hover:bg-[var(--table-row-hover-bg)]',
      )}
    >
      <div className="flex items-center justify-start px-2 pl-8">
        <ProductTableThumb url={product.image_url} alt={product.title} />
      </div>
      <div className="min-w-0 overflow-hidden px-2">
        <Link
          to={`/dashboard/products/${product.product_id}`}
          className="block min-w-0 truncate font-medium text-text-primary"
          title={product.title}
          onClick={(event) => event.stopPropagation()}
        >
          {product.title}
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

function proposedGroupTitle(item: ProductLinkSuggestionApi): string {
  const products = suggestionProducts(item)
  const shopify = products.find((product) => product.platform.trim().toLowerCase() === 'shopify')
  return (shopify?.title ?? products[0]?.title ?? '').trim()
}

function suggestionKindLabel(item: ProductLinkSuggestionApi, t: ShellT): string {
  return item.kind === 'sku' ? t('productsVinculacionKindSku') : t('productsVinculacionKindName')
}

function suggestionProducts(item: ProductLinkSuggestionApi): ProductLinkSuggestionProductApi[] {
  return [item.product_a, item.product_b]
}

function suggestionProductCountLabel(item: ProductLinkSuggestionApi, t: ShellT): string {
  return t('productsVinculacionMatchProductCount').replace(
    '{count}',
    String(suggestionProducts(item).length),
  )
}

function suggestionImageUrl(item: ProductLinkSuggestionApi): string | null {
  const products = suggestionProducts(item)
  const shopify = products.find((product) => product.platform.trim().toLowerCase() === 'shopify')
  return primaryProductImageUrl([
    shopify?.image_url ?? null,
    ...products.map((product) => product.image_url),
  ])
}

function suggestionPlatforms(item: ProductLinkSuggestionApi): string[] {
  return uniquePlatformSlugs(suggestionProducts(item).map((product) => product.platform))
}
