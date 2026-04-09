import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Activity, BarChart3, ChevronRight } from 'lucide-react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { useCurrentTenant } from '@/auth/hooks'
import { ChannelBadge } from '@/components/composed/channel-badge'
import { DeltaBadge } from '@/components/composed/delta-badge'
import { DashboardFiltersBar } from '@/components/composed/dashboard-filters-bar'
import type { DataTableColumn } from '@/components/composed/data-table'
import { DataTable } from '@/components/composed/data-table'
import { EmptyState } from '@/components/composed/empty-state'
import { MetricCard } from '@/components/composed/metric-card'
import { ProductThumbnail } from '@/components/composed/product-thumbnail'
import { StateTag } from '@/components/composed/state-tag'
import { useCurrency } from '@/components/providers/currency-provider'
import { useLanguage } from '@/components/providers/language-provider'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  useAnalyticsDaily,
  useAnalyticsSummary,
  useCatalogProductDetail,
  useProductsInsights,
} from '@/hooks/use-analytics'
import type { AnalyticsFilters, DeltaValue, ProductListing } from '@/lib/analytics-types'
import { buildYearShortcutOptions, fullCalendarMonthValue, isFullCalendarYearRange } from '@/lib/dashboard-date-shortcuts'
import {
  DASHBOARD_PLATFORMS,
  PLATFORM_LABELS,
  type DashboardSalesChannel,
  type DashboardStringKey,
  dashboardT,
} from '@/lib/dashboard-strings'
import { fmtDateByLanguage, fmtPct, toIso, toLocalIsoDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { tooltipContentStyle } from '@/components/charts/chart-theme'

type SalesChannel = DashboardSalesChannel
const PLATFORMS = DASHBOARD_PLATFORMS

function normalizeListingPlatform(platform: string): string {
  const x = platform.trim().toLowerCase()
  if (['amazon', 'amzn', 'amazon.com', 'amazon marketplace'].includes(x)) return 'amazon'
  if (x === 'shopify') return 'shopify'
  if (['mercadolibre', 'mercado libre', 'mercadolibre.com', 'ml'].includes(x)) return 'mercadolibre'
  return x
}

function defaultStart(): Date {
  const d = new Date()
  d.setDate(1)
  return d
}

function parseDate(s: string | null, fallback: Date): Date {
  if (!s) return fallback
  const d = new Date(s + 'T00:00:00')
  return isNaN(d.getTime()) ? fallback : d
}

type ListingRow = ProductListing & {
  channelLabel: string
  periodCogs: string | null
  periodFees: string | null
}

function deltaFooter(
  deltas: Record<string, DeltaValue> | undefined,
  key: string,
): ReactNode {
  const d = deltas?.[key]
  if (d?.change_pct == null || d.change_pct === '') return undefined
  const n = Number(d.change_pct)
  if (Number.isNaN(n)) return undefined
  return <DeltaBadge value={fmtPct(d.change_pct)} positive={n >= 0} className="text-[11px] font-medium" />
}

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const [params, setParams] = useSearchParams()
  const { lang } = useLanguage()
  const { role } = useCurrentTenant()
  const canEdit = role === 'admin' || role === 'owner'
  const t = useCallback((key: DashboardStringKey) => dashboardT(lang, key), [lang])
  const locale = lang === 'es' ? 'es-MX' : 'en-US'
  const { formatCurrency, formatCurrencyValue, displayCurrency } = useCurrency()

  const startDate = parseDate(params.get('start'), defaultStart())
  const endDate = parseDate(params.get('end'), new Date())
  const granularity = params.get('granularity') ?? 'monthly'

  const selectedPlatforms = useMemo(() => {
    const p = params.getAll('platform')
    if (!p.length) return undefined
    return p.filter((x): x is SalesChannel => PLATFORMS.includes(x as SalesChannel))
  }, [params])

  const shortcutYearValue = useMemo(
    () => (isFullCalendarYearRange(startDate, endDate) ? String(startDate.getFullYear()) : ''),
    [startDate, endDate],
  )
  const shortcutMonthValue = useMemo(() => fullCalendarMonthValue(startDate, endDate) ?? '', [startDate, endDate])
  const yearShortcutOptions = useMemo(() => buildYearShortcutOptions(), [])
  const referenceYearForMonth = useMemo(
    () => (shortcutYearValue ? Number.parseInt(shortcutYearValue, 10) : startDate.getFullYear()),
    [shortcutYearValue, startDate],
  )

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params)
      next.set(key, value)
      setParams(next)
    },
    [params, setParams],
  )
  const togglePlatform = useCallback(
    (platform: SalesChannel) => {
      const current = params.getAll('platform')
      const next = new URLSearchParams(params)
      next.delete('platform')
      const set = new Set(current)
      if (set.has(platform)) set.delete(platform)
      else set.add(platform)
      for (const value of set) next.append('platform', value)
      setParams(next)
    },
    [params, setParams],
  )
  const selectAllPlatforms = useCallback(() => {
    const next = new URLSearchParams(params)
    next.delete('platform')
    setParams(next)
  }, [params, setParams])

  const filters: AnalyticsFilters = useMemo(
    () => ({
      start_date: toIso(startDate),
      end_date: toIso(endDate),
      platform: selectedPlatforms,
      granularity,
    }),
    [startDate, endDate, selectedPlatforms, granularity],
  )

  const scopedFilters = useMemo(
    (): AnalyticsFilters => ({
      ...filters,
      product_ids: productId ? [productId] : undefined,
      limit: 50,
    }),
    [filters, productId],
  )

  const detail = useCatalogProductDetail(productId)
  const summaryQuery = useAnalyticsSummary(scopedFilters)
  const dailyQuery = useAnalyticsDaily(scopedFilters)
  const insightsQuery = useProductsInsights(scopedFilters)

  const [selectedImageFileName, setSelectedImageFileName] = useState<string | null>(null)
  const [imageDropActive, setImageDropActive] = useState(false)

  const onProductImageFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    setSelectedImageFileName(file.name)
  }

  const insightRow = useMemo(() => {
    const items = insightsQuery.data?.sku_rows ?? []
    return items.find((i) => i.product_id === productId) ?? items[0]
  }, [insightsQuery.data?.sku_rows, productId])

  const listingRows: ListingRow[] = useMemo(() => {
    const list = detail.data?.listings ?? []
    return list.map((li) => {
      const key = normalizeListingPlatform(li.platform)
      const cogsMap = insightRow?.cogs_by_platform
      const feesMap = insightRow?.fees_by_platform
      const rawCogs = cogsMap ? (cogsMap[key] ?? cogsMap[li.platform]) : undefined
      const rawFees = feesMap ? (feesMap[key] ?? feesMap[li.platform]) : undefined
      return {
        ...li,
        channelLabel:
          PLATFORM_LABELS[li.platform as SalesChannel] ??
          (li.platform === 'shopify'
            ? 'Shopify'
            : li.platform === 'amazon'
              ? 'Amazon'
              : li.platform === 'mercadolibre'
                ? 'Mercado Libre'
                : li.platform),
        periodCogs: rawCogs ?? null,
        periodFees: rawFees ?? null,
      }
    })
  }, [detail.data?.listings, insightRow])

  const listingChannelBadges = useMemo(() => {
    const seen = new Set<SalesChannel>()
    for (const li of listingRows) {
      const p = li.platform as SalesChannel
      if (PLATFORMS.includes(p)) seen.add(p)
    }
    return [...seen]
  }, [listingRows])

  const selloutPriceByPlatform = useMemo(() => {
    const m: Record<string, number | null> = {}
    for (const li of detail.data?.listings ?? []) {
      const k = normalizeListingPlatform(li.platform)
      if (m[k] !== undefined) continue
      m[k] = li.sellout_price ?? null
    }
    return m
  }, [detail.data?.listings])

  const channelBreakdownRows = useMemo(() => {
    if (!insightRow) return []
    return Object.entries(insightRow.revenue_by_platform).map(([plat, rev]) => ({
      platKey: plat as SalesChannel,
      plat,
      rev,
      units: insightRow.units_by_platform[plat] ?? 0,
      cogs: insightRow.cogs_by_platform[plat] ?? '0',
      fees: insightRow.fees_by_platform[plat] ?? '0',
    }))
  }, [insightRow])

  const channelColumns = useMemo<DataTableColumn<(typeof channelBreakdownRows)[number]>[]>(
    () => [
      {
        key: 'plat',
        header: t('unmappedColPlatform'),
        cell: (row) => (
          <StateTag
            label={PLATFORM_LABELS[row.platKey] ?? row.plat}
            tone={
              row.plat === 'shopify'
                ? 'shopify'
                : row.plat === 'amazon'
                  ? 'amazon'
                  : row.plat === 'mercadolibre'
                    ? 'mercadolibre'
                    : 'neutral'
            }
          />
        ),
      },
      {
        key: 'rev',
        header: t('productsRevenue'),
        align: 'right',
        cell: (row) => formatCurrency(row.rev),
      },
      {
        key: 'units',
        header: t('productsUnits'),
        align: 'right',
        cell: (row) => row.units.toLocaleString(),
      },
      {
        key: 'sellout',
        header: t('productsChannelSelloutPrice'),
        align: 'right',
        cell: (row) => {
          const v = selloutPriceByPlatform[row.plat]
          return v != null ? formatCurrency(String(v)) : '—'
        },
      },
      {
        key: 'cogs',
        header: t('productsChannelCost'),
        align: 'right',
        cell: (row) => formatCurrency(row.cogs),
      },
      {
        key: 'fees',
        header: t('productsChannelFees'),
        align: 'right',
        cell: (row) => formatCurrency(row.fees),
      },
    ],
    [formatCurrency, selloutPriceByPlatform, t],
  )

  const trendData = useMemo(
    () =>
      (dailyQuery.data?.series ?? []).map((s) => ({
        period: fmtDateByLanguage(s.period_start, lang),
        net: Number(s.net_revenue),
      })),
    [dailyQuery.data?.series, lang],
  )

  const loadingMain = summaryQuery.isLoading || !summaryQuery.data

  const filtersBar: ReactNode = useMemo(
    () => (
      <DashboardFiltersBar
        t={t}
        locale={locale}
        sticky
        startDate={startDate}
        endDate={endDate}
        onStartChange={(d) => setParam('start', toIso(d))}
        onEndChange={(d) => setParam('end', toIso(d))}
        shortcutYearValue={shortcutYearValue}
        yearShortcutOptions={yearShortcutOptions}
        onYearShortcut={(year) => {
          const y = Number.parseInt(year, 10)
          if (Number.isNaN(y)) return
          const next = new URLSearchParams(params)
          next.set('start', toLocalIsoDate(new Date(y, 0, 1)))
          next.set('end', toLocalIsoDate(new Date(y, 11, 31)))
          setParams(next)
        }}
        shortcutMonthValue={shortcutMonthValue}
        referenceYearForMonth={referenceYearForMonth}
        onMonthShortcut={(ym) => {
          const [ys, ms] = ym.split('-')
          const y = Number.parseInt(ys ?? '', 10)
          const m = Number.parseInt(ms ?? '', 10) - 1
          if (Number.isNaN(y) || Number.isNaN(m) || m < 0 || m > 11) return
          const next = new URLSearchParams(params)
          next.set('start', toLocalIsoDate(new Date(y, m, 1)))
          next.set('end', toLocalIsoDate(new Date(y, m + 1, 0)))
          setParams(next)
        }}
        platforms={PLATFORMS}
        platformLabels={PLATFORM_LABELS}
        selectedPlatforms={selectedPlatforms}
        onTogglePlatform={togglePlatform}
        onSelectAllPlatforms={selectAllPlatforms}
        granularity={granularity}
        onGranularityChange={(v) => setParam('granularity', v)}
      />
    ),
    [
      t,
      locale,
      params,
      setParams,
      startDate,
      endDate,
      shortcutYearValue,
      yearShortcutOptions,
      shortcutMonthValue,
      referenceYearForMonth,
      selectedPlatforms,
      granularity,
      togglePlatform,
      selectAllPlatforms,
      setParam,
    ],
  )

  if (!productId) {
    return <p className="text-sm text-text-secondary">{t('catalogNotFound')}</p>
  }

  if (productId === 'unmapped') {
    return <Navigate to="/dashboard/products/unmapped" replace />
  }

  if (detail.isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-8 pb-6">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="size-3.5 rounded-sm" />
          <Skeleton className="h-3 w-48 max-w-[50%]" />
        </div>
        <div className="rounded-2xl border border-border-subtle/30 bg-muted/15 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <Skeleton className="h-[100px] w-[100px] shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-4">
              <Skeleton className="h-9 w-full max-w-xl" />
              <Skeleton className="h-3 w-32" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        </div>
        {filtersBar}
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-8 lg:grid-cols-10 lg:items-start">
          <div className="space-y-8 lg:col-span-7">
            <Card variant="solid" className="border-border-subtle/50 bg-muted/20 shadow-sm">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-44" />
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-[220px] w-full rounded-xl" />
              </CardContent>
            </Card>
            <Card variant="solid" className="border-border-subtle/40 bg-card/50">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-52" />
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
          <Card variant="solid" className="border-border-subtle/40 bg-muted/10 lg:col-span-3 lg:min-h-[280px]">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-28 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (detail.isError || !detail.data) {
    return <p className="text-sm text-destructive">{t('catalogNotFound')}</p>
  }

  const p = detail.data

  const deltas = summaryQuery.data?.deltas
  const heroMeta = t('productHeroMeta')
    .replace('{c}', String(listingChannelBadges.length))
    .replace('{l}', String(listingRows.length))

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-10">
      <nav
        className="flex min-w-0 items-center gap-1.5 text-[13px] text-text-tertiary"
        aria-label="Breadcrumb"
      >
        <Link
          to="/dashboard/products"
          className="shrink-0 transition-colors duration-200 hover:text-text-primary"
        >
          {t('productsPageTitle')}
        </Link>
        <ChevronRight className="size-3.5 shrink-0 opacity-40" aria-hidden />
        <span className="min-w-0 truncate text-text-secondary">{p.title}</span>
      </nav>

      <section className="rounded-2xl border border-border-subtle/25 bg-muted/15 p-6 sm:p-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
          <div
            className={cn(
              'shrink-0 rounded-2xl bg-muted/30 p-2 ring-1 ring-border-subtle/40',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
            )}
          >
            {canEdit ? (
              <>
                <input
                  id="product-image-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => {
                    onProductImageFile(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
                <label
                  htmlFor="product-image-upload"
                  onDragEnter={(e) => {
                    e.preventDefault()
                    setImageDropActive(true)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setImageDropActive(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setImageDropActive(false)
                    onProductImageFile(e.dataTransfer.files?.[0])
                  }}
                  className={cn(
                    'group relative block cursor-pointer rounded-xl transition-[box-shadow,transform] duration-200',
                    imageDropActive ? 'ring-2 ring-primary/45' : 'hover:ring-2 hover:ring-primary/20',
                  )}
                >
                  <ProductThumbnail
                    src={p.image_url}
                    alt={p.title}
                    size="xl"
                    className="h-[100px] w-[100px] rounded-xl ring-0"
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-xl bg-linear-to-t from-black/55 to-transparent pb-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
                      {t('catalogImageUploadCta')}
                    </span>
                  </span>
                </label>
              </>
            ) : (
              <ProductThumbnail
                src={p.image_url}
                alt={p.title}
                size="xl"
                className="h-[100px] w-[100px] rounded-xl ring-0"
              />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-[1.75rem] sm:leading-snug">
                {p.title}
              </h1>
              <p className="mt-1.5 font-mono text-xs text-text-tertiary">{p.internal_sku ?? '—'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {p.brand ? (
                <Badge variant="secondary" className="font-normal">
                  {p.brand}
                </Badge>
              ) : null}
              <StateTag
                label={p.active ? t('productStatusActive') : t('productStatusInactive')}
                tone={p.active ? 'good' : 'bad'}
                className="font-normal"
              />
              {listingChannelBadges.map((ch) => (
                <ChannelBadge
                  key={ch}
                  channel={ch}
                  className="rounded-full font-normal transition-transform duration-200 hover:scale-[1.03] hover:shadow-sm"
                />
              ))}
            </div>
            <p className="text-xs text-text-tertiary">{heroMeta}</p>
            {canEdit && selectedImageFileName ? (
              <p className="text-xs text-text-tertiary">
                {t('catalogImageFileSelected')}:{' '}
                <span className="font-mono text-text-secondary">{selectedImageFileName}</span>
                <span className="mt-0.5 block text-[11px]">{t('catalogImageUploadHint')}</span>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {filtersBar}

      {loadingMain ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : summaryQuery.data ? (
        <section className="grid grid-cols-1 gap-4 rounded-2xl border border-border-subtle/35 bg-card/25 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-5">
          <MetricCard
            label={t('kpiGross')}
            value={formatCurrencyValue(summaryQuery.data.current.gross_revenue)}
            currency={displayCurrency}
            footer={deltaFooter(deltas, 'gross_revenue')}
          />
          <MetricCard
            variant="accent"
            className="ring-1 ring-accent/20 shadow-[0_0_32px_-12px_rgba(91,140,255,0.45)] transition-shadow duration-300 hover:shadow-[0_0_40px_-8px_rgba(91,140,255,0.55)]"
            label={t('kpiNet')}
            value={formatCurrencyValue(summaryQuery.data.current.net_revenue)}
            currency={displayCurrency}
            footer={deltaFooter(deltas, 'net_revenue')}
          />
          <MetricCard
            label={t('kpiGrossProfit')}
            value={formatCurrencyValue(summaryQuery.data.current.gross_profit)}
            currency={displayCurrency}
            footer={deltaFooter(deltas, 'gross_profit')}
          />
          <MetricCard
            label={t('kpiMargin')}
            value={fmtPct(summaryQuery.data.current.margin_pct)}
            footer={deltaFooter(deltas, 'margin_pct')}
          />
          <MetricCard
            label={t('kpiReceived')}
            value={formatCurrencyValue(summaryQuery.data.current.disbursement)}
            currency={displayCurrency}
            footer={deltaFooter(deltas, 'disbursement')}
          />
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-10 lg:items-start lg:gap-10">
        <div className="space-y-8 lg:col-span-7">
          <Card
            variant="solid"
            className="border-border-subtle/50 bg-muted/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{t('catalogProductTrend')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {dailyQuery.isLoading ? (
                <Skeleton className="h-[220px] w-full rounded-xl" />
              ) : trendData.length === 0 ? (
                <EmptyState
                  className="py-10"
                  icon={<Activity className="size-6 text-text-tertiary" />}
                  title={t('catalogTrendEmptyTitle')}
                  description={t('catalogTrendEmptyDesc')}
                />
              ) : (
                <div className="h-[220px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={56} />
                      <Tooltip contentStyle={tooltipContentStyle} />
                      <Line type="monotone" dataKey="net" name={t('kpiNet')} stroke="#5b8cff" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="solid" className="border-border-subtle/40 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{t('catalogDetailListings')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {listingRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-secondary">{t('productsNoData')}</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border-subtle/40 bg-muted/5">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow className="border-border-subtle/50 hover:bg-transparent">
                        <TableHead className="h-11 w-36 min-w-0 pl-4 text-[11px] font-medium uppercase tracking-wide text-text-tertiary whitespace-normal">
                          {t('unmappedColPlatform')}
                        </TableHead>
                        <TableHead className="h-11 w-[32%] min-w-0 text-left font-mono text-[11px] font-medium uppercase tracking-wide text-text-tertiary whitespace-normal">
                          {t('productsTableSku')}
                        </TableHead>
                        <TableHead className="h-11 min-w-0 text-left text-[11px] font-medium uppercase tracking-wide text-text-tertiary whitespace-normal">
                          {t('unmappedColTitle')}
                        </TableHead>
                        <TableHead className="h-11 w-24 min-w-0 text-right text-[11px] font-medium uppercase tracking-wide text-text-tertiary whitespace-normal">
                          {t('productsChannelSelloutPrice')}
                        </TableHead>
                        <TableHead className="h-11 w-28 min-w-0 text-right text-[11px] font-medium uppercase tracking-wide text-text-tertiary whitespace-normal">
                          {t('productsChannelCost')}
                        </TableHead>
                        <TableHead className="h-11 w-28 min-w-0 text-right text-[11px] font-medium uppercase tracking-wide text-text-tertiary whitespace-normal">
                          {t('productsChannelFees')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listingRows.map((row) => {
                        return (
                          <TableRow
                            key={row.id}
                            className="border-border-subtle/40 transition-colors duration-150 hover:bg-muted/20"
                          >
                            <TableCell className="max-w-0 py-3 pl-4 align-top">
                              <StateTag
                                label={row.channelLabel}
                                tone={
                                  row.platform === 'shopify'
                                    ? 'shopify'
                                    : row.platform === 'amazon'
                                      ? 'amazon'
                                      : row.platform === 'mercadolibre'
                                        ? 'mercadolibre'
                                        : 'neutral'
                                }
                                className="font-normal"
                              />
                            </TableCell>
                            <TableCell className="max-w-0 py-3 align-top font-mono text-xs leading-snug text-text-secondary wrap-anywhere whitespace-normal">
                              {row.platform_sku}
                            </TableCell>
                            <TableCell className="max-w-0 py-3 align-top text-sm leading-snug text-text-primary wrap-anywhere whitespace-normal">
                              {row.platform_title ?? '—'}
                            </TableCell>
                            <TableCell className="w-24 py-3 text-right align-top tabular-nums text-sm text-text-primary">
                              {row.sellout_price != null ? formatCurrency(String(row.sellout_price)) : '—'}
                            </TableCell>
                            <TableCell className="w-28 py-3 text-right align-top tabular-nums text-sm text-text-primary">
                              {row.periodCogs != null ? formatCurrency(row.periodCogs) : '—'}
                            </TableCell>
                            <TableCell className="w-28 py-3 pr-4 text-right align-top tabular-nums text-sm text-text-primary">
                              {row.periodFees != null ? formatCurrency(row.periodFees) : '—'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card
          variant="solid"
          className="border-border-subtle/35 bg-muted/10 lg:col-span-3 lg:min-h-[320px]"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{t('catalogDetailKpis')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            {insightsQuery.isLoading ? (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-28 w-full rounded-lg" />
              </div>
            ) : insightsQuery.isError ? (
              <p className="py-4 text-sm text-destructive">{String(insightsQuery.error)}</p>
            ) : !insightRow ? (
              <EmptyState
                className="py-10"
                icon={<BarChart3 className="size-6 text-text-tertiary" />}
                title={t('catalogPerfEmptyTitle')}
                description={t('catalogPerfEmptyDesc')}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                      {t('productsRevenue')}
                    </p>
                    <p className="text-xl font-semibold tabular-nums tracking-tight text-text-primary">
                      {formatCurrency(insightRow.total_revenue)} {displayCurrency}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                      {t('productsUnits')}
                    </p>
                    <p className="text-xl font-semibold tabular-nums tracking-tight text-text-primary">
                      {insightRow.total_units.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                      {t('productsCogs')}
                    </p>
                    <p className="text-xl font-semibold tabular-nums tracking-tight text-text-primary">
                      {formatCurrency(insightRow.cogs_total)} {displayCurrency}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                      {t('productsMargin')}
                    </p>
                    <p className="text-xl font-semibold tabular-nums tracking-tight text-text-primary">
                      {insightRow.margin_pct != null ? `${Number(insightRow.margin_pct).toFixed(1)}%` : '—'}
                    </p>
                  </div>
                </div>
                <div className="border-t border-border-subtle/30 pt-4">
                  <DataTable
                    columns={channelColumns}
                    rows={channelBreakdownRows}
                    getRowKey={(row) => row.plat}
                    emptyContent={t('productsNoData')}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
