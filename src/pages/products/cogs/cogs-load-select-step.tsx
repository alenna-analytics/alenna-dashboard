import { useEffect, useMemo, useRef, useState } from 'react'
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
  useCogsLoadFilterMatchesInfiniteQuery,
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
  added,
}: {
  row: ProductCostBulkRowApi
  t: (key: ShellStringKey) => string
  onAdd: (productId: string) => void
  adding: boolean
  added: boolean
}) {
  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--table-row-hover-bg)]">
      <div className="min-w-0">
        <p className="truncate font-medium">{row.parent_title}</p>
        <p className="truncate text-xs text-text-secondary">{matchRowLabel(row)}</p>
      </div>
      <Button
        type="button"
        variant={added ? 'outline' : 'accent'}
        size="sm"
        className="shrink-0"
        disabled={adding || added}
        onClick={() => onAdd(row.product_id)}
      >
        {added ? t('productsCogsLoadAdded') : t('productsCogsLoadAddOne')}
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

  const filterParams = useMemo(
    () => buildCogsLoadFilterSearchParams(q, filters, { limit: MATCH_PAGE_SIZE, offset: 0 }),
    [q, filters],
  )

  const matchesQuery = useCogsLoadFilterMatchesInfiniteQuery(
    loadId,
    filterParams,
    true,
    MATCH_PAGE_SIZE,
  )
  const { fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, data } = matchesQuery
  const addByFilterMutation = useAddCogsLoadItemsByFilterMutation(loadId)
  const addItemsMutation = useAddCogsLoadItemsMutation(loadId)
  const removeMutation = useRemoveCogsLoadItemMutation(loadId)
  const removeAllMutation = useRemoveAllCogsLoadItemsMutation(loadId)

  const loadProductIds = useMemo(
    () => new Set(detail.items.map((item) => item.product_id)),
    [detail.items],
  )

  const matchTotal = data?.pages[0]?.total ?? 0
  const matchItems = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  )
  const visibleMatchItems = useMemo(
    () => matchItems.filter((row) => !loadProductIds.has(row.product_id)),
    [matchItems, loadProductIds],
  )
  const showInitialSkeleton = isLoading && visibleMatchItems.length === 0

  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage()
        }
      },
      { rootMargin: '120px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, visibleMatchItems.length])

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
          offset: 0,
        }),
      )
      toast.success(t('productsCogsLoadItemsAdded'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('productsCogsLoadAddFailed'))
    }
  }

  const addAllMatches = async () => {
    try {
      await addByFilterMutation.mutateAsync(
        buildAddByFilterBody(q, filters, true, { limit: 200, offset: 0 }),
      )
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
          }}
          t={t}
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('productsSearchPlaceholder')}
          className="w-full max-w-none"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-4">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-border-subtle lg:max-h-full">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-muted/30 px-3 py-2">
            <p className="text-xs font-medium text-text-secondary">
              {t('productsCogsLoadMatchPreview')} ·{' '}
              {showInitialSkeleton
                ? '…'
                : t('productsCogsLoadMatchCount').replace('{count}', String(matchTotal))}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="success"
                size="sm"
                disabled={adding || showInitialSkeleton || visibleMatchItems.length === 0}
                onClick={() => void addCurrentPage()}
              >
                {t('productsCogsLoadAddMatches')}
              </Button>
              <Button
                type="button"
                variant="success"
                size="sm"
                disabled={adding || showInitialSkeleton || matchTotal === 0}
                onClick={() => void addAllMatches()}
              >
                {t('productsCogsLoadAddAll')}
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            {showInitialSkeleton ? (
              <ProductListSkeleton />
            ) : visibleMatchItems.length === 0 ? (
              <p className="px-3 py-4 text-sm text-text-secondary">{t('productsCogsLoadMatchEmpty')}</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {visibleMatchItems.map((row) => (
                  <MatchPreviewRow
                    key={row.product_id}
                    row={row}
                    t={t}
                    adding={adding}
                    added={loadProductIds.has(row.product_id)}
                    onAdd={(productId) => void addOneProduct(productId)}
                  />
                ))}
              </ul>
            )}
            {isFetchingNextPage ? (
              <ProductListSkeleton rows={3} />
            ) : null}
            <div ref={loadMoreRef} className="h-px shrink-0" aria-hidden />
          </div>
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
