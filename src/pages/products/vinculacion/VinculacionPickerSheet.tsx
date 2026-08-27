import { ChevronRight, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkCandidateApi } from '@/lib/types/product-links'
import { cn } from '@/lib/utils'
import {
  EMPTY_PRODUCTS_LIST_FILTERS,
  type ProductsListFiltersState,
} from '@/pages/products/products-list-filter-state'
import { ProductsListFilters } from '@/pages/products/products-list-filters'
import { Button } from '@/ui/button'
import { Checkbox } from '@/ui/checkbox'
import { EmptyState } from '@/ui/empty-state'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'
import { Skeleton } from '@/ui/skeleton'

import { splitDisplayTitle } from '../cogs/cogs-load-product-label'
import { ProductPlatformLogoName } from '../product-platform-logo-name'
import { ProductTableThumb } from '../product-table-thumb'
import {
  useCreateProductLinkGroupMutation,
  useProductLinkCandidatesQuery,
} from './use-product-link-queries'

type VinculacionPickerMode = 'create' | 'add'

type VinculacionPickerSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  t: (key: ShellStringKey) => string
  mode?: VinculacionPickerMode
  occupiedPlatforms?: string[]
  onCreated?: () => void
  onAdd?: (productIds: string[]) => Promise<unknown>
  adding?: boolean
}

type CandidateLabelProps = {
  item: ProductLinkCandidateApi
  t: (key: ShellStringKey) => string
}

function CandidateLabel({ item, t }: CandidateLabelProps) {
  const { parentTitle, variantLabel } = splitDisplayTitle(item.title)
  return (
    <div className="min-w-0 flex-1">
      <p className="flex min-w-0 items-center gap-1 overflow-hidden text-sm font-medium">
        <span className="min-w-0 truncate">{parentTitle}</span>
        {variantLabel ? (
          <>
            <ChevronRight className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
            <span className="min-w-0 truncate font-normal text-text-secondary">{variantLabel}</span>
          </>
        ) : null}
      </p>
      <ProductPlatformLogoName
        platformSlug={item.platform}
        t={t}
        logoClassName="size-3.5"
        textClassName="text-xs text-text-secondary"
      />
    </div>
  )
}

function CandidateRowSkeleton() {
  return (
    <li className="flex items-center gap-2 px-2 py-2">
      <Skeleton className="size-4 shrink-0 rounded" />
      <Skeleton className="size-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-[70%]" />
        <Skeleton className="h-3 w-[40%]" />
      </div>
    </li>
  )
}

