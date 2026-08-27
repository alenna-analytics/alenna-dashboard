import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, X } from 'lucide-react'
import { getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'
import type {
  ProductLinkSuggestionApi,
  ProductLinkSuggestionProductApi,
} from '@/lib/types/product-links'
import { Button } from '@/ui/button'
import { DataTable } from '@/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/ui/data-table/data-table-column-header'
import { EmptyState } from '@/ui/empty-state'
import { StatusPill } from '@/ui/status-pill'

import { ProductPlatformLogoName } from '../product-platform-logo-name'
import { ProductTableThumb } from '../product-table-thumb'

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
}

const TEXT_CELL_META = {
  headerClassName: '[&>div]:justify-start',
  cellClassName: '[&>div]:justify-start',
} as const

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
}: VinculacionSuggestionsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const expandedRowIds = useMemo(
    () => (expandedId ? new Set([expandedId]) : new Set<string>()),
    [expandedId],
  )
  const columns = useMemo(() => createColumns({ t, expandedId }), [expandedId, t])

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    data: items,
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
          title={t('productsVinculacionEmptyTitle')}
          description={t('productsVinculacionEmptyDescription')}
        />
      }
      tableWidth="full"
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
      id: 'match',
      accessorFn: (row) => proposedGroupTitle(row),
      meta: TEXT_CELL_META,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('productsVinculacionTabMatches')} />
      ),
      cell: ({ row }) => {
        const item = row.original
        const expanded = expandedId === item.id
        return (
          <div className="flex min-w-0 items-center gap-2">
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-text-tertiary transition-transform',
                expanded ? 'rotate-0' : '-rotate-90',
              )}
              aria-hidden
            />
            <span className="min-w-0 truncate font-medium text-text-primary">
              {proposedGroupTitle(item)}
            </span>
            <StatusPill variant={item.kind === 'sku' ? 'info' : 'neutral'}>
              {suggestionKindLabel(item, t)}
            </StatusPill>
          </div>
        )
      },
    },
    {
      id: 'productCount',
      accessorFn: (row) => suggestionProducts(row).length,
      enableSorting: false,
      meta: {
        headerClassName: '[&>div]:justify-end',
        cellClassName: 'w-[7.5rem] text-right [&>div]:justify-end',
      },
      header: () => <span className="sr-only">{t('productsVinculacionSectionProducts')}</span>,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-text-tertiary">
          {suggestionProductCountLabel(row.original, t)}
        </span>
      ),
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
    <div className="flex min-w-0 items-center gap-3 py-2.5 pr-4 pl-8 hover:bg-[var(--table-row-hover-bg)]">
      <Link
        to={`/dashboard/products/${product.product_id}`}
        className="flex min-w-0 flex-1 items-center gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <ProductTableThumb url={product.image_url} alt={product.title} />
        <span className="min-w-0 truncate font-medium">{product.title}</span>
      </Link>
      <ProductPlatformLogoName platformSlug={slug} t={t} className="shrink-0" />
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
