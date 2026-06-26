import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { mergeLoadItemsIntoDraftStore } from '@/pages/products/bulk-cogs/bulk-cogs-draft-store'
import { BulkCogsGrid } from '@/pages/products/bulk-cogs/bulk-cogs-grid'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { Button } from '@/ui/button'
import { PageBreadcrumb } from '@/ui/page-breadcrumb'

import { useCloneCogsLoadMutation, useCogsLoadQuery } from './use-cogs-load-queries'

export function CogsLoadDetailPage() {
  const { loadId } = useParams<{ loadId: string }>()
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const t = (k: ShellStringKey) => shellT(lang, k)
  const loadQuery = useCogsLoadQuery(loadId)
  const cloneMutation = useCloneCogsLoadMutation()

  const detail = loadQuery.data

  const draftStore = useMemo(() => {
    if (!detail) return new Map()
    return mergeLoadItemsIntoDraftStore(new Map(), detail.items, detail.base_currency)
  }, [detail])

  const gridRowIds = useMemo(
    () => (detail ? detail.items.map((i) => i.product_id) : []),
    [detail],
  )

  if (!loadId || loadQuery.isLoading) {
    return (
      <DashboardPage>
        <p className="text-sm text-text-secondary">{t('bootLoadingLabel')}</p>
      </DashboardPage>
    )
  }

  if (loadQuery.isError || !detail) {
    return (
      <DashboardPage>
        <p className="text-sm text-destructive">{t('productsCogsLoadsLoadError')}</p>
      </DashboardPage>
    )
  }

  const appliedLabel = detail.load.applied_at
    ? new Date(detail.load.applied_at).toLocaleString(lang === 'es' ? 'es-MX' : 'en-US')
    : '—'

  return (
    <DashboardPage className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <header className="shrink-0 space-y-2">
        <PageBreadcrumb
          items={[
            { label: t('productsNavCogs'), to: '/dashboard/products/cogs' },
            { label: t('productsCogsLoadViewTitle') },
          ]}
          ariaLabel={t('ariaBreadcrumb')}
        />
        <h1 className={pageTitleClassName}>{t('productsCogsLoadViewTitle')}</h1>
        <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-text-tertiary">{t('productsCogsLoadColStatus')}</dt>
            <dd>{t('productsCogsLoadStatusApplied')}</dd>
          </div>
          <div>
            <dt className="text-text-tertiary">{t('productsCogsLoadAppliedBy')}</dt>
            <dd>{detail.load.applied_by_name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-text-tertiary">{t('productsCogsLoadAppliedAt')}</dt>
            <dd>{appliedLabel}</dd>
          </div>
          <div>
            <dt className="text-text-tertiary">{t('productsCogsLoadColProducts')}</dt>
            <dd>{detail.load.applied_product_count ?? detail.items.length}</dd>
          </div>
        </dl>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={cloneMutation.isPending}
          onClick={() => {
            void cloneMutation.mutateAsync(loadId).then((cloned) => {
              void navigate(`/dashboard/products/cogs/loads/${cloned.id}`)
            })
          }}
        >
          {t('productsCogsLoadClone')}
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <BulkCogsGrid
          rowIds={gridRowIds}
          draftStore={draftStore}
          onPatchDraft={() => {}}
          t={t}
          readOnly
        />
      </div>
    </DashboardPage>
  )
}
