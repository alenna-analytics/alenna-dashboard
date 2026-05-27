import { useCallback, useEffect, useMemo, useState } from 'react'
import { ImageIcon, Loader2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import type {
  ProductCostHistorySegmentApi,
  ProductDetailApi,
} from '@/lib/types/catalog'
import { toYmd } from '@/pages/reports/reports-ui-helpers'
import { useMoney } from '@/hooks/use-money'
import { useLanguage } from '@/shell/providers/language-provider'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { Button } from '@/ui/button'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { Input } from '@/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'
import { Skeleton } from '@/ui/skeleton'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import {
  cogsBackfillActivityId,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'

import { buildProductCostPriceChartData } from './product-cost-chart-points'
import { ProductDetailSections } from './product-detail-sections'
import { ProductDetailHeaderMeta } from './product-detail-header-meta'
import { ProductDetailSkuRow } from './product-detail-sku-row'
import { defaultProductInsightRange } from './product-detail-range'
import {
  useCatalogJobQuery,
  useEnqueueCogsBackfillMutation,
  usePatchProductCostMutation,
  useProductDetailQuery,
} from './use-catalog-queries'

const NUM = 'font-numeric tabular-nums'

function costAmountWithBaseCode(
  formatted: string,
  baseCurrency: string,
  codeClassName: string,
) {
  if (formatted === '—') return formatted
  return (
    <>
      {formatted}
      <span className={cn('whitespace-nowrap font-medium text-text-tertiary', codeClassName)}> {baseCurrency}</span>
    </>
  )
}

function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function defaultBackfillRange(): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  return { start: toYmd(start), end: toYmd(end) }
}

type CostEditMode = 'forward' | 'history'

function daysSinceUpdated(iso: string): number {
  const u = new Date(iso)
  const start = new Date(u.getFullYear(), u.getMonth(), u.getDate())
  const t = new Date()
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate())
  return Math.round((today.getTime() - start.getTime()) / 86400000)
}

function avgCostFromHistory(
  segments: readonly ProductCostHistorySegmentApi[],
  baseCurrency: string,
): number | null {
  if (segments.length === 0) return null
  const same = segments.filter((s) => (s.currency || '').toUpperCase() === baseCurrency.toUpperCase())
  const use = same.length > 0 ? same : segments
  const sum = use.reduce((acc, s) => acc + s.cost, 0)
  return sum / use.length
}

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  if (!productId) {
    return <div className="p-8 text-sm text-text-secondary">Invalid product.</div>
  }
  return <ProductDetailBody key={productId} productId={productId} />
}

function ProductThumbSm({ url, title }: { url: string | null; title: string }) {
  const [broken, setBroken] = useState(!url)
  if (!url || broken) {
    return (
      <div
        className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-muted/50 text-text-tertiary"
        aria-hidden
      >
        <ImageIcon className="size-6 opacity-70" />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={title}
      className="size-16 shrink-0 rounded-md border border-border-subtle object-cover"
      loading="eager"
      onError={() => setBroken(true)}
    />
  )
}

function ProductDetailSkeleton() {
  return (
    <DashboardPage className="flex flex-1 flex-col gap-6 lg:gap-8">
      <div className="flex min-w-0 gap-4 border-b border-border-subtle pb-6">
        <Skeleton className="size-16 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-9 w-full max-w-lg" />
          <Skeleton className="h-8 w-full max-w-sm" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-10 w-44 shrink-0" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
          <div className="flex flex-col gap-3 lg:col-span-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} size="sm" className="flex-1">
                <CardHeader className="pb-2">
                  <Skeleton className="h-3 w-28" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-3 w-full max-w-[12rem]" />
                  <Skeleton className="h-7 w-36 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex min-w-0 flex-col lg:col-span-2">
            <Skeleton className="mb-2 h-4 w-48" />
            <Skeleton className="min-h-64 flex-1 w-full rounded-md" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-none border-0 p-0 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-3 w-full max-w-md" />
          </div>
          <Skeleton className="h-8 w-full max-w-md shrink-0 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-md border border-border-subtle bg-muted/20 px-3 py-2.5"
            >
              <Skeleton className="mb-2 h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-none border-0 p-0 shadow-none">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-3 w-72 max-w-full" />
        <div className="overflow-hidden rounded-md border border-border-subtle">
          <Skeleton className="h-10 w-full rounded-none" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-none border-t border-border-subtle" />
          ))}
        </div>
      </div>
    </DashboardPage>
  )
}

