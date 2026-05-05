import { useState } from "react"

import { shellT } from "@/lib/i18n/shell-strings"
import { useLanguage } from "@/shell/providers/language-provider"
import { DashboardPage } from "@/shell/layout/dashboard-page"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"

import { ProductsDataTable } from "./ProductsDataTable"

export function ProductsListPage() {
  const { lang } = useLanguage()
  const t = (k: Parameters<typeof shellT>[1]) => shellT(lang, k)
  const [q, setQ] = useState("")
  const [submittedQ, setSubmittedQ] = useState("")

  const empty = (
    <div className="space-y-2 text-sm text-text-secondary">
      <p className="font-medium text-text-primary">{t("productsCatalogEmptyTitle")}</p>
      <p>{t("productsCatalogEmptyHint")}</p>
      {submittedQ.trim() ? (
        <p className="text-xs text-text-tertiary">{t("productsCatalogEmptySearchHint")}</p>
      ) : null}
    </div>
  )

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

      <form
        className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault()
          setSubmittedQ(q)
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("productsSearchPlaceholder")}
          className="flex-1"
        />
        <Button type="submit" variant="secondary">
          {t("productsSearchAction")}
        </Button>
      </form>

      <ProductsDataTable submittedQ={submittedQ} t={t} emptyContent={empty} errorContent={errorContent} />
    </DashboardPage>
  )
}
