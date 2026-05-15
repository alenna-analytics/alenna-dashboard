import { useState } from "react"

import { shellT } from "@/lib/i18n/shell-strings"
import { useLanguage } from "@/shell/providers/language-provider"
import { DashboardPage } from "@/shell/layout/dashboard-page"
import { ProductsDataTable } from "./ProductsDataTable"

export function ProductsListPage() {
  const { lang } = useLanguage()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)
  const [q, setQ] = useState("")

  const empty = <p className="text-sm text-text-secondary">{t("productsCatalogEmptyTitle")}</p>

  const errorContent = <p className="text-destructive">{t("productsCatalogLoadError")}</p>

  return (
    <DashboardPage className="flex flex-1 flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="min-w-0 space-y-2">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-4xl">
            {t("productsPageTitle")}
          </h1>
          <p className="max-w-2xl text-sm text-text-secondary">{t("productsPageSubtitle")}</p>
        </div>
      </header>

      <ProductsDataTable
        searchQ={q}
        onSearchQChange={setQ}
        t={t}
        emptyContent={empty}
        errorContent={errorContent}
      />
    </DashboardPage>
  )
}
