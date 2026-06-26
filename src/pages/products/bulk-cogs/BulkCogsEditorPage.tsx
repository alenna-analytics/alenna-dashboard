import { useAuth } from '@clerk/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { ProductCostBulkRowsResponse } from '@/lib/types/catalog'

import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { Button } from '@/ui/button'
import {
  GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { toast } from 'sonner'

import { mapCostApplyUiModeToApi, willBulkSaveEnqueueBackfill } from '../product-cost-apply-mode-api'
import { useCostApplyModeDefaults, isCostApplyModeValid } from '../product-cost-apply-mode-fields'
import { patchDraftField, resolveDraftCostValues } from './bulk-cogs-validation'
import { BulkCogsApplyStep } from './bulk-cogs-apply-step'
import { BulkCogsBreadcrumb } from './bulk-cogs-breadcrumb'
import { BulkCogsUnsavedLeaveDialog } from './bulk-cogs-unsaved-leave-dialog'
import {
  countDraftStates,
  listChangedDrafts,
  mergeRowsIntoDraftStore,
  type BulkCogsDraftStore,
} from './bulk-cogs-draft-store'
import { BulkCogsGrid } from './bulk-cogs-grid'
import { BulkCogsReviewStep } from './bulk-cogs-review-step'
import { clearBulkCogsScope, readBulkCogsScope } from './bulk-cogs-scope'
import { bulkScopeLabelKey, bulkScopeToQueryParams, BULK_PAGE_SIZE } from './bulk-cogs-scope-query'
import { useBulkCogsViewportLock } from './bulk-cogs-viewport-lock'
import { useBulkCogsLeaveGuard } from './use-bulk-cogs-leave-guard'
import type { BulkCogsApplyUiMode, BulkCogsScope } from './bulk-cogs-types'
import {
  useProductCostBulkRowsQuery,
  useSaveProductCostBulkMutation,
} from '../use-catalog-queries'

type WizardStep = 'grid' | 'review' | 'apply'

const footerClassName =
  'shrink-0 border-t border-border-subtle bg-white px-0 pt-3 pb-2'

export function BulkCogsEditorPage() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const t = useCallback((key: ShellStringKey) => shellT(lang, key), [lang])
  const { upsertActivity, registerCogsBulkBackfillJobs } = useGlobalActivity()

  const [scope] = useState<BulkCogsScope | null>(() => readBulkCogsScope())
  const [step, setStep] = useState<WizardStep>('grid')
  const [draftStore, setDraftStore] = useState<BulkCogsDraftStore>(() => new Map())
  const [loadedPages, setLoadedPages] = useState<Set<number>>(() => new Set())
  const loadedPagesRef = useRef(loadedPages)
  loadedPagesRef.current = loadedPages

  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  const applyDefaults = useCostApplyModeDefaults()
  const [applyMode, setApplyMode] = useState<BulkCogsApplyUiMode>('today')
  const [effectiveFromDate, setEffectiveFromDate] = useState(applyDefaults.effectiveFromDate)
  const [rangeStart, setRangeStart] = useState(applyDefaults.rangeStart)
  const [rangeEnd, setRangeEnd] = useState(applyDefaults.rangeEnd)

  useEffect(() => {
    if (!scope) {
      void navigate('/dashboard/products', { replace: true })
    }
  }, [scope, navigate])

  useBulkCogsViewportLock(scope !== null)

  const rowsQuery = useProductCostBulkRowsQuery(scope, 0)
  const saveMutation = useSaveProductCostBulkMutation()

  useEffect(() => {
    if (!rowsQuery.data || loadedPages.has(0)) return
    setDraftStore((prev: BulkCogsDraftStore) =>
      mergeRowsIntoDraftStore(prev, rowsQuery.data!.items, rowsQuery.data!.base_currency),
    )
    setLoadedPages((prev) => new Set(prev).add(0))
  }, [rowsQuery.data, loadedPages])

  const total = rowsQuery.data?.total ?? 0

  useEffect(() => {
    if (!scope || !tenantId || total === 0) return
    const pagesNeeded = Math.ceil(total / BULK_PAGE_SIZE)
    if (pagesNeeded <= 1) return

    let cancelled = false
    void (async () => {
      for (let p = 0; p < pagesNeeded; p++) {
        if (cancelled || loadedPagesRef.current.has(p)) continue
        try {
          const sp = bulkScopeToQueryParams(scope, p)
          const res = await apiFetch(
            `/catalog/products/cost-bulk-rows?${sp.toString()}`,
            (a) => getToken(a),
            {},
            tenantId,
          )
          if (!res.ok || cancelled) continue
          const data = (await res.json()) as ProductCostBulkRowsResponse
          setDraftStore((prev: BulkCogsDraftStore) =>
            mergeRowsIntoDraftStore(prev, data.items, data.base_currency),
          )
          setLoadedPages((prev) => new Set(prev).add(p))
        } catch {
          break
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [scope, tenantId, total, getToken])

  const gridRowIds = useMemo(() => Array.from(draftStore.keys()), [draftStore])

  const onPatchDraft = useCallback(
    (productId: string, field: 'supplierDraft' | 'freightDraft' | 'packagingDraft', value: string) => {
      setDraftStore((prev: BulkCogsDraftStore) => {
        const draft = prev.get(productId)
        if (!draft) return prev
        const next = new Map(prev)
        next.set(productId, patchDraftField(draft, field, value))
        return next
      })
    },
    [],
  )

  const { changed, invalid } = countDraftStates(draftStore)
  const backfillEstimate = willBulkSaveEnqueueBackfill(applyMode, effectiveFromDate) ? changed : 0

  const { leaveDialogOpen, setLeaveDialogOpen, confirmLeave } = useBulkCogsLeaveGuard({
    hasUnsavedChanges: changed > 0,
    enabled: scope !== null && !saveMutation.isPending,
  })

  const handleSave = async () => {
    const changedDrafts = listChangedDrafts(draftStore).filter((d) => !d.invalid)
    if (changedDrafts.length === 0) return

    const apiApply = mapCostApplyUiModeToApi(applyMode, effectiveFromDate, rangeStart, rangeEnd)
    const items = changedDrafts.flatMap((d) => {
      const values = resolveDraftCostValues(d)
      if (!values) return []
      return [
        {
          product_id: d.productId,
          supplier_price: values.supplier,
          freight_value: values.freight,
          packaging_value: values.packaging,
        },
      ]
    })
    if (items.length === 0) return

    try {
      const result = await saveMutation.mutateAsync({
        items,
        ...apiApply,
      })
      const jobs = result.backfill_jobs
      if (jobs.length > 0) {
        registerCogsBulkBackfillJobs(jobs.map((job) => job.job_id))
        upsertActivity({
          id: GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID,
          phase: 'loading',
          title: t('globalActivityCogsBackfillTitle'),
          subtitle: t('productsJobQueued'),
          href: '/dashboard/products',
        })
      }
      clearBulkCogsScope()
      toast.success(t('productsBulkCogsSaveSuccess').replace('{count}', String(result.saved_count)))
      void navigate('/dashboard/products')
    } catch (error) {
      const message = error instanceof Error ? error.message : t('productsBulkCogsSaveFailed')
      toast.error(message)
    }
  }

  if (!scope) return null

  const scopeLabel = t(bulkScopeLabelKey(scope))
  const stepLabel =
    step === 'grid'
      ? t('productsBulkCogsStepEdit')
      : step === 'review'
        ? t('productsBulkCogsStepReview')
        : t('productsBulkCogsStepApply')

  return (
    <DashboardPage className="flex h-full min-h-0 flex-col overflow-hidden">
      <BulkCogsUnsavedLeaveDialog
        lang={lang}
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        onConfirmLeave={() => {
          clearBulkCogsScope()
          confirmLeave()
        }}
      />
      <BulkCogsBreadcrumb className="shrink-0" />

      <header className="shrink-0 space-y-1 pb-3 pt-1">
        <h1 className={pageTitleClassName}>{t('productsBulkCogsTitle')}</h1>
        <p className="text-sm text-text-secondary">{scopeLabel}</p>
        <p className="text-xs text-text-tertiary">{stepLabel}</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {step === 'grid' ? (
          <>
            <div className="min-h-0 flex-1 overflow-hidden">
              <BulkCogsGrid
                rowIds={gridRowIds}
                draftStore={draftStore}
                onPatchDraft={onPatchDraft}
                t={t}
              />
            </div>
            <footer className={footerClassName}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-text-secondary">
                  {t('productsBulkCogsTotalRows').replace('{count}', String(total))}
                </p>
                <Button type="button" onClick={() => setStep('review')} disabled={changed === 0}>
                  {t('productsBulkCogsContinueReview')}
                </Button>
              </div>
            </footer>
          </>
        ) : null}

        {step === 'review' ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <BulkCogsReviewStep
                draftStore={draftStore}
                backfillCountEstimate={backfillEstimate}
                t={t}
              />
            </div>
            <footer className={footerClassName}>
              <div className="flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('grid')}>
                  {t('productsBulkCogsBackEdit')}
                </Button>
                <Button type="button" onClick={() => setStep('apply')} disabled={invalid > 0 || changed === 0}>
                  {t('productsBulkCogsContinueApply')}
                </Button>
              </div>
            </footer>
          </>
        ) : null}

        {step === 'apply' ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <BulkCogsApplyStep
                applyMode={applyMode}
                onApplyModeChange={setApplyMode}
                effectiveFromDate={effectiveFromDate}
                onEffectiveFromDateChange={setEffectiveFromDate}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onRangeStartChange={setRangeStart}
                onRangeEndChange={setRangeEnd}
                saving={saveMutation.isPending}
                onSave={handleSave}
                t={t}
                hidePrimaryAction
              />
            </div>
            <footer className={footerClassName}>
              <div className="flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('review')}>
                  {t('productsBulkCogsBackReview')}
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    saveMutation.isPending ||
                    !isCostApplyModeValid(applyMode, effectiveFromDate, rangeStart, rangeEnd)
                  }
                >
                  {saveMutation.isPending ? t('productsBulkCogsSaving') : t('productsBulkCogsApplySave')}
                </Button>
              </div>
            </footer>
          </>
        ) : null}
      </div>
    </DashboardPage>
  )
}
