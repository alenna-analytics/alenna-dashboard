import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layers } from 'lucide-react'

import type { DataTableColumn } from '@/components/composed/data-table'
import { PaginatedDataTable } from '@/components/composed/paginated-data-table'
import { ProductThumbnail } from '@/components/composed/product-thumbnail'
import { StateTag } from '@/components/composed/state-tag'
import { useCurrency } from '@/components/providers/currency-provider'
import { useLanguage } from '@/components/providers/language-provider'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCatalogProducts } from '@/hooks/use-analytics'
import type { CatalogProduct } from '@/lib/analytics-types'
import { dashboardT } from '@/lib/dashboard-strings'
import { cn } from '@/lib/utils'

const EMPTY_COLUMNS: DataTableColumn<CatalogProduct>[] = []

export function CatalogProductsPage() {
  const { lang } = useLanguage()
  const t = (key: Parameters<typeof dashboardT>[1]) => dashboardT(lang, key)
  const { formatCurrencyValue, displayCurrency } = useCurrency()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const q = useCatalogProducts({ search: search.trim() || undefined, page, page_size: pageSize })

  const rows = q.data?.items ?? []
  const total = q.data?.total ?? 0

  const columns = useMemo(() => EMPTY_COLUMNS, [])

  return (
    <Card variant="solid" className="overflow-hidden border-border-subtle/80 shadow-sm">
      <CardHeader className="border-b border-border-subtle/60 bg-muted/15 pb-5">
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">{t('catalogTabList')}</p>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-semibold tabular-nums text-text-primary">{total.toLocaleString()}</span>
            <span className="text-sm text-text-secondary">{t('tableRows')}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        <div className="max-w-sm">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder={t('productsFilterSkuPlaceholder')}
            className="h-9"
          />
        </div>
        {q.isError ? (
          <p className="text-sm text-destructive">{String(q.error)}</p>
        ) : (
          <PaginatedDataTable<CatalogProduct>
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            renderRow={(row) => (
              <Link
                to={`/dashboard/products/${row.id}`}
                className={cn(
                  'flex min-h-17 items-center gap-4 px-3 py-3.5 sm:gap-5 sm:px-4',
                  'outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              >
                <ProductThumbnail
                  src={row.image_url}
                  alt={row.title}
                  size="md"
                  className="h-12 w-12 shrink-0 rounded-xl shadow-sm ring-1 ring-border-subtle/70"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-text-primary">{row.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-text-tertiary">{row.internal_sku ?? '—'}</span>
                    {row.brand ? (
                      <Badge variant="secondary" className="max-w-40 truncate font-normal">
                        {row.brand}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                  <StateTag
                    label={row.active ? t('productStatusActive') : t('productStatusInactive')}
                    tone={row.active ? 'good' : 'bad'}
                    className="font-normal"
                  />
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-border-subtle/80 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-text-secondary"
                    title={t('catalogColListings')}
                  >
                    <Layers className="size-3 opacity-70" aria-hidden />
                    <span className="tabular-nums">{row.listing_count.toLocaleString()}</span>
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-text-primary">
                    {row.cost != null
                      ? `${formatCurrencyValue(String(row.cost))} ${row.currency ?? displayCurrency}`
                      : '—'}
                  </p>
                  <p className="mt-0.5 hidden text-[11px] text-text-tertiary sm:block">{t('productsTableCostCurrent')}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5 sm:hidden">
                  <StateTag
                    label={row.active ? t('productStatusActive') : t('productStatusInactive')}
                    tone={row.active ? 'good' : 'bad'}
                  />
                </div>
              </Link>
            )}
            listBodyClassName="max-h-[25.5rem] overflow-y-auto overscroll-y-contain"
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            emptyContent={t('catalogEmptyList')}
            isLoading={q.isLoading || q.isFetching}
            columnSelectorLabel={t('tableColumns')}
            goToPageLabel={t('tableGoTo')}
            pageLabel={t('tablePage')}
            rowsLabel={t('tableRows')}
            prevLabel={t('tablePrev')}
            nextLabel={t('tableNext')}
            goLabel={t('tableGo')}
            toggleColumnsLabel={t('tableToggleColumns')}
            loadingLabel={t('tableLoadingPage')}
            selectAllColumnsLabel={t('tableSelectAllColumns')}
            deselectAllColumnsLabel={t('tableDeselectAllColumns')}
          />
        )}
      </CardContent>
    </Card>
  )
}
