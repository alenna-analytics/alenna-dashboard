import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { shellT } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { DashboardPage, pageSubtitleClassName, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { Button } from '@/ui/button'
import { EmptyState } from '@/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import { ProductsDataTable } from './ProductsDataTable'
import { EMPTY_PRODUCTS_LIST_FILTERS, type ProductsListFiltersState } from './products-list-filter-state'
import { ProductsListFilters } from './products-list-filters'
import { useCreateCogsLoadMutation } from './cogs/use-cogs-load-queries'
import { VinculacionLinkedGroupsTable } from './vinculacion/vinculacion-linked-groups-table'
import {
  useDissolveProductLinkGroupMutation,
  useProductLinkGroupsQuery,
} from './vinculacion/use-product-link-queries'
import { productsLinkingGroupPath } from './products-inner-nav'

type CatalogTab = 'products' | 'groups'

export function ProductsListPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const canEditProducts = can(me, 'products.edit')
  const canEditGroups = can(me, 'products.groups.edit')
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)
  const createLoadMutation = useCreateCogsLoadMutation()
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<ProductsListFiltersState>(EMPTY_PRODUCTS_LIST_FILTERS)
  const [catalogTab, setCatalogTab] = useState<CatalogTab>('products')
  const groupsQuery = useProductLinkGroupsQuery({ enabled: catalogTab === 'groups' })
  const dissolve = useDissolveProductLinkGroupMutation()
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)

  const empty = (
    <EmptyState
      icon="products"
      title={t('productsCatalogEmptyTitle')}
      description={
        q.trim() ? t('productsCatalogEmptySearchHint') : t('productsCatalogEmptyHint')
      }
    />
  )

  const errorContent = <p className="text-destructive">{t('productsCatalogLoadError')}</p>

  const groups = useMemo(() => groupsQuery.data?.items ?? [], [groupsQuery.data?.items])

  return (
    <DashboardPage className="flex flex-1 flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <h1 className={pageTitleClassName}>{t('productsPageTitle')}</h1>
            <p className={pageSubtitleClassName}>{t('productsPageSubtitle')}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="tiny"
              onClick={() => void navigate('/dashboard/products/cogs')}
            >
              {t('productsGoToCogs')}
            </Button>
            {canEditProducts ? (
              <Button
                type="button"
                variant="accent"
                size="tiny"
                className="shrink-0"
                loading={createLoadMutation.isPending}
                onClick={() => {
                  void createLoadMutation.mutateAsync().then((load) => {
                    void navigate(`/dashboard/products/cogs/loads/${load.id}`)
                  })
                }}
              >
                <Plus aria-hidden />
                {t('productsCogsLoadNew')}
              </Button>
            ) : null}
          </div>
        </div>
        <Tabs
          value={catalogTab}
          onValueChange={(value) => {
            if (value === 'products' || value === 'groups') setCatalogTab(value)
          }}
        >
          <TabsList variant="line">
            <TabsTrigger value="products">{t('productsCatalogTabProducts')}</TabsTrigger>
            <TabsTrigger value="groups">{t('productsCatalogTabGroups')}</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="mt-4 flex flex-col gap-3">
            <div className="w-full overflow-x-auto">
              <ProductsListFilters
                filters={filters}
                onFiltersChange={(patch: Partial<ProductsListFiltersState>) =>
                  setFilters((prev) => ({ ...prev, ...patch }))
                }
                searchQ={q}
                onSearchQChange={setQ}
                hideStatusFilter
                t={t}
              />
            </div>
            <ProductsDataTable
              searchQ={q}
              filters={filters}
              t={t}
              emptyContent={empty}
              errorContent={errorContent}
              canGroup={canEditGroups}
              onGrouped={(groupId) => void navigate(productsLinkingGroupPath(groupId))}
            />
          </TabsContent>
          <TabsContent value="groups" className="mt-4">
            <VinculacionLinkedGroupsTable
              groups={groups}
              t={t}
              canEdit={canEditGroups}
              isLoading={groupsQuery.isLoading}
              isFetching={groupsQuery.isFetching}
              hasEverLoaded={groupsQuery.data !== undefined}
              unlinkingId={unlinkingId}
              onUnlink={(groupId) => {
                setUnlinkingId(groupId)
                void dissolve
                  .mutateAsync(groupId)
                  .catch(() => toast.error(t('productsVinculacionUnlinkFailed')))
                  .finally(() => setUnlinkingId(null))
              }}
            />
          </TabsContent>
        </Tabs>
      </header>
    </DashboardPage>
  )
}
