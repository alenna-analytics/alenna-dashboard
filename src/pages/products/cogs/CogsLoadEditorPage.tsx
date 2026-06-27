import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Info } from 'lucide-react'
import { toast } from 'sonner'

import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { BulkCogsApplyStep } from '@/pages/products/bulk-cogs/bulk-cogs-apply-step'
import { BulkCogsUnsavedLeaveDialog } from '@/pages/products/bulk-cogs/bulk-cogs-unsaved-leave-dialog'
import {
  mergeLoadItemsIntoDraftStore,
  type BulkCogsDraftStore,
} from '@/pages/products/bulk-cogs/bulk-cogs-draft-store'
import { BulkCogsGrid } from '@/pages/products/bulk-cogs/bulk-cogs-grid'
import type { BulkCogsApplyUiMode } from '@/pages/products/bulk-cogs/bulk-cogs-types'
import { useBulkCogsViewportLock } from '@/pages/products/bulk-cogs/bulk-cogs-viewport-lock'
import { patchDraftField, resolveDraftCostValues } from '@/pages/products/bulk-cogs/bulk-cogs-validation'
import { mapCostApplyUiModeToApi, willBulkSaveEnqueueBackfill } from '@/pages/products/product-cost-apply-mode-api'
import { isCostApplyModeValid, useCostApplyModeDefaults } from '@/pages/products/product-cost-apply-mode-fields'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import {
  GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { useLanguage } from '@/shell/providers/language-provider'
import { Button } from '@/ui/button'
import { PageBreadcrumb } from '@/ui/page-breadcrumb'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

import { CogsLoadReviewStep } from './cogs-load-review-step'
import { countLoadReviewStates } from './cogs-load-review-utils'
import { CogsLoadSelectStep } from './cogs-load-select-step'
import {
  CogsLoadSaveStatusPill,
  type CogsLoadAutosaveStatus,
} from './cogs-load-save-status-pill'
import {
  useApplyCogsLoadMutation,
  useCogsLoadQuery,
  usePatchCogsLoadItemMutation,
  usePrefillCogsLoadMutation,
  useRemoveCogsLoadItemMutation,
} from './use-cogs-load-queries'

type WizardStep = 'select' | 'grid' | 'review' | 'apply'

const footerClassName = 'flex shrink-0 items-center border-t border-border-subtle bg-white px-0 py-3'
const AUTOSAVE_MS = 1500
const AUTOSAVE_SAVED_MS = 3000

function WizardBackButton({
  ariaLabel,
  onClick,
}: {
  ariaLabel: string
  onClick: () => void
}) {
  return (
    <Button type="button" variant="outline" size="icon-sm" aria-label={ariaLabel} onClick={onClick}>
      <ChevronLeft className="size-4 shrink-0" aria-hidden />
    </Button>
  )
}

export function CogsLoadEditorPage() {
  const { loadId } = useParams<{ loadId: string }>()
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const t = useCallback((key: ShellStringKey) => shellT(lang, key), [lang])
  const { upsertActivity, registerCogsBulkBackfillJobs } = useGlobalActivity()

  const loadQuery = useCogsLoadQuery(loadId)
  const patchMutation = usePatchCogsLoadItemMutation(loadId ?? '')
  const prefillMutation = usePrefillCogsLoadMutation(loadId ?? '')
  const removeMutation = useRemoveCogsLoadItemMutation(loadId ?? '')
  const applyMutation = useApplyCogsLoadMutation(loadId ?? '')

  const [step, setStep] = useState<WizardStep>('select')
  const [draftStore, setDraftStore] = useState<BulkCogsDraftStore>(() => new Map())
  const [pendingSaves, setPendingSaves] = useState(0)
  const [debouncingSaves, setDebouncingSaves] = useState(0)
  const [savedPulse, setSavedPulse] = useState(false)
  const [failedProductIds, setFailedProductIds] = useState<string[]>([])
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const loadUpdatedAtRef = useRef<string>('')
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftStoreRef = useRef(draftStore)
  const wasSavingRef = useRef(false)

  useEffect(() => {
    draftStoreRef.current = draftStore
  }, [draftStore])

  useEffect(() => {
    return () => {
      if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current)
    }
  }, [])

  const autosaveStatus = useMemo((): CogsLoadAutosaveStatus => {
    if (failedProductIds.length > 0 && pendingSaves === 0 && debouncingSaves === 0) {
      return 'failed'
    }
    if (pendingSaves > 0 || debouncingSaves > 0) return 'saving'
    if (savedPulse) return 'saved'
    return 'idle'
  }, [failedProductIds.length, pendingSaves, debouncingSaves, savedPulse])

  useEffect(() => {
    const isActive = pendingSaves > 0 || debouncingSaves > 0
    if (isActive) {
      wasSavingRef.current = true
      if (savedStatusTimerRef.current) {
        clearTimeout(savedStatusTimerRef.current)
        savedStatusTimerRef.current = null
      }
      setSavedPulse(false)
      return
    }
    if (failedProductIds.length > 0) {
      wasSavingRef.current = false
      setSavedPulse(false)
      return
    }
    if (!wasSavingRef.current) return
    wasSavingRef.current = false
    setSavedPulse(true)
    savedStatusTimerRef.current = setTimeout(() => {
      setSavedPulse(false)
      savedStatusTimerRef.current = null
    }, AUTOSAVE_SAVED_MS)
  }, [pendingSaves, debouncingSaves, failedProductIds.length])

  const applyDefaults = useCostApplyModeDefaults()
  const [applyMode, setApplyMode] = useState<BulkCogsApplyUiMode>('today')
  const [effectiveFromDate, setEffectiveFromDate] = useState(applyDefaults.effectiveFromDate)
  const [rangeStart, setRangeStart] = useState(applyDefaults.rangeStart)
  const [rangeEnd, setRangeEnd] = useState(applyDefaults.rangeEnd)

  const detail = loadQuery.data
  const isDraft = detail?.load.status === 'draft'
  const isReadOnly = !isDraft

  useEffect(() => {
    if (detail?.load.status === 'applied' && loadId) {
      void navigate(`/dashboard/products/cogs/loads/${loadId}/view`, { replace: true })
    }
  }, [detail?.load.status, loadId, navigate])

  useEffect(() => {
    if (!detail) return
    loadUpdatedAtRef.current = detail.load.updated_at
    setDraftStore((prev) =>
      mergeLoadItemsIntoDraftStore(prev, detail.items, detail.base_currency),
    )
  }, [detail])

  useBulkCogsViewportLock(Boolean(loadId))

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pendingSaves > 0 || debouncingSaves > 0) {
        event.preventDefault()
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [pendingSaves, debouncingSaves])

  const flushSave = useCallback(
    async (productId: string, store: BulkCogsDraftStore) => {
      const draft = store.get(productId)
      if (!draft || !loadId) return
      const values = resolveDraftCostValues(draft)
      if (!values) return
      setPendingSaves((n) => n + 1)
      try {
        const data = await patchMutation.mutateAsync({
          productId,
          supplier_price: values.supplier,
          freight_value: values.freight,
          packaging_value: values.packaging,
          updated_at: loadUpdatedAtRef.current,
        })
        loadUpdatedAtRef.current = data.load.updated_at
        setDraftStore((prev) => mergeLoadItemsIntoDraftStore(prev, data.items, data.base_currency))
        setFailedProductIds((prev) => prev.filter((id) => id !== productId))
      } catch (error) {
        setFailedProductIds((prev) =>
          prev.includes(productId) ? prev : [...prev, productId],
        )
        toast.error(error instanceof Error ? error.message : t('productsCogsLoadSaveFailed'))
      } finally {
        setPendingSaves((n) => {
          const next = Math.max(0, n - 1)
          return next
        })
      }
    },
    [loadId, patchMutation, t],
  )

  const retryFailedSaves = useCallback(async () => {
    const ids = [...failedProductIds]
    if (ids.length === 0) return
    setFailedProductIds([])
    for (const productId of ids) {
      await flushSave(productId, draftStoreRef.current)
    }
  }, [failedProductIds, flushSave])

  const scheduleSave = useCallback(
    (productId: string, store: BulkCogsDraftStore) => {
      const existing = saveTimersRef.current.get(productId)
      if (existing) {
        clearTimeout(existing)
      } else {
        setDebouncingSaves((n) => n + 1)
      }
      const timer = setTimeout(() => {
        saveTimersRef.current.delete(productId)
        setDebouncingSaves((n) => Math.max(0, n - 1))
        void flushSave(productId, store)
      }, AUTOSAVE_MS)
      saveTimersRef.current.set(productId, timer)
    },
    [flushSave],
  )

  const onPatchDraft = useCallback(
    (productId: string, field: 'supplierDraft' | 'freightDraft' | 'packagingDraft', value: string) => {
      setDraftStore((prev) => {
        const draft = prev.get(productId)
        if (!draft) return prev
        const next = new Map(prev)
        const patched = patchDraftField(draft, field, value)
        next.set(productId, { ...patched, dirty: false })
        scheduleSave(productId, next)
        return next
      })
    },
    [scheduleSave],
  )

  const gridRowIds = useMemo(
    () => (detail ? detail.items.map((i) => i.product_id) : []),
    [detail],
  )

  const reviewCounts = countLoadReviewStates(draftStore)
  const backfillEstimate = willBulkSaveEnqueueBackfill(applyMode, effectiveFromDate)
    ? reviewCounts.ready
    : 0

  const stepLabel = useMemo(() => {
    switch (step) {
      case 'select':
        return t('productsCogsLoadStepSelect')
      case 'grid':
        return t('productsCogsLoadStepGrid')
      case 'review':
        return t('productsCogsLoadStepReview')
      case 'apply':
        return t('productsCogsLoadStepApply')
    }
  }, [step, t])

  const handleApply = async () => {
    const apiApply = mapCostApplyUiModeToApi(applyMode, effectiveFromDate, rangeStart, rangeEnd)
    try {
      const result = await applyMutation.mutateAsync(apiApply)
      const jobs = result.backfill_jobs
      if (jobs.length > 0) {
        registerCogsBulkBackfillJobs(jobs.map((job) => job.job_id))
        upsertActivity({
          id: GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID,
          phase: 'loading',
          title: t('globalActivityCogsBackfillTitle'),
          subtitle: t('productsJobQueued'),
          href: '/dashboard/products/cogs',
        })
      }
      toast.success(t('productsBulkCogsSaveSuccess').replace('{count}', String(result.saved_count)))
      void navigate(`/dashboard/products/cogs/loads/${loadId}/view`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('productsBulkCogsSaveFailed'))
    }
  }

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

  return (
    <DashboardPage className="flex h-full min-h-0 flex-col overflow-hidden">
      <BulkCogsUnsavedLeaveDialog
        lang={lang}
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        onConfirmLeave={() => {
          setLeaveDialogOpen(false)
          void navigate('/dashboard/products/cogs')
        }}
      />

      <header className="shrink-0 space-y-1 pb-3 pt-1">
        <PageBreadcrumb
          items={[
            { label: t('productsNavCogs'), to: '/dashboard/products/cogs' },
            { label: t('productsCogsLoadEditorBreadcrumb') },
          ]}
          ariaLabel={t('ariaBreadcrumb')}
        />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className={pageTitleClassName}>{t('productsCogsLoadEditorTitle')}</h1>
            <p className="text-xs text-text-tertiary">{stepLabel}</p>
          </div>
          {step === 'grid' && isDraft ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="accent"
                size="sm"
                disabled={prefillMutation.isPending || detail.items.length === 0}
                onClick={() => {
                  void prefillMutation.mutateAsync().then((data) => {
                    setDraftStore((prev) =>
                      mergeLoadItemsIntoDraftStore(prev, data.items, data.base_currency),
                    )
                    toast.success(t('productsCogsLoadPrefilled'))
                  })
                }}
              >
                {t('productsCogsLoadPrefillDb')}
              </Button>
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  className="inline-flex size-8 items-center justify-center rounded-full text-text-secondary outline-none hover:bg-muted hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring/30"
                  aria-label={t('productsCogsLoadPrefillDbTooltip')}
                >
                  <Info className="size-4 shrink-0" aria-hidden />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {t('productsCogsLoadPrefillDbTooltip')}
                </TooltipContent>
              </Tooltip>
            </div>
          ) : null}
        </div>
        {detail.load.status === 'apply_failed' && detail.load.error_message ? (
          <p className="text-sm text-destructive">{detail.load.error_message}</p>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {step === 'select' ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CogsLoadSelectStep loadId={loadId} detail={detail} t={t} />
            </div>
            <footer className={footerClassName}>
              <div className="flex w-full items-center justify-end">
                <Button
                  type="button"
                  onClick={() => setStep('grid')}
                  disabled={detail.items.length === 0 || !isDraft}
                >
                  {t('productsCogsLoadContinueGrid')}
                </Button>
              </div>
            </footer>
          </>
        ) : null}

        {step === 'grid' ? (
          <>
            <div className="min-h-0 flex-1 overflow-hidden">
              <BulkCogsGrid
                rowIds={gridRowIds}
                draftStore={draftStore}
                onPatchDraft={onPatchDraft}
                t={t}
                readOnly={isReadOnly}
                onRemoveRow={
                  isDraft
                    ? (productId) => {
                        void removeMutation.mutateAsync(productId)
                      }
                    : undefined
                }
              />
            </div>
            <footer className={footerClassName}>
              <div className="flex w-full items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <WizardBackButton
                    ariaLabel={t('productsCogsLoadBackSelect')}
                    onClick={() => setStep('select')}
                  />
                  <CogsLoadSaveStatusPill
                    status={autosaveStatus}
                    t={t}
                    onRetry={() => void retryFailedSaves()}
                    retryPending={pendingSaves > 0}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => setStep('review')}
                  disabled={
                    detail.items.length === 0 || pendingSaves > 0 || debouncingSaves > 0
                  }
                >
                  {t('productsBulkCogsContinueReview')}
                </Button>
              </div>
            </footer>
          </>
        ) : null}

        {step === 'review' ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <CogsLoadReviewStep
                draftStore={draftStore}
                backfillCountEstimate={backfillEstimate}
                t={t}
              />
            </div>
            <footer className={footerClassName}>
              <div className="flex w-full items-center justify-between gap-2">
                <WizardBackButton
                  ariaLabel={t('productsBulkCogsBackEdit')}
                  onClick={() => setStep('grid')}
                />
                <Button
                  type="button"
                  onClick={() => setStep('apply')}
                  disabled={
                    reviewCounts.invalid > 0 ||
                    reviewCounts.ready === 0 ||
                    pendingSaves > 0 ||
                    debouncingSaves > 0 ||
                    !isDraft
                  }
                >
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
                saving={applyMutation.isPending}
                onSave={() => void handleApply()}
                t={t}
                hidePrimaryAction
              />
            </div>
            <footer className={footerClassName}>
              <div className="flex w-full items-center justify-between gap-2">
                <WizardBackButton
                  ariaLabel={t('productsBulkCogsBackReview')}
                  onClick={() => setStep('review')}
                />
                <Button
                  type="button"
                  onClick={() => void handleApply()}
                  disabled={
                    applyMutation.isPending ||
                    pendingSaves > 0 ||
                    debouncingSaves > 0 ||
                    !isDraft ||
                    !isCostApplyModeValid(applyMode, effectiveFromDate, rangeStart, rangeEnd)
                  }
                >
                  {applyMutation.isPending ? t('productsBulkCogsSaving') : t('productsBulkCogsApplySave')}
                </Button>
              </div>
            </footer>
          </>
        ) : null}
      </div>
    </DashboardPage>
  )
}