function ProductDetailBody({ productId }: { productId: string }) {
  const { lang } = useLanguage()
  const t = useCallback((k: Parameters<typeof shellT>[1]) => shellT(lang, k), [lang])
  const { tenantId } = useCurrentTenant()
  const qc = useQueryClient()
  const { upsertActivity, patchActivity } = useGlobalActivity()

  const defaultInsight = useMemo(() => defaultProductInsightRange(), [])
  const [insightStart, setInsightStart] = useState(defaultInsight.start)
  const [insightEnd, setInsightEnd] = useState(defaultInsight.end)

  const detailQuery = useProductDetailQuery(productId, {
    metricsStart: insightStart,
    metricsEnd: insightEnd,
  })
  const patchMutation = usePatchProductCostMutation(productId)
  const backfillMutation = useEnqueueCogsBackfillMutation(productId)

  const detail = detailQuery.data
  const baseCurrency = detail?.base_currency ?? 'USD'
  const { format: formatMoney } = useMoney()
  const fmtBase = (v: number) => formatMoney(v, { nativeCurrency: baseCurrency })

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editCost, setEditCost] = useState('')
  const [costEditMode, setCostEditMode] = useState<CostEditMode>('forward')
  const [rangeStart, setRangeStart] = useState(defaultBackfillRange().start)
  const [rangeEnd, setRangeEnd] = useState(defaultBackfillRange().end)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [editingSku, setEditingSku] = useState(false)
  const [skuDraft, setSkuDraft] = useState('')

  const jobQuery = useCatalogJobQuery(activeJobId, Boolean(activeJobId))

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

  const resetSheetForm = useCallback((d: ProductDetailApi) => {
    setEditCost(d.cost != null ? String(d.cost) : '')
    const d0 = defaultBackfillRange()
    setRangeStart(d0.start)
    setRangeEnd(d0.end)
    setCostEditMode('forward')
  }, [])

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      setSheetOpen(open)
      if (open && detail) resetSheetForm(detail)
    },
    [detail, resetSheetForm],
  )

  const openEditSheet = useCallback(() => {
    if (detail) resetSheetForm(detail)
    setSheetOpen(true)
  }, [detail, resetSheetForm])

  const chartData = useMemo(() => {
    if (!detail) return { points: [], series: [] }
    const t0 = todayYmd()
    return buildProductCostPriceChartData(detail.cost_history, detail.listing_price_history, {
      todayYmd: t0,
      baseCurrency,
    })
  }, [detail, baseCurrency])

  const avgHistory = useMemo(
    () => (detail ? avgCostFromHistory(detail.cost_history, baseCurrency) : null),
    [detail, baseCurrency],
  )

  const effectiveSinceLabel = useMemo(() => {
    if (!detail?.cost_history.length) return '—'
    const t0 = todayYmd()
    const sorted = [...detail.cost_history].sort((a, b) => a.effective_from.localeCompare(b.effective_from))
    const active = sorted.find(
      (s) =>
        s.effective_from <= t0 &&
        (s.effective_to == null || s.effective_to === '' || s.effective_to >= t0),
    )
    return active?.effective_from ?? sorted[sorted.length - 1]?.effective_from ?? '—'
  }, [detail])


  const futureSegment = useMemo(() => {
    if (!detail?.cost_history?.length) return null
    const t0 = new Date()
    t0.setHours(0, 0, 0, 0)
    for (const seg of detail.cost_history) {
      const from = new Date(`${seg.effective_from}T00:00:00`)
      if (from > t0) return seg
    }
    return null
  }, [detail])

  const parsedSheetCost = Number.parseFloat(editCost.trim())
  const sheetCostValid = !Number.isNaN(parsedSheetCost) && parsedSheetCost >= 0 && editCost.trim() !== ''
  const rangeOk = rangeStart <= rangeEnd
  const sheetCanSubmit =
    sheetCostValid &&
    (costEditMode === 'forward' || rangeOk) &&
    !patchMutation.isPending &&
    !backfillMutation.isPending

  const handleSheetSave = async () => {
    if (!sheetCanSubmit || !detail) return
    try {
      if (costEditMode === 'forward') {
        await patchMutation.mutateAsync({ cost: parsedSheetCost })
        toast.success(t('productsDetailToastCostSaved'))
      } else {
        const res = await backfillMutation.mutateAsync({
          cost: parsedSheetCost,
          effective_from: rangeStart,
          effective_to: rangeEnd,
        })
        setActiveJobId(res.job_id)
        upsertActivity({
          id: cogsBackfillActivityId(res.job_id),
          phase: 'loading',
          title: t('globalActivityCogsBackfillTitle'),
          subtitle: t('productsJobQueued'),
          href: `/dashboard/products/${productId}`,
          minimized: false,
        })
      }
      handleSheetOpenChange(false)
    } catch {
      toast.error(t('productsDetailToastSaveFailed'))
    }
  }

  const handleSkuSave = async () => {
    const trimmed = skuDraft.trim()
    try {
      await patchMutation.mutateAsync({ internal_sku: trimmed.length > 0 ? trimmed : null })
      toast.success(t('productsDetailToastSkuSaved'))
      setEditingSku(false)
    } catch {
      toast.error(t('productsDetailToastSaveFailed'))
    }
  }

  const onInsightRangeClear = useCallback(() => {
    const d0 = defaultProductInsightRange()
    setInsightStart(d0.start)
    setInsightEnd(d0.end)
  }, [])

  useEffect(() => {
    if (jobQuery.data?.status !== 'succeeded' || !tenantId) return
    void qc.invalidateQueries({ queryKey: ['catalog', 'product', tenantId, productId] })
  }, [jobQuery.data?.status, qc, tenantId, productId])

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

  if (detailQuery.isError) {
    return <div className="p-8 text-sm text-destructive">Failed to load product.</div>
  }

  if (detailQuery.isLoading || !detail) {
    return <ProductDetailSkeleton />
  }

  const bigCostFormatted = detail.cost != null ? fmtBase(detail.cost) : '—'
  const updatedDays = daysSinceUpdated(detail.updated_at)
  const updatedBadge =
    updatedDays <= 0
      ? t('productsDetailLastUpdatedToday')
      : t('productsDetailLastUpdatedDays').replace('{days}', String(updatedDays))

  const hasInsightData =
    detail.period_start != null ||
    detail.period_sales > 0 ||
    detail.period_orders > 0 ||
    detail.period_units_sold > 0 ||
    Number(detail.period_cogs) > 0
  const showInsightValues = hasInsightData || Boolean(insightStart && insightEnd)

  const sheetBusy = patchMutation.isPending || backfillMutation.isPending

  const insightKpi = (value: React.ReactNode): React.ReactNode =>
    showInsightValues ? value : t('productsDetailKpiNoData')

  return (
    <DashboardPage className="flex flex-1 flex-col gap-6 lg:gap-8">
      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="max-w-md">
          <SheetHeader>
            <SheetTitle>{t('productsDetailEditSheetTitle')}</SheetTitle>
            <SheetDescription>{t('productsDetailCostHelp').replace('{currency}', baseCurrency)}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-text-secondary">
              {t('productsDetailEditCostLabel').replace('{currency}', baseCurrency)}
              <Input
                type="number"
                min={0}
                step="0.01"
                value={editCost}
                onChange={(e) => setEditCost(e.target.value)}
                className={cn('font-numeric', NUM)}
              />
            </label>
            <div className="space-y-2" role="radiogroup" aria-label={t('productsDetailCostModeGroupAria')}>
              <p className="text-xs font-medium text-text-secondary">{t('productsDetailCostModeGroupLabel')}</p>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors',
                  costEditMode === 'forward'
                    ? 'border-border-default bg-muted/30'
                    : 'border-border-subtle hover:bg-muted/20',
                )}
              >
                <input
                  type="radio"
                  name="cost-edit-mode"
                  className="mt-0.5"
                  checked={costEditMode === 'forward'}
                  onChange={() => setCostEditMode('forward')}
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
                  costEditMode === 'history'
                    ? 'border-border-default bg-muted/30'
                    : 'border-border-subtle hover:bg-muted/20',
                )}
              >
                <input
                  type="radio"
                  name="cost-edit-mode"
                  className="mt-0.5"
                  checked={costEditMode === 'history'}
                  onChange={() => setCostEditMode('history')}
                />
                <span className="min-w-0">
                  <span className="font-medium text-text-primary">{t('productsDetailCostModeHistory')}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">
                    {t('productsDetailCostModeHistoryHelp')}
                  </span>
                </span>
              </label>
            </div>
            {costEditMode === 'history' ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-secondary">{t('productsDetailRecalcCogsRangeLabel')}</p>
                <DateRangePicker
                  strings={pickerStrings}
                  startValue={rangeStart}
                  endValue={rangeEnd}
                  onStartChange={(v) => v && setRangeStart(v)}
                  onEndChange={(v) => v && setRangeEnd(v)}
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
          <SheetFooter className="px-6">
            <Button type="button" variant="outline" onClick={() => handleSheetOpenChange(false)}>
              {t('productsDetailSheetCancel')}
            </Button>
            <Button type="button" onClick={() => void handleSheetSave()} disabled={!sheetCanSubmit}>
              {sheetBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : t('productsDetailSheetSave')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 gap-4 border-b border-border-subtle pb-6">
        <ProductThumbSm url={detail.image_url} title={detail.title} />
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-3xl">
            {detail.variant_label ?? detail.title}
          </h1>
          {detail.parent_product_id ? (
            <Link
              to={`/dashboard/products/${detail.parent_product_id}`}
              className="inline-block text-sm font-medium text-primary hover:underline"
            >
              {t('productsDetailParentLink')}
            </Link>
          ) : null}
          <ProductDetailSkuRow
            internalSku={detail.internal_sku}
            t={t}
            editing={editingSku}
            draft={skuDraft}
            onDraftChange={setSkuDraft}
            onStartEdit={() => {
              setSkuDraft(detail.internal_sku ?? '')
              setEditingSku(true)
            }}
            onCancelEdit={() => setEditingSku(false)}
            onSave={() => void handleSkuSave()}
            savePending={patchMutation.isPending}
          />
          <ProductDetailHeaderMeta detail={detail} t={t} />
          {detail.brand ? <p className="text-sm text-text-secondary">{detail.brand}</p> : null}
        </div>
      </div>

      {futureSegment ? (
        <Card size="sm" variant="solid" className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="py-3 text-xs text-amber-950 dark:text-amber-100">
            {t('productsFutureSegmentNotice').replace('{date}', futureSegment.effective_from)}
          </CardContent>
        </Card>
      ) : null}

      <ProductDetailSections
        detail={detail}
        t={t}
        baseCurrency={baseCurrency}
        bigCostFormatted={bigCostFormatted}
        updatedBadge={updatedBadge}
        effectiveSinceLabel={effectiveSinceLabel}
        avgHistory={avgHistory}
        chartData={chartData}
        costAmountWithBaseCode={costAmountWithBaseCode}
        fmtBase={fmtBase}
        insightStart={insightStart}
        insightEnd={insightEnd}
        setInsightStart={setInsightStart}
        setInsightEnd={setInsightEnd}
        onInsightRangeClear={onInsightRangeClear}
        pickerStrings={pickerStrings}
        showInsightValues={showInsightValues}
        insightKpi={insightKpi}
        isFetching={detailQuery.isFetching}
        onEditCost={openEditSheet}
      />
    </DashboardPage>
  )
}

