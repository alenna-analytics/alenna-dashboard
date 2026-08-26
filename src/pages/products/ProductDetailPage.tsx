import { useCallback, useMemo, useState } from 'react'
import { ImageIcon } from 'lucide-react'

import { useParams } from 'react-router-dom'

import { usePnlAwareT } from '@/pages/configuration/pnl-terms/use-pnl-labels-queries'
import type {
  ProductCostHistorySegmentApi,
} from '@/lib/types/catalog'
import { useMoney } from '@/hooks/use-money'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { Card, CardContent } from '@/ui/card'
import { dateRangePickerStrings, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { Skeleton } from '@/ui/skeleton'
import { can } from '@/lib/permissions/can'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { buildProductCostPriceChartData } from './product-cost-chart-points'
import { todayYmd } from './product-cost-date-utils'
import { ProductCostEditorSheet } from './product-cost-editor-sheet'
import { productChannelSeriesLabel } from './product-platform-label'
import { ProductDetailSections } from './product-detail-sections'
import { ProductDetailHeader } from './product-detail-header'
import { ProductDetailUnsavedBar } from './product-detail-unsaved-bar'
import { defaultProductInsightRange } from './product-detail-range'
import { usePatchProductCostMutation, useProductDetailQuery } from './use-catalog-queries'

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

function ProductDetailHeaderThumb({ url, title }: { url: string | null; title: string }) {
  const [broken, setBroken] = useState(!url)
  const thumbClass =
    'size-20 shrink-0 rounded-md border border-border-subtle object-cover sm:size-[150px]'
  if (!url || broken) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted/50 text-text-tertiary',
          thumbClass,
        )}
        aria-hidden
      >
        <ImageIcon className="size-8 opacity-70 sm:size-10" />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={title}
      className={thumbClass}
      width={150}
      height={150}
      sizes="(max-width: 640px) 80px, 150px"
      loading="eager"
      onError={() => setBroken(true)}
    />
  )
}

function ProductDetailHeaderStatsSkeleton() {
  const columns = ['sku', 'channels', 'created', 'updated', 'sync'] as const

  return (
    <div className="grid w-full grid-cols-2 gap-x-4 gap-y-4 sm:inline-flex sm:max-w-full sm:flex-wrap sm:items-stretch">
      {columns.map((key, index) => (
        <div
          key={key}
          className={cn(
            'flex shrink-0 flex-col gap-1',
            key === 'sku' && 'col-span-2 sm:col-span-1 sm:min-w-[9rem]',
            index > 0 && 'sm:border-l sm:border-border-subtle sm:pl-6',
            index < columns.length - 1 && (key === 'sku' ? 'sm:pr-6' : 'sm:pr-5'),
          )}
        >
          <Skeleton className="h-3 w-14" />
          {key === 'sku' ? (
            <Skeleton className="h-8 w-full max-w-none rounded-md sm:max-w-[11rem]" />
          ) : (
            <Skeleton className="h-4 w-20" />
          )}
        </div>
      ))}
    </div>
  )
}

