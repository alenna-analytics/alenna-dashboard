import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { shellT } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import type { ProductLinkSuggestionApi } from '@/lib/types/product-links'
import { DashboardPage, pageSubtitleClassName, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { Card, CardContent } from '@/ui/card'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'
import { StatusPill } from '@/ui/status-pill'

import { ProductPlatformLogoName } from '../product-platform-logo-name'
import { ProductTableThumb } from '../product-table-thumb'
import { VinculacionPickerSheet } from './VinculacionPickerSheet'
import {
  useAcceptProductLinkSuggestionMutation,
  useProductLinkRefreshOnEnter,
  useProductLinkSuggestionsQuery,
  useRejectProductLinkSuggestionMutation,
} from './use-product-link-queries'

function VinculacionInboxSkeleton({ label }: { label: string }) {
  return (
    <ul className="flex flex-col gap-3" role="status" aria-label={label}>
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={index}>
          <Card size="sm" variant="solid">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <SuggestionProductSkeleton />
                <span className="hidden text-text-tertiary sm:inline">↔</span>
                <SuggestionProductSkeleton />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-[26px] w-16 rounded-md" />
                <Skeleton className="h-[26px] w-16 rounded-md" />
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}

function SuggestionProductSkeleton() {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Skeleton className="size-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40 max-w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function VinculacionInboxPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const t = (key: Parameters<typeof shellT>[1]) => shellT(lang, key)
  const canEdit = can(me, 'products.edit')
  const suggestionsQuery = useProductLinkSuggestionsQuery()
  const page = suggestionsQuery.data
  const { searching, refresh } = useProductLinkRefreshOnEnter(
    page?.stale,
    page?.current_job_id ?? null,
    t,
  )
  const accept = useAcceptProductLinkSuggestionMutation()
  const reject = useRejectProductLinkSuggestionMutation()
  const [pickerOpen, setPickerOpen] = useState(false)

  const items = page?.items ?? []

  return (
    <DashboardPage className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className={pageTitleClassName}>{t('productsNavVinculacion')}</h1>
          <p className={pageSubtitleClassName}>{t('productsVinculacionSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="tiny"
            loading={searching}
            icon={<Sparkles aria-hidden />}
            onClick={() => {
              void refresh.mutateAsync('button').catch(() => {
                toast.error(t('productsVinculacionSearchFailed'))
              })
            }}
          >
            {searching
              ? t('productsVinculacionSearching')
              : t('productsVinculacionSearchButton')}
          </Button>
          {canEdit ? (
            <Button type="button" variant="accent" size="tiny" onClick={() => setPickerOpen(true)}>
              {t('productsVinculacionLinkManual')}
            </Button>
          ) : null}
        </div>
      </header>

      {suggestionsQuery.isLoading && page === undefined ? (
        <VinculacionInboxSkeleton label={t('productsVinculacionLoading')} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="products"
          title={t('productsVinculacionEmptyTitle')}
          description={t('productsVinculacionEmptyDescription')}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <SuggestionCard
                item={item}
                t={t}
                canEdit={canEdit}
                accepting={accept.isPending}
                rejecting={reject.isPending}
                onAccept={() => {
                  void accept.mutateAsync(item.id).then((group) => {
                    void navigate(`/dashboard/products/vinculacion/${group.id}`)
                  })
                }}
                onReject={() => {
                  void reject.mutateAsync(item.id)
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <VinculacionPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        t={t}
        onCreated={(groupId) => {
          setPickerOpen(false)
          void navigate(`/dashboard/products/vinculacion/${groupId}`)
        }}
      />
    </DashboardPage>
  )
}

function SuggestionCard({
  item,
  t,
  canEdit,
  accepting,
  rejecting,
  onAccept,
  onReject,
}: {
  item: ProductLinkSuggestionApi
  t: (key: Parameters<typeof shellT>[1]) => string
  canEdit: boolean
  accepting: boolean
  rejecting: boolean
  onAccept: () => void
  onReject: () => void
}) {
  const kindLabel =
    item.kind === 'sku' ? t('productsVinculacionKindSku') : t('productsVinculacionKindName')
  return (
    <Card size="sm" variant="solid">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SuggestionProduct product={item.product_a} t={t} />
          <span className="hidden text-text-tertiary sm:inline">↔</span>
          <SuggestionProduct product={item.product_b} t={t} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill variant="neutral">{kindLabel}</StatusPill>
          {canEdit ? (
            <>
              <Button type="button" variant="outline" size="tiny" disabled={rejecting} onClick={onReject}>
                {t('productsVinculacionReject')}
              </Button>
              <Button type="button" variant="default" size="tiny" disabled={accepting} onClick={onAccept}>
                {t('productsVinculacionAccept')}
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function SuggestionProduct({
  product,
  t,
}: {
  product: ProductLinkSuggestionApi['product_a']
  t: (key: Parameters<typeof shellT>[1]) => string
}) {
  const slug = product.platform.trim().toLowerCase()
  return (
    <Link
      to={`/dashboard/products/${product.product_id}`}
      className="flex min-w-0 flex-1 items-center gap-2"
    >
      <ProductTableThumb url={product.image_url} alt={product.title} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{product.title}</p>
        <ProductPlatformLogoName platformSlug={slug} t={t} className="mt-1" />
      </div>
    </Link>
  )
}