export function VinculacionPickerSheet({
  open,
  onOpenChange,
  t,
  mode = 'create',
  occupiedPlatforms = [],
  onCreated,
  onAdd,
  adding = false,
}: VinculacionPickerSheetProps) {
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<ProductsListFiltersState>(EMPTY_PRODUCTS_LIST_FILTERS)
  const [selected, setSelected] = useState<ProductLinkCandidateApi[]>([])
  const candidatesQuery = useProductLinkCandidatesQuery(q, filters.platforms, open)
  const create = useCreateProductLinkGroupMutation()
  const items = candidatesQuery.data?.items ?? []

  const occupied = useMemo(
    () => new Set(occupiedPlatforms.map((platform) => platform.trim().toLowerCase()).filter(Boolean)),
    [occupiedPlatforms],
  )
  const selectedPlatforms = useMemo(
    () => new Set(selected.map((item) => item.platform.trim().toLowerCase())),
    [selected],
  )
  const blockedPlatforms = useMemo(() => {
    const next = new Set(occupied)
    for (const platform of selectedPlatforms) next.add(platform)
    return next
  }, [occupied, selectedPlatforms])
  const isAdd = mode === 'add'
  const minSelected = isAdd ? 1 : 2
  const submitting = create.isPending || adding

  function resetPicker() {
    setQ('')
    setFilters(EMPTY_PRODUCTS_LIST_FILTERS)
    setSelected([])
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetPicker()
    onOpenChange(next)
  }

  function toggle(item: ProductLinkCandidateApi) {
    const existing = selected.find((row) => row.product_id === item.product_id)
    if (existing) {
      setSelected(selected.filter((row) => row.product_id !== item.product_id))
      return
    }
    const slug = item.platform.trim().toLowerCase()
    if (occupied.has(slug)) return
    const withoutPlatform = selected.filter(
      (row) => row.platform.trim().toLowerCase() !== slug,
    )
    setSelected([...withoutPlatform, item])
  }

  function removeSelected(productId: string) {
    setSelected(selected.filter((row) => row.product_id !== productId))
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="max-w-[min(64rem,100%)]">
        <div className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>
              {isAdd ? t('productsVinculacionPickerAddTitle') : t('productsVinculacionPickerTitle')}
            </SheetTitle>
          </SheetHeader>
          <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(11rem,0.42fr)] md:grid-rows-none md:grid-cols-[minmax(0,1.65fr)_minmax(17rem,0.9fr)]">
              <div className="flex min-h-0 min-w-0 flex-col border-b border-[var(--shell-divider)] md:border-r md:border-b-0">
                <div className="w-full shrink-0 overflow-x-auto px-4 py-3">
                  <ProductsListFilters
                    filters={filters}
                    onFiltersChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
                    t={t}
                    channelsOnly
                    searchQ={q}
                    onSearchQChange={setQ}
                    searchPlaceholderKey="productsVinculacionPickerSearch"
                  />
                </div>
                {candidatesQuery.isLoading && items.length === 0 ? (
                  <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2" aria-hidden>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <CandidateRowSkeleton key={index} />
                    ))}
                  </ul>
                ) : items.length === 0 ? (
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                    <EmptyState size="sm" icon="products" title={t('productsVinculacionPickerEmpty')} />
                  </div>
                ) : (
                  <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                    {items.map((item) => {
                      const isSelected = selected.some((row) => row.product_id === item.product_id)
                      const platformTaken =
                        blockedPlatforms.has(item.platform.trim().toLowerCase()) && !isSelected
                      return (
                        <li key={item.product_id}>
                          <div
                            role="button"
                            tabIndex={platformTaken ? -1 : 0}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left',
                              platformTaken
                                ? 'cursor-not-allowed opacity-40'
                                : 'cursor-pointer hover:bg-[var(--table-row-hover-bg)]',
                              isSelected && 'bg-muted',
                            )}
                            onClick={() => {
                              if (!platformTaken) toggle(item)
                            }}
                            onKeyDown={(event) => {
                              if (platformTaken) return
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                toggle(item)
                              }
                            }}
                          >
                            <Checkbox
                              aria-label={item.title}
                              checked={isSelected}
                              disabled={platformTaken}
                              onCheckedChange={() => toggle(item)}
                              onClick={(event) => event.stopPropagation()}
                              size="md"
                              variant="accent"
                            />
                            <ProductTableThumb url={item.image_url} alt={item.title} />
                            <CandidateLabel item={item} t={t} />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              <aside className="flex min-h-0 min-w-0 flex-col bg-muted/20">
                <div className="flex h-[var(--shell-chrome-header-height)] shrink-0 items-center border-b border-[var(--shell-divider)] px-4">
                  <p className="min-w-0 truncate text-sm font-medium text-text-primary">
                    {t('productsVinculacionPickerSelected')}
                    {selected.length > 0 ? ` (${selected.length})` : ''}
                  </p>
                </div>
                {selected.length === 0 ? (
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                    <EmptyState
                      size="sm"
                      icon="products"
                      title={t(
                        isAdd
                          ? 'productsVinculacionPickerAddEmpty'
                          : 'productsVinculacionPickerSelectedEmpty',
                      )}
                      className="min-h-[8rem] border-0 py-6"
                    />
                  </div>
                ) : (
                  <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                    {selected.map((item) => (
                      <li
                        key={item.product_id}
                        className="flex items-center gap-2 rounded-md px-2 py-2"
                      >
                        <ProductTableThumb url={item.image_url} alt={item.title} />
                        <CandidateLabel item={item} t={t} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          aria-label={t('productsVinculacionPickerRemoveAria')}
                          onClick={() => removeSelected(item.product_id)}
                        >
                          <X className="size-4 shrink-0" aria-hidden />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t('productsDetailSheetCancel')}
            </Button>
            <Button
              type="button"
              variant="accent"
              disabled={selected.length < minSelected || submitting}
              loading={submitting}
              onClick={() => {
                const productIds = selected.map((item) => item.product_id)
                if (isAdd) {
                  void onAdd?.(productIds)
                    .then(() => {
                      resetPicker()
                      handleOpenChange(false)
                    })
                    .catch(() => toast.error(t('productsVinculacionLinkFailed')))
                  return
                }
                void create
                  .mutateAsync(productIds)
                  .then(() => {
                    resetPicker()
                    onCreated?.()
                  })
                  .catch(() => toast.error(t('productsVinculacionLinkFailed')))
              }}
            >
              {isAdd ? t('productsVinculacionConfirmAdd') : t('productsVinculacionConfirmLink')}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
