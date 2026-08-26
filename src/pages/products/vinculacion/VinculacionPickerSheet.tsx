import { ChevronRight, Search, X } from 'lucide-react'
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
import { Input } from '@/ui/input'
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

type VinculacionPickerSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  t: (key: ShellStringKey) => string
  onCreated: (groupId: string) => void
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
  onCreated,
}: VinculacionPickerSheetProps) {
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<ProductsListFiltersState>(EMPTY_PRODUCTS_LIST_FILTERS)
  const [selected, setSelected] = useState<ProductLinkCandidateApi[]>([])
  const candidatesQuery = useProductLinkCandidatesQuery(q, filters.platforms, open)
  const create = useCreateProductLinkGroupMutation()
  const items = candidatesQuery.data?.items ?? []

  const selectedPlatforms = useMemo(
    () => new Set(selected.map((item) => item.platform)),
    [selected],
  )

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
    const withoutPlatform = selected.filter((row) => row.platform !== item.platform)
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
            <SheetTitle>{t('productsVinculacionPickerTitle')}</SheetTitle>
          </SheetHeader>
          <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(11rem,0.42fr)] md:grid-rows-none md:grid-cols-[minmax(0,1.65fr)_minmax(17rem,0.9fr)]">
              <div className="flex min-h-0 min-w-0 flex-col border-b border-[var(--shell-divider)] md:border-r md:border-b-0">
                <div className="flex shrink-0 flex-wrap items-center gap-2 overflow-x-auto px-4 py-3">
                  <div className="relative min-w-[12rem] flex-1">
                    <Search
                      className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      value={q}
                      onChange={(event) => setQ(event.target.value)}
                      placeholder={t('productsVinculacionPickerSearch')}
                      aria-label={t('productsVinculacionPickerSearch')}
                      className="h-7 border-border-default bg-white pl-8 text-xs placeholder:text-xs focus-visible:border-border-emphasis focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {q.trim() ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="absolute top-1/2 right-0.5 z-10 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={t('productsSearchClearAria')}
                        onClick={() => setQ('')}
                      >
                        <X className="size-4 shrink-0" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                  <ProductsListFilters
                    filters={filters}
                    onFiltersChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
                    t={t}
                    channelsOnly
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
                      const platformTaken = selectedPlatforms.has(item.platform) && !isSelected
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
                      title={t('productsVinculacionPickerSelectedEmpty')}
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
              disabled={selected.length < 2 || create.isPending}
              loading={create.isPending}
              onClick={() => {
                void create
                  .mutateAsync(selected.map((item) => item.product_id))
                  .then((group) => {
                    resetPicker()
                    onCreated(group.id)
                  })
                  .catch(() => toast.error(t('productsVinculacionLinkFailed')))
              }}
            >
              {t('productsVinculacionConfirmLink')}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
