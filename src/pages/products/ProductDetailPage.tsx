import { useCallback, useEffect, useMemo, useState } from 'react'
import { ImageIcon, Loader2, Pencil } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import type {
  ProductCostHistorySegmentApi,
  ProductDetailApi,
} from '@/lib/types/catalog'
import { fmtCurrency, toYmd } from '@/pages/reports/reports-ui-helpers'
import { useMoney } from '@/hooks/use-money'
import { useLanguage } from '@/shell/providers/language-provider'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import {
  cogsBackfillActivityId,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'

import { buildProductCostPriceChartData } from './product-cost-chart-points'
import { ProductCostOverTimeChart } from './product-cost-over-time-chart'
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

function formatPlatformSlug(slug: string): string {
  return slug
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <Skeleton className="size-16 shrink-0 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 self-end sm:self-start" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} size="sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-20" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-7 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-56 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card size="sm">
            <CardContent className="py-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
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

  const detailQuery = useProductDetailQuery(productId)
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

  const hasPeriodMetrics =
    detail.period_start != null ||
    detail.period_units_sold > 0 ||
    Number(detail.period_cogs) > 0

  const sheetBusy = patchMutation.isPending || backfillMutation.isPending

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

      <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <ProductThumbSm url={detail.image_url} title={detail.title} />
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-3xl">
              {detail.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-secondary">
              {detail.brand ? <span>{detail.brand}</span> : null}
              {editingSku ? (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="shrink-0 text-text-tertiary">SKU:</span>
                  <Input
                    value={skuDraft}
                    onChange={(e) => setSkuDraft(e.target.value)}
                    placeholder={t('productsDetailSkuPlaceholder')}
                    className="h-8 max-w-[14rem] font-mono text-xs"
                  />
                  <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    disabled={patchMutation.isPending}
                    onClick={() => void handleSkuSave()}
                  >
                    {t('productsDetailSkuSave')}
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => setEditingSku(false)}
                  >
                    {t('productsDetailSheetCancel')}
                  </Button>
                </div>
              ) : (
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className={cn(NUM, 'text-text-tertiary')}>
                    {detail.internal_sku?.trim()
                      ? t('productsDetailHeaderMetaSku').replace('{sku}', detail.internal_sku)
                      : t('productsDetailHeaderMetaSkuUnset')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 shrink-0"
                    aria-label={t('productsDetailEditSkuAria')}
                    onClick={() => {
                      setSkuDraft(detail.internal_sku ?? '')
                      setEditingSku(true)
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <div className={cn('text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl', NUM)}>
            {costAmountWithBaseCode(bigCostFormatted, baseCurrency, 'text-lg sm:text-2xl')}
          </div>
          <Badge variant="secondary" className={cn('font-normal', NUM)}>
            {updatedBadge}
          </Badge>
        </div>
      </div>

      {detail.has_listing_currency_mismatch ? (
        <Card size="sm" variant="solid">
          <CardContent className="py-3 text-xs text-text-secondary">
            {t('productsDetailListingCurrencyCallout')}
          </CardContent>
        </Card>
      ) : null}

      {futureSegment ? (
        <Card size="sm" variant="solid" className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="py-3 text-xs text-amber-950 dark:text-amber-100">
            {t('productsFutureSegmentNotice').replace('{date}', futureSegment.effective_from)}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-text-secondary">
              {t('productsDetailKpiCurrentCost')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className={cn('text-lg font-semibold text-text-primary sm:text-xl', NUM)}>
              {costAmountWithBaseCode(
                detail.cost != null ? fmtBase(detail.cost) : '—',
                baseCurrency,
                'text-xs sm:text-sm',
              )}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-text-secondary">
              {t('productsDetailKpiAvgCost')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className={cn('text-lg font-semibold text-text-primary sm:text-xl', NUM)}>
              {costAmountWithBaseCode(
                avgHistory != null ? fmtBase(avgHistory) : '—',
                baseCurrency,
                'text-xs sm:text-sm',
              )}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-text-secondary">
              {t('productsDetailKpiUnitsSold')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p
              className={cn(
                'text-lg font-semibold sm:text-xl',
                hasPeriodMetrics ? 'text-text-primary' : 'text-text-tertiary',
                NUM,
              )}
            >
              {hasPeriodMetrics
                ? String(detail.period_units_sold)
                : t('productsDetailKpiNoData')}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-text-secondary">
              {t('productsDetailKpiCogsTotal')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p
              className={cn(
                'text-lg font-semibold sm:text-xl',
                hasPeriodMetrics ? 'text-text-primary' : 'text-text-tertiary',
                NUM,
              )}
            >
              {hasPeriodMetrics
                ? costAmountWithBaseCode(fmtBase(detail.period_cogs), baseCurrency, 'text-xs sm:text-sm')
                : t('productsDetailKpiNoData')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('productsDetailCostVsPriceOverTimeTitle')}</CardTitle>
              <CardDescription className="text-xs">
                {t('productsColCost')} vs {t('productsDetailListingColPrice')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProductCostOverTimeChart data={chartData.points} series={chartData.series} t={t} />
            </CardContent>
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <Card size="sm" className="gap-2 py-3">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 px-3 py-2">
              <CardTitle className="text-sm">{t('productsDetailSummaryCardTitle')}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                aria-label={t('productsDetailEditAria')}
                onClick={() => openEditSheet()}
              >
                <Pencil className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-3 pt-0">
              <p className={cn('text-2xl font-semibold text-text-primary sm:text-3xl', NUM)}>
                {costAmountWithBaseCode(bigCostFormatted, baseCurrency, 'text-base sm:text-xl')}
              </p>
              <dl className="space-y-1.5 text-xs text-text-secondary">
                <div>
                  <dt className="text-text-tertiary">{t('productsDetailEffectiveSince')}</dt>
                  <dd className={cn('font-medium text-text-primary', NUM)}>{effectiveSinceLabel}</dd>
                </div>
                <div>
                  <dt className="text-text-tertiary">{t('productsDetailLastSyncedLabel')}</dt>
                  <dd className={cn('font-medium text-text-primary', NUM)}>
                    {new Date(detail.updated_at).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card size="sm" className="gap-2 py-3">
            <CardHeader className="space-y-0 px-3 py-2">
              <CardTitle className="text-sm">{t('productsDetailChannelsCardTitle')}</CardTitle>
              <CardDescription className="text-xs">{t('productsDetailListingsTitle')}</CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="overflow-x-auto rounded-md border border-border-subtle">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-8 text-xs">{t('productsDetailListingColPlatform')}</TableHead>
                      <TableHead className="h-8 text-xs">{t('productsDetailListingColSku')}</TableHead>
                      <TableHead className="h-8 text-right text-xs">{t('productsDetailListingColPrice')}</TableHead>
                      <TableHead className="h-8 text-xs">{t('productsDetailListingColCurrency')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.listings.map((li) => (
                      <TableRow key={li.id} className="hover:bg-muted/40">
                        <TableCell className="py-2">
                          <Badge variant="outline" className="font-normal">
                            {formatPlatformSlug(li.platform)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-32 truncate py-2 font-mono text-xs" title={li.platform_sku}>
                          {li.platform_sku}
                        </TableCell>
                        <TableCell className={cn('py-2 text-right text-xs', NUM)}>
                          {li.platform_price != null && li.currency
                            ? fmtCurrency(li.platform_price, li.currency)
                            : '—'}
                        </TableCell>
                        <TableCell className={cn('py-2 text-xs', NUM)}>{li.currency ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </DashboardPage>
  )
}

