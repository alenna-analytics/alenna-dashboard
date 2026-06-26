import { useNavigate } from 'react-router-dom'
import { useState } from "react"

import { shellT } from "@/lib/i18n/shell-strings"
import { useLanguage } from "@/shell/providers/language-provider"
import { DashboardPage, pageTitleClassName } from "@/shell/layout/dashboard-page"
import { Button } from "@/ui/button"
import { ProductsDataTable } from "./ProductsDataTable"
import { EMPTY_PRODUCTS_LIST_FILTERS, type ProductsListFiltersState } from "./products-list-filter-state"
import { ProductsListFilters } from "./products-list-filters"
import { useCreateCogsLoadMutation } from "./cogs/use-cogs-load-queries"

export function ProductsListPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)
  const createLoadMutation = useCreateCogsLoadMutation()
  const [q, setQ] = useState("")
  const [filters, setFilters] = useState<ProductsListFiltersState>(EMPTY_PRODUCTS_LIST_FILTERS)

  const empty = <p className="text-sm text-text-secondary">{t("productsCatalogEmptyTitle")}</p>

  const errorContent = <p className="text-destructive">{t("productsCatalogLoadError")}</p>

  return (
    <DashboardPage className="flex flex-1 flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <h1 className={pageTitleClassName}>
              {t("productsPageTitle")}
            </h1>
            <p className="max-w-2xl text-sm text-text-secondary">{t("productsPageSubtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void navigate('/dashboard/products/cogs')}>
              {t('productsGoToCogs')}
            </Button>
            <Button
              type="button"
              disabled={createLoadMutation.isPending}
              onClick={() => {
                void createLoadMutation.mutateAsync().then((load) => {
                  void navigate(`/dashboard/products/cogs/loads/${load.id}`)
                })
              }}
            >
              {t('productsCogsLoadNew')}
            </Button>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2">
          <ProductsListFilters
            filters={filters}
            onFiltersChange={(patch: Partial<ProductsListFiltersState>) =>
              setFilters((prev) => ({ ...prev, ...patch }))
            }
            t={t}
          />
        </div>
      </header>

      <ProductsDataTable
        searchQ={q}
        onSearchQChange={setQ}
        filters={filters}
        t={t}
        emptyContent={empty}
        errorContent={errorContent}
      />
    </DashboardPage>
  )
}
