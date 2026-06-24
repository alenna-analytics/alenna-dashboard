import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { shellT } from '@/lib/i18n/shell-strings'
import type {
  ComponentAmountApi,
  ProductCostBreakdownApi,
  ProductDetailApi,
} from '@/lib/types/catalog'
import {
  cogsBackfillActivityId,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'
import { LoadingIcon } from '@/ui/app-icon'
import { Button } from '@/ui/button'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'
import { cn } from '@/lib/utils'

import { computeCogsTotal, type ComponentAmountMode } from './product-cost-breakdown'
import { defaultBackfillRange, todayYmd } from './product-cost-date-utils'
import { formatCostDraft, parseCostInput } from './product-cost-input-utils'
import { showProductCostErrorToast, showProductCostSuccessToast } from './product-cost-toast'
import {
  useCatalogJobQuery,
  useProductDetailQuery,
  useSaveProductCostBreakdownMutation,
} from './use-catalog-queries'

type CostApplyMode = 'forward' | 'backfill'

type ProductCostEditorSheetProps = {
  lang: string
  open: boolean
  productId: string | null
  parentProductId?: string | null
  initialDetail?: ProductDetailApi | null
  onOpenChange: (open: boolean) => void
}

type ComponentFieldProps = {
  id: string
  label: string
  mode: ComponentAmountMode
  valueDraft: string
  onModeChange: (mode: ComponentAmountMode) => void
  onValueChange: (value: string) => void
  disabled: boolean
  modeFixedLabel: string
  modePercentLabel: string
}

function ComponentField({
  id,
  label,
  mode,
  valueDraft,
  onModeChange,
  onValueChange,
  disabled,
  modeFixedLabel,
  modePercentLabel,
}: ComponentFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Select
          value={mode}
          onValueChange={(next) => onModeChange(next as ComponentAmountMode)}
          disabled={disabled}
        >
          <SelectTrigger className="w-[7.5rem] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">{modeFixedLabel}</SelectItem>
            <SelectItem value="percent">{modePercentLabel}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          value={valueDraft}
          onChange={(event) => onValueChange(event.target.value)}
          disabled={disabled}
          className="font-numeric tabular-nums"
        />
      </div>
    </div>
  )
}

function breakdownFromDetail(detail: ProductDetailApi): {
  supplier: string
  freightMode: ComponentAmountMode
  freightValue: string
  dutiesMode: ComponentAmountMode
  dutiesValue: string
  packaging: string
} {
  const breakdown: ProductCostBreakdownApi | null | undefined = detail.cost_breakdown
  if (breakdown) {
    return {
      supplier: formatCostDraft(breakdown.supplier_price),
      freightMode: breakdown.freight.mode,
      freightValue: formatCostDraft(breakdown.freight.value),
      dutiesMode: breakdown.duties.mode,
      dutiesValue: formatCostDraft(breakdown.duties.value),
      packaging: formatCostDraft(breakdown.packaging_value),
    }
  }
  if (detail.cost != null) {
    return {
      supplier: formatCostDraft(detail.cost),
      freightMode: 'fixed',
      freightValue: '0',
      dutiesMode: 'fixed',
      dutiesValue: '0',
      packaging: '0',
    }
  }
  return {
    supplier: '',
    freightMode: 'fixed',
    freightValue: '0',
    dutiesMode: 'fixed',
    dutiesValue: '0',
    packaging: '0',
  }
}

function parseComponent(mode: ComponentAmountMode, draft: string): ComponentAmountApi | null {
  const parsed = parseCostInput(draft)
  if (parsed === null) return null
  return { mode, value: parsed }
}

type ProductCostEditorFormProps = {
  lang: string
  productId: string
  parentProductId: string | null
  detail: ProductDetailApi
  onOpenChange: (open: boolean) => void
}