function ProductDetailAlertCardSkeleton() {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border-subtle bg-white px-4 py-3.5"
      aria-hidden
    >
      <Skeleton className="size-9 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-7 w-[4.5rem] shrink-0 rounded-md" />
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <DashboardPage className="flex min-h-full flex-1 flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:gap-6">
        <Skeleton className="h-5 w-16 lg:hidden" />

        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-1 sm:gap-0 sm:space-y-3">
            <Skeleton className="size-20 shrink-0 rounded-md sm:hidden" />
            <div className="min-w-0 space-y-3">
              <Skeleton className="h-8 w-full max-w-lg sm:h-9" />
              <Skeleton className="h-7 w-24 rounded-md" />
              <div className="hidden sm:block">
                <ProductDetailHeaderStatsSkeleton />
              </div>
            </div>
          </div>
          <Skeleton className="hidden size-[150px] shrink-0 rounded-md sm:block" />
        </div>

        <div className="sm:hidden">
          <ProductDetailHeaderStatsSkeleton />
        </div>

        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <ProductDetailAlertCardSkeleton />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="inline-flex w-full gap-6 border-b border-border-subtle pb-3">
          {['w-20', 'w-14', 'w-36'].map((widthClass) => (
            <Skeleton key={widthClass} className={cn('h-5 rounded-sm', widthClass)} />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-8">
          <Skeleton className="h-3 w-full max-w-md" />

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <Skeleton className="h-9 w-full max-w-md rounded-md" />
            <Skeleton className="h-9 w-full rounded-md sm:w-48" />
          </div>

          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-md border border-border-subtle bg-muted/20 px-3 py-2.5"
              >
                <Skeleton className="mb-2 h-3 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>

          <Skeleton className="h-[220px] w-full rounded-md" />

          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-3 w-72 max-w-full" />
            <div className="overflow-hidden rounded-md border border-border-subtle">
              <Skeleton className="h-10 w-full rounded-none" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-11 w-full rounded-none border-t border-border-subtle"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardPage>
  )
}

function ProductDetailBody({ productId }: { productId: string }) {
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const canEditProducts = can(me, 'products.edit')
  const t = usePnlAwareT()

  const defaultInsight = useMemo(() => defaultProductInsightRange(), [])
  const [insightStart, setInsightStart] = useState(defaultInsight.start)
  const [insightEnd, setInsightEnd] = useState(defaultInsight.end)

  const detailQuery = useProductDetailQuery(productId, {
    metricsStart: insightStart,
    metricsEnd: insightEnd,
  })
  const patchMutation = usePatchProductCostMutation(productId)

  const detail = detailQuery.data
  const baseCurrency = detail?.base_currency ?? 'USD'
  const { format: formatMoney, formatKpi, effectiveDisplayCurrency } = useMoney()
  const fmtBase = (v: number) => formatMoney(v, { nativeCurrency: baseCurrency })
  const fmtCard = (v: number) => formatKpi(v, { nativeCurrency: baseCurrency })

  const [costEditorOpen, setCostEditorOpen] = useState(false)
  const [costEditorProductId, setCostEditorProductId] = useState<string | null>(null)
  const [costEditorParentId, setCostEditorParentId] = useState<string | null>(null)
  const [skuDraft, setSkuDraft] = useState('')
  const [skuSeed, setSkuSeed] = useState<{ productId: string; sku: string } | null>(null)

  const serverSku = detail?.internal_sku ?? ''
  if (detail) {
    const skuDirtyForReseed = skuDraft.trim() !== serverSku.trim()
    const needsSkuReseed =
      skuSeed === null ||
      skuSeed.productId !== detail.id ||
      (!skuDirtyForReseed && skuSeed.sku !== serverSku)
    if (needsSkuReseed) {
      setSkuSeed({ productId: detail.id, sku: serverSku })
      setSkuDraft(serverSku)
    }
  }

  const pickerStrings: DateRangePickerStrings = useMemo(
    () => dateRangePickerStrings(t),
    [t],
  )

  const openCostEditor = useCallback(
    (targetProductId: string, parentProductId: string) => {
      setCostEditorProductId(targetProductId)
      setCostEditorParentId(parentProductId)
      setCostEditorOpen(true)
    },
    [],
  )

  const openEditSheet = useCallback(() => {
    openCostEditor(productId, productId)
  }, [openCostEditor, productId])

  const openVariantCostEditor = useCallback(
    (variantProductId: string) => {
      openCostEditor(variantProductId, productId)
    },
    [openCostEditor, productId],
  )

  const costEditorInitialDetail =
    costEditorProductId === productId ? detail : null

  const chartData = useMemo(() => {
    if (!detail) return { points: [], series: [] }
    const t0 = todayYmd()
    return buildProductCostPriceChartData(detail.cost_history, detail.listing_price_history, {
      todayYmd: t0,
      baseCurrency,
      channelSeriesLabel: (platform, variantLabel) =>
        productChannelSeriesLabel(platform, variantLabel, t),
    })
  }, [detail, baseCurrency, t])

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

  const savedSku = detail?.internal_sku?.trim() ?? ''
  const skuDirty = detail != null && skuDraft.trim() !== savedSku

  const handleSkuDiscard = useCallback(() => {
    if (!detail) return
    setSkuDraft(detail.internal_sku ?? '')
  }, [detail])

  const handleSkuSave = async () => {
    const trimmed = skuDraft.trim()
    try {
      await patchMutation.mutateAsync({ internal_sku: trimmed.length > 0 ? trimmed : null })
      toast.success(t('productsDetailToastSkuSaved'))
    } catch {
      toast.error(t('productsDetailToastSaveFailed'))
    }
  }

  if (detailQuery.isError) {
    return <div className="p-8 text-sm text-destructive">Failed to load product.</div>
  }

  if (!detail && detailQuery.isPending) {
    return <ProductDetailSkeleton />
  }

  if (!detail) {
    return <div className="p-8 text-sm text-text-secondary">Failed to load product.</div>
  }

  const bigCostFormatted = detail.cost != null ? fmtCard(detail.cost) : '—'
  const updatedDays = daysSinceUpdated(detail.updated_at)
  const updatedBadge =
    updatedDays <= 0
      ? t('productsDetailLastUpdatedToday')
      : t('productsDetailLastUpdatedDays').replace('{days}', String(updatedDays))

  const hasInsightData =
    detail.period_start != null ||
    detail.period_sales > 0 ||
    detail.period_units_sold > 0 ||
    detail.consolidated_stock_quantity != null ||
    detail.inventory_days != null
  const showInsightValues = hasInsightData || Boolean(insightStart && insightEnd)

  const insightKpi = (value: React.ReactNode): React.ReactNode =>
    showInsightValues ? value : t('productsDetailKpiNoData')

  return (
    <DashboardPage className="flex min-h-full flex-1 flex-col gap-6 lg:gap-8">
      {canEditProducts ? (
      <ProductCostEditorSheet
        lang={lang}
        open={costEditorOpen}
        productId={costEditorProductId}
        parentProductId={costEditorParentId}
        initialDetail={costEditorInitialDetail}
        onOpenChange={setCostEditorOpen}
      />
      ) : null}

      <ProductDetailHeader
        detail={detail}
        productId={productId}
        t={t}
        lang={lang}
        thumb={<ProductDetailHeaderThumb url={detail.image_url} title={detail.title} />}
        skuDraft={skuDraft}
        onSkuDraftChange={canEditProducts ? setSkuDraft : undefined}
        fmtMoney={fmtBase}
      />

      {futureSegment ? (
        <Card size="sm" variant="solid" className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="py-3 text-xs text-amber-950 dark:text-amber-100">
            {t('productsFutureSegmentNotice').replace('{date}', futureSegment.effective_from)}
          </CardContent>
        </Card>
      ) : null}

      <ProductDetailSections
        productId={productId}
        lang={lang}
        detail={detail}
        t={t}
        baseCurrency={effectiveDisplayCurrency}
        bigCostFormatted={bigCostFormatted}
        updatedBadge={updatedBadge}
        effectiveSinceLabel={effectiveSinceLabel}
        avgHistory={avgHistory}
        chartData={chartData}
        costAmountWithBaseCode={costAmountWithBaseCode}
        fmtBase={fmtBase}
        fmtCard={fmtCard}
        displayCurrency={effectiveDisplayCurrency}
        insightStart={insightStart}
        insightEnd={insightEnd}
        setInsightStart={setInsightStart}
        setInsightEnd={setInsightEnd}
        pickerStrings={pickerStrings}
        showInsightValues={showInsightValues}
        insightKpi={insightKpi}
        insightsFetching={detailQuery.isFetching}
        onEditCost={canEditProducts ? openEditSheet : undefined}
        onOpenVariantCostEditor={canEditProducts ? openVariantCostEditor : undefined}
      />

      {canEditProducts ? (
      <ProductDetailUnsavedBar
        open={skuDirty}
        t={t}
        onDiscard={handleSkuDiscard}
        onSave={() => void handleSkuSave()}
        savePending={patchMutation.isPending}
      />
      ) : null}
    </DashboardPage>
  )
}

