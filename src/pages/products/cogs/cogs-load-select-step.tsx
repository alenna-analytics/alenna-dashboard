import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { CogsBulkLoadDetailApi } from '@/lib/types/cogs-load'
import type { ProductCostBulkRowApi } from '@/lib/types/catalog'
import {
  EMPTY_PRODUCTS_LIST_FILTERS,
  type ProductsListFiltersState,
} from '@/pages/products/products-list-filter-state'
import { ProductsListFilters } from '@/pages/products/products-list-filters'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Skeleton } from '@/ui/skeleton'

import { buildAddByFilterBody, buildCogsLoadFilterSearchParams } from './cogs-load-filter-params'
import { CogsLoadRemoveItemButton } from './cogs-load-remove-button'
import {
  useAddCogsLoadItemsByFilterMutation,
  useAddCogsLoadItemsMutation,
  useCogsLoadFilterMatchesQuery,
  useRemoveAllCogsLoadItemsMutation,
  useRemoveCogsLoadItemMutation,
} from './use-cogs-load-queries'

const MATCH_PAGE_SIZE = 50
const SKELETON_ROWS = 8

type CogsLoadSelectStepProps = {
  loadId: string
  detail: CogsBulkLoadDetailApi
  t: (key: ShellStringKey) => string
}

function matchRowLabel(row: ProductCostBulkRowApi): string {
  const parts = [row.variant_label, row.internal_sku].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : row.parent_title
}

function ProductRowSkeleton() {
  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2.5">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-[72%]" />
        <Skeleton className="h-3 w-[45%]" />
      </div>
      <Skeleton className="h-8 w-[4.5rem] shrink-0 rounded-md" />
    </li>
  )
}

function ProductListSkeleton({ rows = SKELETON_ROWS }: { rows?: number }) {
  return (
    <ul className="divide-y divide-border-subtle">
      {Array.from({ length: rows }, (_, index) => (
        <ProductRowSkeleton key={index} />
      ))}
    </ul>
  )
}

function MatchPreviewRow({
  row,
  t,
  onAdd,
  adding,
}: {
  row: ProductCostBulkRowApi
  t: (key: ShellStringKey) => string
  onAdd: (productId: string) => void
  adding: boolean
}) {
  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--table-row-hover-bg)]">
      <div className="min-w-0">
        <p className="truncate font-medium">{row.parent_title}</p>
        <p className="truncate text-xs text-text-secondary">{matchRowLabel(row)}</p>
      </div>
      <Button
        type="button"
        variant="accent"
        size="sm"
        className="shrink-0"
        disabled={adding}
        onClick={() => onAdd(row.product_id)}
      >
        {t('productsCogsLoadAddOne')}
      </Button>
    </li>
  )
}

function LoadItemRow({
  item,
  t,
  onRemove,
  removing,
}: {
  item: CogsBulkLoadDetailApi['items'][number]
  t: (key: ShellStringKey) => string
  onRemove: (productId: string) => void
  removing: boolean
}) {
  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--table-row-hover-bg)]">
      <div className="min-w-0">
        <p className="truncate font-medium">{item.parent_title}</p>
        <p className="truncate text-xs text-text-secondary">
          {[item.variant_label, item.internal_sku].filter(Boolean).join(' · ')}
        </p>
      </div>
      <CogsLoadRemoveItemButton
        t={t}
        disabled={removing}
        onClick={() => onRemove(item.product_id)}
      />
    </li>
  )
}