function ProductCostEditorForm({
  lang,
  productId,
  parentProductId,
  detail,
  onOpenChange,
}: ProductCostEditorFormProps) {
  const t = useCallback((key: Parameters<typeof shellT>[1]) => shellT(lang, key), [lang])
  const { tenantId } = useCurrentTenant()
  const qc = useQueryClient()
  const { upsertActivity, patchActivity } = useGlobalActivity()
  const saveMutation = useSaveProductCostBreakdownMutation(productId, parentProductId)

  const seed = useMemo(() => breakdownFromDetail(detail), [detail])
  const [supplierDraft, setSupplierDraft] = useState(seed.supplier)
  const [freightMode, setFreightMode] = useState<ComponentAmountMode>(seed.freightMode)
  const [freightDraft, setFreightDraft] = useState(seed.freightValue)
  const [dutiesMode, setDutiesMode] = useState<ComponentAmountMode>(seed.dutiesMode)
  const [dutiesDraft, setDutiesDraft] = useState(seed.dutiesValue)
  const [packagingDraft, setPackagingDraft] = useState(seed.packaging)
  const [effectiveFrom, setEffectiveFrom] = useState(todayYmd())
  const [applyMode, setApplyMode] = useState<CostApplyMode>('forward')
  const [rangeStart, setRangeStart] = useState(defaultBackfillRange().start)
  const [rangeEnd, setRangeEnd] = useState(defaultBackfillRange().end)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const jobQuery = useCatalogJobQuery(activeJobId, Boolean(activeJobId))
  const baseCurrency = detail.base_currency

  const pickerStrings: DateRangePickerStrings = useMemo(
    () => ({
      startLabel: t('connectionsDateFrom'),
      endLabel: t('connectionsDateTo'),
      applyLabel: t('datePickerApply'),
      presetCustom: t('datePickerCustom'),
      presetLast7Days: t('datePickerLast7Days'),
      presetLast30Days: t('datePickerLast30Days'),
      presetLast3Months: t('datePickerLast3Months'),
      presetLast12Months: t('datePickerLast12Months'),
      presetCurrentMonth: t('datePickerCurrentMonth'),
      presetCurrentQuarter: t('datePickerCurrentQuarter'),
      presetYtd: t('datePickerYtd'),
      presetLastYear: t('datePickerLastYear'),
    }),
    [t],
  )

  const supplierParsed = parseCostInput(supplierDraft)
  const freightParsed = parseComponent(freightMode, freightDraft)
  const dutiesParsed = parseComponent(dutiesMode, dutiesDraft)
  const packagingParsed = parseCostInput(packagingDraft)

  const computedTotal = useMemo(() => {
    if (supplierParsed === null || freightParsed === null || dutiesParsed === null || packagingParsed === null) {
      return null
    }
    return computeCogsTotal({
      supplierPrice: supplierParsed,
      freight: freightParsed,
      duties: dutiesParsed,
      packagingValue: packagingParsed,
    })
  }, [supplierParsed, freightParsed, dutiesParsed, packagingParsed])

  const rangeOk = rangeStart <= rangeEnd
  const formValid =
    supplierParsed !== null &&
    freightParsed !== null &&
    dutiesParsed !== null &&
    packagingParsed !== null &&
    (applyMode === 'forward' ? effectiveFrom.trim() !== '' : rangeOk)

  const saving = saveMutation.isPending

  const handleSave = async () => {
    if (!formValid || supplierParsed === null || freightParsed === null || dutiesParsed === null || packagingParsed === null) {
      return
    }
    try {
      const res = await saveMutation.mutateAsync({
        supplier_price: supplierParsed,
        freight: freightParsed,
        duties: dutiesParsed,
        packaging_value: packagingParsed,
        effective_from: applyMode === 'forward' ? effectiveFrom : rangeStart,
        apply_mode: applyMode,
        effective_to: applyMode === 'backfill' ? rangeEnd : null,
      })
      if (res.apply_mode === 'backfill' && res.job_id) {
        setActiveJobId(res.job_id)
        upsertActivity({
          id: cogsBackfillActivityId(res.job_id),
          phase: 'loading',
          title: t('globalActivityCogsBackfillTitle'),
          subtitle: t('productsJobQueued'),
          href: `/dashboard/products/${productId}`,
          minimized: false,
        })
        showProductCostSuccessToast(lang, 'productsDetailToastRecalcQueued')
        onOpenChange(false)
        return
      }
      showProductCostSuccessToast(lang)
      onOpenChange(false)
    } catch (error) {
      showProductCostErrorToast(lang, error)
    }
  }

  useEffect(() => {
    if (jobQuery.data?.status !== 'succeeded' || !tenantId) return
    void qc.invalidateQueries({ queryKey: ['catalog', 'product', tenantId, productId] })
    if (parentProductId && parentProductId !== productId) {
      void qc.invalidateQueries({ queryKey: ['catalog', 'product', tenantId, parentProductId] })
    }
  }, [jobQuery.data?.status, parentProductId, productId, qc, tenantId])

  useEffect(() => {
    if (!activeJobId || !jobQuery.data) return
    const job = jobQuery.data
    if (job.id !== activeJobId) return
    const gid = cogsBackfillActivityId(activeJobId)
    if (job.status === 'queued') {
      patchActivity(gid, { phase: 'loading', subtitle: t('productsJobQueued') })
    } else if (job.status === 'running') {
      patchActivity(gid, { phase: 'loading', subtitle: t('productsJobRunning') })
    } else if (job.status === 'succeeded') {
      patchActivity(gid, { phase: 'success', subtitle: t('productsJobSucceeded') })
    } else if (job.status === 'failed') {
      patchActivity(gid, {
        phase: 'error',
        subtitle: job.error_message ?? t('productsJobFailed'),
      })
    }
  }, [activeJobId, jobQuery.data, patchActivity, t])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetHeader>
        <SheetTitle>{t('productsCostEditorTitle')}</SheetTitle>
        <SheetDescription>
          {t('productsDetailCostHelp').replace('{currency}', baseCurrency)}
        </SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="cost-supplier">
            {t('productsCostEditorSupplier').replace('{currency}', baseCurrency)}
          </Label>
          <Input
            id="cost-supplier"
            type="text"
            inputMode="decimal"
            value={supplierDraft}
            onChange={(event) => setSupplierDraft(event.target.value)}
            disabled={saving}
            className="font-numeric tabular-nums"
          />
        </div>

        <ComponentField
          id="cost-freight"
          label={t('productsCostEditorFreight')}
          mode={freightMode}
          valueDraft={freightDraft}
          onModeChange={setFreightMode}
          onValueChange={setFreightDraft}
          disabled={saving}
          modeFixedLabel={t('productsCostEditorModeFixed')}
          modePercentLabel={t('productsCostEditorModePercent')}
        />

        <ComponentField
          id="cost-duties"
          label={t('productsCostEditorDuties')}
          mode={dutiesMode}
          valueDraft={dutiesDraft}
          onModeChange={setDutiesMode}
          onValueChange={setDutiesDraft}
          disabled={saving}
          modeFixedLabel={t('productsCostEditorModeFixed')}
          modePercentLabel={t('productsCostEditorModePercent')}
        />

        <div className="space-y-2">
          <Label htmlFor="cost-packaging">
            {t('productsCostEditorPackaging').replace('{currency}', baseCurrency)}
          </Label>
          <Input
            id="cost-packaging"
            type="text"
            inputMode="decimal"
            value={packagingDraft}
            onChange={(event) => setPackagingDraft(event.target.value)}
            disabled={saving}
            className="font-numeric tabular-nums"
          />
        </div>

        <div className="rounded-md border border-border-subtle bg-muted/20 px-3 py-2">
          <p className="text-xs font-medium text-text-secondary">{t('productsCostEditorTotal')}</p>
          <p className="font-numeric text-lg tabular-nums text-text-primary">
            {computedTotal != null ? `${computedTotal.toFixed(4)} ${baseCurrency}` : '—'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost-effective-from">{t('productsCostEditorEffectiveDate')}</Label>
          <Input
            id="cost-effective-from"
            type="date"
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
            disabled={saving || applyMode === 'backfill'}
          />
        </div>

        <div className="space-y-2" role="radiogroup" aria-label={t('productsDetailCostModeGroupAria')}>
          <p className="text-xs font-medium text-text-secondary">{t('productsDetailCostModeGroupLabel')}</p>
          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors',
              applyMode === 'forward'
                ? 'border-border-default bg-muted/30'
                : 'border-border-subtle hover:bg-muted/20',
            )}
          >
            <input
              type="radio"
              name="cost-apply-mode"
              className="mt-0.5"
              checked={applyMode === 'forward'}
              onChange={() => setApplyMode('forward')}
              disabled={saving}
            />
            <span className="min-w-0">
              <span className="font-medium text-text-primary">{t('productsDetailCostModeForward')}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">
                {t('productsDetailCostModeForwardHelp')}
              </span>
            </span>
          </label>
          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors',
              applyMode === 'backfill'
                ? 'border-border-default bg-muted/30'
                : 'border-border-subtle hover:bg-muted/20',
            )}
          >
            <input
              type="radio"
              name="cost-apply-mode"
              className="mt-0.5"
              checked={applyMode === 'backfill'}
              onChange={() => setApplyMode('backfill')}
              disabled={saving}
            />
            <span className="min-w-0">
              <span className="font-medium text-text-primary">{t('productsDetailCostModeHistory')}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">
                {t('productsDetailCostModeHistoryHelp')}
              </span>
            </span>
          </label>
        </div>

        {applyMode === 'backfill' ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-secondary">{t('productsDetailRecalcCogsRangeLabel')}</p>
            <DateRangePicker
              strings={pickerStrings}
              startValue={rangeStart}
              endValue={rangeEnd}
              onStartChange={(value) => value && setRangeStart(value)}
              onEndChange={(value) => value && setRangeEnd(value)}
              filterLabel={t('filterDateTimeLabel')}
              clearAriaLabel={t('filterClear')}
              onClear={() => {
                const d0 = defaultBackfillRange()
                setRangeStart(d0.start)
                setRangeEnd(d0.end)
              }}
              className="max-w-full"
            />
          </div>
        ) : null}
      </div>

      <SheetFooter>
        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
          {t('productsDetailSheetCancel')}
        </Button>
        <Button type="button" onClick={() => void handleSave()} disabled={!formValid || saving}>
          {saving ? <LoadingIcon className="size-4" /> : t('productsDetailSheetSave')}
        </Button>
      </SheetFooter>
    </div>
  )
}

export function ProductCostEditorSheet({
  lang,
  open,
  productId,
  parentProductId = null,
  initialDetail = null,
  onOpenChange,
}: ProductCostEditorSheetProps) {
  const detailQuery = useProductDetailQuery(open ? productId ?? undefined : undefined)
  const detail = initialDetail ?? detailQuery.data ?? null
  const loading = open && !detail && detailQuery.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        {open && productId ? (
          loading || !detail ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <LoadingIcon className="size-6 text-text-tertiary" />
            </div>
          ) : (
            <ProductCostEditorForm
              key={`${productId}-${detail.updated_at}`}
              lang={lang}
              productId={productId}
              parentProductId={parentProductId}
              detail={detail}
              onOpenChange={onOpenChange}
            />
          )
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
