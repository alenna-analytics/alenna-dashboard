import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { CogsBulkLoadDetailApi } from '@/lib/types/cogs-load'
import type { ProductCostBulkRowApi } from '@/lib/types/catalog'
import {
  EMPTY_PRODUCTS_LIST_FILTERS,
  type ProductsListFiltersState,
} from '@/pages/products/products-list-filter-state'
import { ProductsListFilters } from '@/pages/products/products-list-filters'
import { ProductPlatformLogoName } from '@/pages/products/product-platform-logo-name'
import { Button } from '@/ui/button'
import { Checkbox } from '@/ui/checkbox'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'

import {
  buildAddByFilterBody,
  buildCogsLoadFilterSearchParams,
} from './cogs-load-filter-params'
import { distinctVariantLabel } from './cogs-load-product-label'
import { CogsLoadRemoveItemButton } from './cogs-load-remove-button'
import {
  useAddCogsLoadItemsByFilterMutation,
  useAddCogsLoadItemsMutation,
  useCogsLoadFilterMatchesInfiniteQuery,
  useRemoveAllCogsLoadItemsMutation,
  useRemoveCogsLoadItemsMutation,
} from './use-cogs-load-queries'

const MATCH_PAGE_SIZE = 50
const SKELETON_ROWS = 8
const ID_CHUNK_SIZE = 500

type CogsLoadSelectStepProps = {
  loadId: string
  detail: CogsBulkLoadDetailApi
  t: (key: ShellStringKey) => string
}

type CogsLoadProductLabelProps = {
  parentTitle: string
  variantLabel: string | null
  platforms: string[]
  t: (key: ShellStringKey) => string
}