export function CogsLoadSelectStep({ loadId, detail, t }: CogsLoadSelectStepProps) {
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<ProductsListFiltersState>(EMPTY_PRODUCTS_LIST_FILTERS)
  const [matchOffset, setMatchOffset] = useState(0)

  const filterParams = useMemo(
    () =>
      buildCogsLoadFilterSearchParams(q, filters, {
        limit: MATCH_PAGE_SIZE,
        offset: matchOffset,
      }),
    [q, filters, matchOffset],
  )

  const matchesQuery = useCogsLoadFilterMatchesQuery(loadId, filterParams, true)
  const addByFilterMutation = useAddCogsLoadItemsByFilterMutation(loadId)
  const addItemsMutation = useAddCogsLoadItemsMutation(loadId)
  const removeMutation = useRemoveCogsLoadItemMutation(loadId)
  const removeAllMutation = useRemoveAllCogsLoadItemsMutation(loadId)

  const matchTotal = matchesQuery.data?.total ?? 0
  const matchItems = matchesQuery.data?.items ?? []
  const matchPageCount = Math.max(1, Math.ceil(matchTotal / MATCH_PAGE_SIZE))
  const matchPage = Math.floor(matchOffset / MATCH_PAGE_SIZE) + 1
  const showMatchSkeleton = matchesQuery.isLoading || matchesQuery.isFetching

  const addOneProduct = async (productId: string) => {
    try {
      await addItemsMutation.mutateAsync([productId])
      toast.success(t('productsCogsLoadItemsAdded'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('productsCogsLoadAddFailed'))
    }
  }

  const addCurrentPage = async () => {
    try {
      await addByFilterMutation.mutateAsync(
        buildAddByFilterBody(q, filters, false, {
          limit: MATCH_PAGE_SIZE,
          offset: matchOffset,
        }),
      )
      toast.success(t('productsCogsLoadItemsAdded'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('productsCogsLoadAddFailed'))
    }
  }

  const addAllMatches = async () => {
    try {
      await addByFilterMutation.mutateAsync(buildAddByFilterBody(q, filters, true, { limit: 200, offset: 0 }))
      toast.success(t('productsCogsLoadItemsAdded'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('productsCogsLoadAddFailed'))
    }
  }

  const removeAllFromLoad = async () => {
    try {
      await removeAllMutation.mutateAsync()
      toast.success(t('productsCogsLoadRemoveAllDone'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('productsCogsLoadRemoveAllFailed'))
    }
  }

  const adding = addByFilterMutation.isPending || addItemsMutation.isPending
  const removing = removeMutation.isPending || removeAllMutation.isPending

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-3 px-1 pb-3">
        <ProductsListFilters
          filters={filters}
          channelsOnly
          onFiltersChange={(patch) => {
            setFilters((prev) => ({ ...prev, ...patch }))
            setMatchOffset(0)
          }}
          t={t}
        />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setMatchOffset(0)
          }}
          placeholder={t('productsSearchPlaceholder')}
          className="w-full max-w-none"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-4">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-border-subtle lg:max-h-full">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-muted/30 px-3 py-2">
            <p className="text-xs font-medium text-text-secondary">
              {t('productsCogsLoadMatchPreview')} ·{' '}
              {showMatchSkeleton
                ? '…'
                : t('productsCogsLoadMatchCount').replace('{count}', String(matchTotal))}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="success"
                size="sm"
                disabled={adding || showMatchSkeleton || matchItems.length === 0}
                onClick={() => void addCurrentPage()}
              >
                {t('productsCogsLoadAddMatches')}
              </Button>
              <Button
                type="button"
                variant="success"
                size="sm"
                disabled={adding || showMatchSkeleton || matchTotal === 0}
                onClick={() => void addAllMatches()}
              >
                {t('productsCogsLoadAddAll')}
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            {showMatchSkeleton ? (
              <ProductListSkeleton />
            ) : matchItems.length === 0 ? (
              <p className="px-3 py-4 text-sm text-text-secondary">{t('productsCogsLoadMatchEmpty')}</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {matchItems.map((row) => (
                  <MatchPreviewRow
                    key={row.product_id}
                    row={row}
                    t={t}
                    adding={adding}
                    onAdd={(productId) => void addOneProduct(productId)}
                  />
                ))}
              </ul>
            )}
          </div>
          {matchTotal > MATCH_PAGE_SIZE ? (
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border-subtle px-3 py-2">
              <p className="text-xs text-text-secondary">
                {t('productsCogsLoadMatchPage')
                  .replace('{page}', String(matchPage))
                  .replace('{pages}', String(matchPageCount))}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={matchOffset === 0}
                  aria-label={t('productsCogsLoadMatchPrev')}
                  onClick={() => setMatchOffset((o) => Math.max(0, o - MATCH_PAGE_SIZE))}
                >
                  <ChevronLeft className="size-4 shrink-0" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={matchOffset + MATCH_PAGE_SIZE >= matchTotal}
                  aria-label={t('productsCogsLoadMatchNext')}
                  onClick={() => setMatchOffset((o) => o + MATCH_PAGE_SIZE)}
                >
                  <ChevronRight className="size-4 shrink-0" aria-hidden />
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-border-subtle lg:max-h-full">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle bg-muted/30 px-3 py-2">
            <p className="text-xs font-medium text-text-secondary">
              {t('productsCogsLoadInLoad').replace('{count}', String(detail.items.length))}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-destructive"
              disabled={removing || detail.items.length === 0}
              onClick={() => void removeAllFromLoad()}
            >
              {t('productsCogsLoadRemoveAll')}
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            {detail.items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-text-secondary">{t('productsCogsLoadSelectEmpty')}</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {detail.items.map((item) => (
                  <LoadItemRow
                    key={item.product_id}
                    item={item}
                    t={t}
                    removing={removing}
                    onRemove={(productId) => {
                      void removeMutation.mutateAsync(productId)
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
