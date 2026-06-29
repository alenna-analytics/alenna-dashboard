import { useCallback, useMemo, useState } from 'react'

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
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Switch } from '@/ui/switch'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'
import { cn } from '@/lib/utils'

import { computeCogsTotal, type ComponentAmountMode } from './product-cost-breakdown'
import { formatCostDraft, parseCostInput } from './product-cost-input-utils'
import {
  isCostApplyModeValid,
  ProductCostApplyModeFields,
  useCostApplyModeDefaults,
} from './product-cost-apply-mode-fields'
import { mapCostApplyUiModeToApi } from './product-cost-apply-mode-api'
import type { BulkCogsApplyUiMode } from './bulk-cogs/bulk-cogs-types'
import { showProductCostErrorToast, showProductCostSuccessToast } from './product-cost-toast'
import {
  useProductDetailQuery,
  useSaveProductCostBreakdownMutation,
} from './use-catalog-queries'

type CostApplyMode = BulkCogsApplyUiMode

const ZERO_DUTIES: ComponentAmountApi = { mode: 'fixed', value: 0 }

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
  fixedSuffix: string
}

function currencyInputSuffix(currency: string): string {
  try {
    const part = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find((p) => p.type === 'currency')
    return part?.value ?? '$'
  } catch {
    return '$'
  }
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
  fixedSuffix,
}: ComponentFieldProps) {
  const isPercent = mode === 'percent'
  const modeSwitchId = `${id}-mode`
  const valueSuffix = isPercent ? '%' : fixedSuffix

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Input
            id={id}
            type="text"
            inputMode="decimal"
            value={valueDraft}
            onChange={(event) => onValueChange(event.target.value)}
            disabled={disabled}
            className="pr-8 font-numeric tabular-nums"
          />
          <span
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-text-secondary"
            aria-hidden
          >
            {valueSuffix}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              'text-xs font-medium',
              !isPercent ? 'text-text-primary' : 'text-text-tertiary',
            )}
          >
            {modeFixedLabel}
          </span>
          <Switch
            id={modeSwitchId}
            checked={isPercent}
            onCheckedChange={(checked) => onModeChange(checked ? 'percent' : 'fixed')}
            disabled={disabled}
            aria-label={`${label}: ${modeFixedLabel} / ${modePercentLabel}`}
          />
          <span
            className={cn(
              'text-xs font-medium',
              isPercent ? 'text-text-primary' : 'text-text-tertiary',
            )}
          >
            {modePercentLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

function breakdownFromDetail(detail: ProductDetailApi): {
  supplier: string
  freightMode: ComponentAmountMode
  freightValue: string
  shipping: string
} {
  const breakdown: ProductCostBreakdownApi | null | undefined = detail.cost_breakdown
  if (breakdown) {
    return {
      supplier: formatCostDraft(breakdown.supplier_price),
      freightMode: breakdown.freight.mode,
      freightValue: formatCostDraft(breakdown.freight.value),
      shipping: formatCostDraft(breakdown.packaging_value),
    }
  }
  if (detail.cost != null) {
    return {
      supplier: formatCostDraft(detail.cost),
      freightMode: 'fixed',
      freightValue: '0',
      shipping: '0',
    }
  }
  return {
    supplier: '',
    freightMode: 'fixed',
    freightValue: '0',
    shipping: '0',
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
  const { upsertActivity } = useGlobalActivity()
  const saveMutation = useSaveProductCostBreakdownMutation(productId, parentProductId)

  const seed = useMemo(() => breakdownFromDetail(detail), [detail])
  const applyDefaults = useCostApplyModeDefaults()
  const [supplierDraft, setSupplierDraft] = useState(seed.supplier)
  const [freightMode, setFreightMode] = useState<ComponentAmountMode>(seed.freightMode)
  const [freightDraft, setFreightDraft] = useState(seed.freightValue)
  const [shippingDraft, setShippingDraft] = useState(seed.shipping)
  const [applyMode, setApplyMode] = useState<CostApplyMode>('today')
  const [effectiveFromDate, setEffectiveFromDate] = useState(applyDefaults.effectiveFromDate)
  const [rangeStart, setRangeStart] = useState(applyDefaults.rangeStart)
  const [rangeEnd, setRangeEnd] = useState(applyDefaults.rangeEnd)

  const baseCurrency = detail.base_currency
  const fixedSuffix = useMemo(() => currencyInputSuffix(baseCurrency), [baseCurrency])

  const supplierParsed = parseCostInput(supplierDraft)
  const freightParsed = parseComponent(freightMode, freightDraft)
  const shippingParsed = parseCostInput(shippingDraft)

  const computedTotal = useMemo(() => {
    if (supplierParsed === null || freightParsed === null || shippingParsed === null) {
      return null
    }
    return computeCogsTotal({
      supplierPrice: supplierParsed,
      freight: freightParsed,
      duties: ZERO_DUTIES,
      packagingValue: shippingParsed,
    })
  }, [supplierParsed, freightParsed, shippingParsed])

  const formValid =
    supplierParsed !== null &&
    freightParsed !== null &&
    shippingParsed !== null &&
    isCostApplyModeValid(applyMode, effectiveFromDate, rangeStart, rangeEnd)

  const saving = saveMutation.isPending

  const handleSave = async () => {
    if (!formValid || supplierParsed === null || freightParsed === null || shippingParsed === null) {
      return
    }
    const apiApply = mapCostApplyUiModeToApi(applyMode, effectiveFromDate, rangeStart, rangeEnd)

    try {
      const res = await saveMutation.mutateAsync({
        supplier_price: supplierParsed,
        freight: freightParsed,
        duties: ZERO_DUTIES,
        packaging_value: shippingParsed,
        effective_from: apiApply.effective_from,
        apply_mode: apiApply.apply_mode,
        effective_to: apiApply.effective_to,
      })
      if (res.apply_mode === 'backfill' && res.job_id) {
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetHeader>
        <SheetTitle>{t('productsCostEditorTitle')}</SheetTitle>
      </SheetHeader>

      <SheetBody className="space-y-4">
        <SheetDescription>
          {t('productsDetailCostHelp').replace('{currency}', baseCurrency)}
        </SheetDescription>
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
          fixedSuffix={fixedSuffix}
        />

        <div className="space-y-2">
          <Label htmlFor="cost-shipping">
            {t('productsCostEditorShipping').replace('{currency}', baseCurrency)}
          </Label>
          <Input
            id="cost-shipping"
            type="text"
            inputMode="decimal"
            value={shippingDraft}
            onChange={(event) => setShippingDraft(event.target.value)}
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

        <ProductCostApplyModeFields
          applyMode={applyMode}
          onApplyModeChange={setApplyMode}
          effectiveFromDate={effectiveFromDate}
          onEffectiveFromDateChange={setEffectiveFromDate}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onRangeStartChange={setRangeStart}
          onRangeEndChange={setRangeEnd}
          disabled={saving}
          t={t}
        />
      </SheetBody>

      <SheetFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          {t('productsDetailSheetCancel')}
        </Button>
          <Button type="button" onClick={() => void handleSave()} loading={saving} disabled={!formValid}>
          {t('productsDetailSheetSave')}
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
      <SheetContent side="right">
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