function CogsLoadProductLabel({
  parentTitle,
  variantLabel,
  platforms,
  t,
}: CogsLoadProductLabelProps) {
  const variant = distinctVariantLabel(parentTitle, variantLabel)
  return (
    <div className="min-w-0 flex-1">
      <p className="flex min-w-0 items-center gap-1 overflow-hidden font-medium">
        <span className="min-w-0 truncate">{parentTitle}</span>
        {variant ? (
          <>
            <ChevronRight className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
            <span className="min-w-0 truncate font-normal text-text-secondary">{variant}</span>
          </>
        ) : null}
      </p>
      {platforms.length > 0 ? (
        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          {platforms.map((platform) => (
            <ProductPlatformLogoName
              key={platform}
              platformSlug={platform}
              t={t}
              logoClassName="size-3.5"
              textClassName="text-xs text-text-secondary"
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ProductRowSkeleton() {
  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Skeleton className="size-4 shrink-0 rounded-[4px]" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-[72%]" />
          <Skeleton className="h-3 w-[45%]" />
        </div>
      </div>
      <Skeleton className="h-[26px] w-[4.5rem] shrink-0 rounded-md" />
    </li>
  )
}

export function ProductListSkeleton({ rows = SKELETON_ROWS }: { rows?: number }) {
  return (
    <ul className="divide-y divide-border-subtle">
      {Array.from({ length: rows }, (_, index) => (
        <ProductRowSkeleton key={index} />
      ))}
    </ul>
  )
}

async function mutateIdChunks(
  ids: string[],
  mutate: (chunk: string[]) => Promise<unknown>,
) {
  for (let index = 0; index < ids.length; index += ID_CHUNK_SIZE) {
    await mutate(ids.slice(index, index + ID_CHUNK_SIZE))
  }
}

function usePanelSelection(visibleIds: string[], totalCount: number) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [allMatching, setAllMatching] = useState(false)
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => new Set())

  const clear = useCallback(() => {
    setAllMatching(false)
    setExcludedIds(new Set())
    setRowSelection({})
  }, [])

  const allMatchingActive =
    allMatching && totalCount > 0 && excludedIds.size < totalCount

  const explicitSelectedCount = useMemo(
    () => visibleIds.filter((id) => rowSelection[id]).length,
    [visibleIds, rowSelection],
  )

  const selectedCount = allMatchingActive
    ? Math.max(0, totalCount - excludedIds.size)
    : explicitSelectedCount

  const headerChecked = useMemo(() => {
    if (visibleIds.length === 0) return false
    if (allMatchingActive) return visibleIds.every((id) => !excludedIds.has(id))
    return visibleIds.every((id) => rowSelection[id])
  }, [visibleIds, allMatchingActive, excludedIds, rowSelection])

  const headerIndeterminate = useMemo(() => {
    if (visibleIds.length === 0) return false
    if (allMatchingActive) {
      const selectedVisible = visibleIds.filter((id) => !excludedIds.has(id)).length
      return selectedVisible > 0 && selectedVisible < visibleIds.length
    }
    const selectedVisible = visibleIds.filter((id) => rowSelection[id]).length
    return selectedVisible > 0 && selectedVisible < visibleIds.length
  }, [visibleIds, allMatchingActive, excludedIds, rowSelection])

  const onHeaderToggle = useCallback(
    (checked: boolean) => {
      if (allMatchingActive) {
        setExcludedIds((prev) => {
          const next = new Set(prev)
          for (const id of visibleIds) {
            if (checked) next.delete(id)
            else next.add(id)
          }
          return next
        })
        return
      }
      setRowSelection((prev) => {
        const next = { ...prev }
        for (const id of visibleIds) {
          if (checked) next[id] = true
          else delete next[id]
        }
        return next
      })
    },
    [allMatchingActive, visibleIds],
  )

  const onRowToggle = useCallback(
    (id: string, checked: boolean) => {
      if (allMatchingActive) {
        setExcludedIds((prev) => {
          const next = new Set(prev)
          if (checked) next.delete(id)
          else next.add(id)
          return next
        })
        return
      }
      setRowSelection((prev) => ({ ...prev, [id]: checked }))
    },
    [allMatchingActive],
  )

  const isRowSelected = useCallback(
    (id: string) => {
      if (allMatchingActive) return !excludedIds.has(id)
      return Boolean(rowSelection[id])
    },
    [allMatchingActive, excludedIds, rowSelection],
  )

  const activateSelectAllMatching = useCallback(() => {
    setAllMatching(true)
    setExcludedIds(new Set())
    setRowSelection({})
  }, [])

  const showSelectAllMatching =
    selectedCount > 0 && !allMatchingActive && totalCount > selectedCount && totalCount > 0

  const selectedIds = useMemo(() => {
    if (allMatchingActive) return visibleIds.filter((id) => !excludedIds.has(id))
    return visibleIds.filter((id) => rowSelection[id])
  }, [allMatchingActive, visibleIds, excludedIds, rowSelection])

  const excludedIdList = useMemo(() => Array.from(excludedIds), [excludedIds])

  return {
    selectedCount,
    headerChecked,
    headerIndeterminate,
    onHeaderToggle,
    onRowToggle,
    isRowSelected,
    activateSelectAllMatching,
    showSelectAllMatching,
    selectedIds,
    allMatching: allMatchingActive,
    excludedIdList,
    clear,
  }
}

function MatchPreviewRow({
  row,
  t,
  selected,
  onSelectedChange,
  onAdd,
  adding,
  added,
}: {
  row: ProductCostBulkRowApi
  t: (key: ShellStringKey) => string
  selected: boolean
  onSelectedChange: (checked: boolean) => void
  onAdd: (productId: string) => void
  adding: boolean
  added: boolean
}) {
  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--table-row-hover-bg)]">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Checkbox
          aria-label={t('productsTableSelectRow')}
          checked={selected}
          onCheckedChange={onSelectedChange}
          size="md"
          variant="accent"
        />
        <CogsLoadProductLabel
          parentTitle={row.parent_title}
          variantLabel={row.variant_label}
          platforms={row.platforms ?? []}
          t={t}
        />
      </div>
      <Button
        type="button"
        variant="text"
        size="tiny"
        className="shrink-0"
        disabled={adding || added}
        icon={added ? undefined : <Plus aria-hidden />}
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
  selected,
  onSelectedChange,
  onRemove,
  removing,
}: {
  item: CogsBulkLoadDetailApi['items'][number]
  t: (key: ShellStringKey) => string
  selected: boolean
  onSelectedChange: (checked: boolean) => void
  onRemove: (productId: string) => void
  removing: boolean
}) {
  return (
    <li className="flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--table-row-hover-bg)]">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Checkbox
          aria-label={t('productsTableSelectRow')}
          checked={selected}
          onCheckedChange={onSelectedChange}
          size="md"
          variant="accent"
        />
        <CogsLoadProductLabel
          parentTitle={item.parent_title}
          variantLabel={item.variant_label}
          platforms={item.platforms ?? []}
          t={t}
        />
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
  const filterKey = filterParams.toString()

  const matchesQuery = useCogsLoadFilterMatchesInfiniteQuery(
    loadId,
    filterParams,
    true,
    MATCH_PAGE_SIZE,
  )
  const { fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, data } = matchesQuery
  const addByFilterMutation = useAddCogsLoadItemsByFilterMutation(loadId)
  const addItemsMutation = useAddCogsLoadItemsMutation(loadId)
  const removeItemsMutation = useRemoveCogsLoadItemsMutation(loadId)
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
  const visibleMatchIds = useMemo(
    () => visibleMatchItems.map((row) => row.product_id),
    [visibleMatchItems],
  )
  const loadItemIds = useMemo(
    () => detail.items.map((item) => item.product_id),
    [detail.items],
  )
  const showInitialSkeleton = isLoading && visibleMatchItems.length === 0

  const matchSel = usePanelSelection(visibleMatchIds, matchTotal)
  const loadSel = usePanelSelection(loadItemIds, detail.items.length)
  const clearMatchSelection = matchSel.clear

  useEffect(() => {
    clearMatchSelection()
  }, [filterKey, clearMatchSelection])

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('productsCogsLoadAddFailed'))
    }
  }

  const addSelectedMatches = async () => {
    try {
      if (matchSel.allMatching) {
        await addByFilterMutation.mutateAsync({
          body: buildAddByFilterBody(
            q,
            filters,
            true,
            { limit: 200, offset: 0 },
            matchSel.excludedIdList,
          ),
          filterKey,
          pageSize: MATCH_PAGE_SIZE,
        })
      } else {
        await mutateIdChunks(matchSel.selectedIds, (chunk) => addItemsMutation.mutateAsync(chunk))
      }
      toast.success(t('productsCogsLoadItemsAdded'))
      matchSel.clear()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('productsCogsLoadAddFailed'))
    }
  }

  const removeSelectedFromLoad = async () => {
    try {
      if (loadSel.allMatching && loadSel.excludedIdList.length === 0) {
        await removeAllMutation.mutateAsync()
      } else {
        await mutateIdChunks(loadSel.selectedIds, (chunk) => removeItemsMutation.mutateAsync(chunk))
      }
      toast.success(t('productsCogsLoadRemoveAllDone'))
      loadSel.clear()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('productsCogsLoadRemoveAllFailed'))
    }
  }

  const adding = addByFilterMutation.isPending || addItemsMutation.isPending
  const removing = removeItemsMutation.isPending || removeAllMutation.isPending

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="w-full shrink-0 overflow-x-auto px-1 pb-5">
        <ProductsListFilters
          filters={filters}
          channelsOnly
          onFiltersChange={(patch) => {
            setFilters((prev) => ({ ...prev, ...patch }))
          }}
          searchQ={q}
          onSearchQChange={setQ}
          t={t}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-4">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-border-subtle lg:max-h-full">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-muted/30 px-3 py-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Checkbox
                aria-label={t('productsTableSelectAll')}
                checked={matchSel.headerIndeterminate ? false : matchSel.headerChecked}
                indeterminate={matchSel.headerIndeterminate}
                onCheckedChange={matchSel.onHeaderToggle}
                disabled={showInitialSkeleton || visibleMatchIds.length === 0}
                size="md"
                variant="accent"
              />
              <p className="text-xs font-medium text-text-secondary">
                {t('productsCogsLoadMatchPreview')} ·{' '}
                {showInitialSkeleton
                  ? '…'
                  : t('productsCogsLoadMatchCount').replace('{count}', String(matchTotal))}
              </p>
              {matchSel.showSelectAllMatching ? (
                <button
                  type="button"
                  className="text-xs font-medium text-text-primary underline-offset-2 hover:underline"
                  onClick={matchSel.activateSelectAllMatching}
                >
                  {t('productsTableSelectAllWithCount').replace('{count}', String(matchTotal))}
                </button>
              ) : null}
            </div>
            <Button
              type="button"
              variant="default"
              size="tiny"
              loading={addByFilterMutation.isPending || addItemsMutation.isPending}
              disabled={adding || matchSel.selectedCount === 0}
              onClick={() => void addSelectedMatches()}
            >
              {t('productsCogsLoadAddSelected')}
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            {showInitialSkeleton ? (
              <ProductListSkeleton />
            ) : visibleMatchItems.length === 0 ? (
              <div className="p-3">
                <EmptyState size="sm" icon="products" title={t('productsCogsLoadMatchEmpty')} />
              </div>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {visibleMatchItems.map((row) => (
                  <MatchPreviewRow
                    key={row.product_id}
                    row={row}
                    t={t}
                    selected={matchSel.isRowSelected(row.product_id)}
                    onSelectedChange={(checked) => matchSel.onRowToggle(row.product_id, checked)}
                    adding={Boolean(
                      addItemsMutation.isPending && addItemsMutation.variables?.includes(row.product_id),
                    )}
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
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-muted/30 px-3 py-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Checkbox
                aria-label={t('productsTableSelectAll')}
                checked={loadSel.headerIndeterminate ? false : loadSel.headerChecked}
                indeterminate={loadSel.headerIndeterminate}
                onCheckedChange={loadSel.onHeaderToggle}
                disabled={detail.items.length === 0}
                size="md"
                variant="accent"
              />
              <p className="text-xs font-medium text-text-secondary">
                {t('productsCogsLoadInLoad').replace('{count}', String(detail.items.length))}
              </p>
              {loadSel.showSelectAllMatching ? (
                <button
                  type="button"
                  className="text-xs font-medium text-text-primary underline-offset-2 hover:underline"
                  onClick={loadSel.activateSelectAllMatching}
                >
                  {t('productsTableSelectAllWithCount').replace('{count}', String(detail.items.length))}
                </button>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="tiny"
              className="shrink-0 text-destructive"
              loading={removeItemsMutation.isPending || removeAllMutation.isPending}
              disabled={removing || loadSel.selectedCount === 0}
              onClick={() => void removeSelectedFromLoad()}
            >
              {t('productsCogsLoadRemoveSelected')}
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            {detail.items.length === 0 ? (
              <div className="p-3">
                <EmptyState size="sm" icon="products" title={t('productsCogsLoadSelectEmpty')} />
              </div>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {detail.items.map((item) => (
                  <LoadItemRow
                    key={item.product_id}
                    item={item}
                    t={t}
                    selected={loadSel.isRowSelected(item.product_id)}
                    onSelectedChange={(checked) => loadSel.onRowToggle(item.product_id, checked)}
                    removing={Boolean(
                      removeItemsMutation.isPending &&
                        removeItemsMutation.variables?.includes(item.product_id),
                    )}
                    onRemove={(productId) => {
                      void removeItemsMutation.mutateAsync([productId]).catch((error: unknown) => {
                        toast.error(
                          error instanceof Error ? error.message : t('productsCogsLoadRemoveAllFailed'),
                        )
                      })
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
