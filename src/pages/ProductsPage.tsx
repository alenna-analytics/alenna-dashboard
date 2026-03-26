import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { XIcon } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { DataTableColumn } from '@/components/composed/data-table'
import { DashboardFiltersBar } from '@/components/composed/dashboard-filters-bar'
import { PaginatedDataTable } from '@/components/composed/paginated-data-table'
import { useCurrency } from '@/components/providers/currency-provider'
import { useLanguage } from '@/components/providers/language-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useProductsCostEditor,
  useProductsInsights,
  useProductsSkuTable,
  useUpdateProductCosts,
} from '@/hooks/use-analytics'
import type { ProductCostEditorRow, ProductInsight } from '@/lib/analytics-types'
import {
  DASHBOARD_PLATFORMS,
  COLORS_BY_CHANNEL,
  PLATFORM_LABELS,
  dashboardT,
  type DashboardStringKey,
} from '@/lib/dashboard-strings'
import {
  buildYearShortcutOptions,
  fullCalendarMonthValue,
  isFullCalendarYearRange,
} from '@/lib/dashboard-date-shortcuts'
import { toLocalIsoDate } from '@/lib/format'
import {
  buildCostUpdatePayload,
  initialCostDraft,
  maxHeatmapValue,
  toHeatmapRows,
  toMarginChartRows,
  toTopProductChartRows,
  type CostEditorDraft,
} from '@/lib/products-page-utils'
import { chartPlotSurfaceClassName } from '@/components/charts/chart-theme'
import { cn } from '@/lib/utils'

export function ProductsPage() {
  const { lang } = useLanguage()
  const { formatCurrency } = useCurrency()
  const [params, setParams] = useSearchParams()

  const startDate = useMemo(() => parseDate(params.get('start'), defaultStart()), [params])
  const endDate = useMemo(() => parseDate(params.get('end'), new Date()), [params])
  const selectedPlatforms = useMemo(() => {
    const p = params.getAll('platform')
    if (!p.length) return undefined
    return p.filter(
      (x): x is 'shopify' | 'amazon' | 'mercadolibre' =>
        x === 'shopify' || x === 'amazon' || x === 'mercadolibre',
    )
  }, [params])
  const granularity = params.get('granularity') ?? 'monthly'
  const platforms = selectedPlatforms ?? DASHBOARD_PLATFORMS

  const t = useMemo(() => {
    return (key: DashboardStringKey) => dashboardT(lang, key)
  }, [lang])

  const filters = useMemo(
    () => ({
      start_date: toIso(startDate),
      end_date: toIso(endDate),
      platform: selectedPlatforms,
      granularity,
      limit: 15,
    }),
    [startDate, endDate, selectedPlatforms, granularity],
  )
  const insightsQuery = useProductsInsights(filters)
  const [skuSearch, setSkuSearch] = useState('')
  const [skuPage, setSkuPage] = useState(1)
  const [costSearch, setCostSearch] = useState('')
  const [costPage, setCostPage] = useState(1)
  const pageSize = 10
  const [heatmapSort, setHeatmapSort] = useState<{
    key: 'product' | string
    direction: 'asc' | 'desc'
  }>({
    key: 'product',
    direction: 'asc',
  })

  const skuQuery = useProductsSkuTable({
    ...filters,
    search: skuSearch,
    page: skuPage,
    page_size: pageSize,
  })
  const costQuery = useProductsCostEditor({
    ...filters,
    search: costSearch,
    page: costPage,
    page_size: pageSize,
  })
  const updateCosts = useUpdateProductCosts()
  const insights = insightsQuery.data

  const [costDraft, setCostDraft] = useState<CostEditorDraft>({})

  const shortcutYearValue = useMemo(() => {
    return isFullCalendarYearRange(startDate, endDate) ? String(startDate.getFullYear()) : ''
  }, [startDate, endDate])

  const shortcutMonthValue = useMemo(() => {
    return fullCalendarMonthValue(startDate, endDate) ?? ''
  }, [startDate, endDate])

  const yearShortcutOptions = useMemo(() => buildYearShortcutOptions(), [])
  const referenceYearForMonth = useMemo(() => {
    if (shortcutYearValue) return Number.parseInt(shortcutYearValue, 10)
    return startDate.getFullYear()
  }, [shortcutYearValue, startDate])
  const dashboardLocale = lang === 'es' ? 'es-MX' : 'en-US'

  const topRows = useMemo(
    () => toTopProductChartRows(insights?.top_products ?? []).slice(0, 15),
    [insights],
  )
  const topMarginRows = useMemo(
    () => toMarginChartRows(insights?.top_margin ?? []).reverse(),
    [insights],
  )
  const bottomMarginRows = useMemo(
    () => toMarginChartRows(insights?.bottom_margin ?? []).reverse(),
    [insights],
  )
  const heatmapRows = useMemo(
    () => toHeatmapRows(insights?.heatmap ?? [], insights?.channels ?? platforms),
    [insights, platforms],
  )
  const heatmapMax = useMemo(
    () => maxHeatmapValue(heatmapRows, insights?.channels ?? platforms),
    [heatmapRows, insights, platforms],
  )
  const heatmapChannels = insights?.channels ?? platforms
  const sortedHeatmapRows = useMemo(() => {
    const rows = [...heatmapRows]
    const factor = heatmapSort.direction === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      if (heatmapSort.key === 'product') {
        return a.title.localeCompare(b.title) * factor
      }
      const av = Number(a.values[heatmapSort.key] ?? 0)
      const bv = Number(b.values[heatmapSort.key] ?? 0)
      return (av - bv) * factor
    })
    return rows
  }, [heatmapRows, heatmapSort])

  const skuColumns = useMemo<DataTableColumn<ProductInsight>[]>(
    () => [
      {
        key: 'title',
        header: t('productsTableProduct'),
        cell: (row) => row.title,
      },
      {
        key: 'internal_sku',
        header: t('productsTableSku'),
        mono: true,
        cell: (row) => row.internal_sku ?? '—',
      },
      {
        key: 'total_revenue',
        header: t('productsRevenue'),
        align: 'right',
        cell: (row) => formatCurrency(row.total_revenue),
      },
      {
        key: 'total_units',
        header: t('productsUnits'),
        align: 'right',
        cell: (row) => row.total_units.toLocaleString(),
      },
      {
        key: 'cogs_total',
        header: t('productsCogs'),
        align: 'right',
        cell: (row) => formatCurrency(row.cogs_total),
      },
      {
        key: 'margin_pct',
        header: t('productsMargin'),
        align: 'right',
        cell: (row) => `${Number(row.margin_pct ?? 0).toFixed(1)}%`,
      },
    ],
    [formatCurrency, t],
  )

  const costColumns = useMemo<DataTableColumn<ProductCostEditorRow>[]>(
    () => [
      {
        key: 'title',
        header: t('productsTableProduct'),
        cell: (row) => row.title,
      },
      {
        key: 'original_cost',
        header: t('productsTableCostOriginal'),
        align: 'right',
        cell: (row) => formatCurrency(row.original_cost),
      },
      {
        key: 'current_cost',
        header: t('productsTableCostCurrent'),
        align: 'right',
        cell: (row) => (
          <Input
            type="number"
            min={0.01}
            step="0.01"
            value={costDraft[row.product_id] ?? Number(row.current_cost)}
            onChange={(event) => {
              const next = Number(event.target.value)
              setCostDraft((prev) => ({ ...prev, [row.product_id]: Number.isFinite(next) ? next : 0 }))
            }}
            className="h-8 w-24 text-right"
          />
        ),
      },
      {
        key: 'total_units',
        header: t('productsUnits'),
        align: 'right',
        cell: (row) => row.total_units.toLocaleString(),
      },
      {
        key: 'delta_cogs',
        header: t('productsTableDeltaCogs'),
        align: 'right',
        cell: (row) => {
          const current = costDraft[row.product_id] ?? Number(row.current_cost)
          const original = Number(row.original_cost)
          const delta = (current - original) * row.total_units
          return (
            <span className={cn(delta >= 0 ? 'text-danger' : 'text-success')}>
              {delta >= 0 ? '+' : ''}
              {formatCurrency(delta)}
            </span>
          )
        },
      },
    ],
    [costDraft, formatCurrency, t],
  )

  const staticCardClassName = 'hover:translate-y-0'
  const hasQueryError = Boolean(insightsQuery.error)

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          {t('productsPageTitle')}
        </h1>
        <p className="text-sm text-text-secondary">
          Performance por SKU · COGS · Margen
        </p>
      </div>
      <DashboardFiltersBar
        t={t}
        locale={dashboardLocale}
        sticky
        startDate={startDate}
        endDate={endDate}
        onStartChange={(d) => {
          setSkuPage(1)
          setCostPage(1)
          setDateParam(setParams, params, 'start', d)
        }}
        onEndChange={(d) => {
          setSkuPage(1)
          setCostPage(1)
          setDateParam(setParams, params, 'end', d)
        }}
        shortcutYearValue={shortcutYearValue}
        yearShortcutOptions={yearShortcutOptions}
        onYearShortcut={(yearStr) => {
          const y = Number.parseInt(yearStr, 10)
          if (Number.isNaN(y)) return
          const next = new URLSearchParams(params)
          next.set('start', toLocalIsoDate(new Date(y, 0, 1)))
          next.set('end', toLocalIsoDate(new Date(y, 11, 31)))
          setSkuPage(1)
          setCostPage(1)
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
          setSkuPage(1)
          setCostPage(1)
          setParams(next)
        }}
        platforms={DASHBOARD_PLATFORMS}
        platformLabels={PLATFORM_LABELS}
        selectedPlatforms={selectedPlatforms}
        onTogglePlatform={(platform) => {
          setSkuPage(1)
          setCostPage(1)
          togglePlatform(setParams, params, platform)
        }}
        onSelectAllPlatforms={() => {
          setSkuPage(1)
          setCostPage(1)
          clearPlatforms(setParams, params)
        }}
        granularity={granularity}
        onGranularityChange={(value) => {
          const next = new URLSearchParams(params)
          next.set('granularity', value)
          setSkuPage(1)
          setCostPage(1)
          setParams(next)
        }}
      />

      {insightsQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[360px] w-full rounded-xl" />
          <Skeleton className="h-[220px] w-full rounded-xl" />
          <Skeleton className="h-[520px] w-full rounded-xl" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      ) : hasQueryError ? (
        <Card variant="solid" className={staticCardClassName}>
          <CardContent className="space-y-4 py-8">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-text-primary">
                {t('productsEmptyErrorTitle')}
              </h2>
              <p className="text-sm text-text-secondary">
                {t('productsEmptyErrorDescription')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground"
                onClick={() => {
                  void insightsQuery.refetch()
                }}
              >
                {t('productsEmptyRetry')}
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card variant="solid" className={staticCardClassName}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-primary">
                {t('productsTopTitle')}
              </CardTitle>
              <p className="text-[11px] text-text-tertiary">{t('productsTopSubtitle')}</p>
            </CardHeader>
            <CardContent className="pb-4 pt-0">
              <div className={cn('h-[500px]', chartPlotSurfaceClassName)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRows} layout="vertical" margin={{ top: 8, right: 10, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 8" stroke="var(--chart-grid)" strokeOpacity={0.45} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatCurrency(v)}
                      tick={{ fontSize: 11 }}
                      minTickGap={24}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={210}
                      tick={{ fontSize: 11 }}
                      interval={0}
                      tickFormatter={(value) => compactLabel(String(value), 30)}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
                      }}
                      formatter={(value) => formatCurrency(Number(value))}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar
                      dataKey="shopify"
                      name={PLATFORM_LABELS.shopify}
                      stackId="sales"
                      fill={COLORS_BY_CHANNEL.shopify}
                      radius={[0, 3, 3, 0]}
                      fillOpacity={0.9}
                      activeBar={{ fillOpacity: 1, stroke: '#9db7ff', strokeWidth: 1.25 }}
                    />
                    <Bar
                      dataKey="amazon"
                      name={PLATFORM_LABELS.amazon}
                      stackId="sales"
                      fill={COLORS_BY_CHANNEL.amazon}
                      radius={[0, 3, 3, 0]}
                      fillOpacity={0.9}
                      activeBar={{ fillOpacity: 1, stroke: '#c2b6ff', strokeWidth: 1.25 }}
                    />
                    <Bar
                      dataKey="mercadolibre"
                      name={PLATFORM_LABELS.mercadolibre}
                      stackId="sales"
                      fill={COLORS_BY_CHANNEL.mercadolibre}
                      radius={[0, 3, 3, 0]}
                      fillOpacity={0.9}
                      activeBar={{ fillOpacity: 1, stroke: '#9dd8bc', strokeWidth: 1.25 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card variant="solid" className={staticCardClassName}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-text-primary">
                  {t('productsTopMarginTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ProductsMarginBarChart rows={topMarginRows} color="#66bb6a" />
              </CardContent>
            </Card>
            <Card variant="solid" className={staticCardClassName}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-text-primary">
                  {t('productsBottomMarginTitle')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ProductsMarginBarChart rows={bottomMarginRows} color="#f87171" />
              </CardContent>
            </Card>
          </div>

          <Card variant="solid" className={staticCardClassName}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-primary">
                {t('productsHeatmapTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
                  <span>Baja</span>
                  <div className="h-2 w-28 rounded-full bg-[linear-gradient(90deg,rgba(91,140,255,0.12),rgba(91,140,255,0.78))]" />
                  <span>Alta</span>
                </div>
                <div className="max-h-[420px] overflow-auto rounded-lg border border-border-subtle/60">
                  <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
                    <thead className="sticky top-0 z-10 bg-card">
                      <tr>
                        <th className="sticky left-0 z-20 min-w-[320px] border-b border-border-subtle bg-card px-3 py-2 text-left text-xs text-text-tertiary uppercase">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:text-text-primary"
                            onClick={() => {
                              setHeatmapSort((prev) => ({
                                key: 'product',
                                direction:
                                  prev.key === 'product' && prev.direction === 'asc' ? 'desc' : 'asc',
                              }))
                            }}
                          >
                            {t('productsTableProduct')}
                            {heatmapSort.key === 'product'
                              ? heatmapSort.direction === 'asc'
                                ? ' ↑'
                                : ' ↓'
                              : ''}
                          </button>
                        </th>
                        {heatmapChannels.map((channel) => (
                          <th
                            key={channel}
                            className="border-b border-border-subtle bg-card px-3 py-2 text-center text-xs text-text-tertiary uppercase"
                          >
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 hover:text-text-primary"
                              onClick={() => {
                                setHeatmapSort((prev) => ({
                                  key: channel,
                                  direction:
                                    prev.key === channel && prev.direction === 'desc' ? 'asc' : 'desc',
                                }))
                              }}
                            >
                              {PLATFORM_LABELS[channel as keyof typeof PLATFORM_LABELS] ?? channel}
                              {heatmapSort.key === channel
                                ? heatmapSort.direction === 'asc'
                                  ? ' ↑'
                                  : ' ↓'
                                : ''}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedHeatmapRows.map((row) => (
                        <tr
                          key={row.product_id}
                          className="group border-b border-border-subtle/40 hover:bg-accent/5"
                        >
                          <td className="sticky left-0 z-10 max-w-[320px] truncate border-b border-border-subtle/40 bg-card px-3 py-2 text-text-secondary group-hover:bg-accent/5">
                            {row.title}
                          </td>
                          {heatmapChannels.map((channel) => {
                            const value = row.values[channel] ?? 0
                            const intensity = heatmapMax > 0 ? Math.pow(value / heatmapMax, 0.6) : 0
                            const bgAlpha = 0.08 + intensity * 0.72
                            return (
                              <td
                                key={`${row.product_id}-${channel}`}
                                className="border-b border-border-subtle/40 px-2 py-1.5 group-hover:bg-accent/5"
                              >
                                <div
                                  className="rounded-sm px-2 py-2 text-center font-mono text-[11px]"
                                  style={{
                                    backgroundColor: `rgba(91,140,255,${bgAlpha})`,
                                    color: intensity > 0.6 ? '#f8fafc' : 'var(--text-primary)',
                                  }}
                                  title={`${row.title} · ${channel}: ${formatCurrency(value)}`}
                                >
                                  {formatCurrency(value)}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="solid" className={staticCardClassName}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-primary">
                {t('productsSkuTableTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="relative max-w-sm">
                <Input
                  value={skuSearch}
                  onChange={(event) => {
                    setSkuSearch(event.target.value)
                    setSkuPage(1)
                  }}
                  placeholder={t('productsFilterSkuPlaceholder')}
                  className="h-9 pr-9"
                />
                {skuSearch ? (
                  <button
                    type="button"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-text-tertiary hover:text-text-primary"
                    onClick={() => {
                      setSkuSearch('')
                      setSkuPage(1)
                    }}
                    aria-label={t('tableClearSearch')}
                  >
                    <XIcon className="size-3.5" />
                  </button>
                ) : null}
              </div>
              <PaginatedDataTable
                columns={skuColumns}
                rows={skuQuery.data?.items ?? []}
                getRowKey={(row) => row.product_id}
                page={skuPage}
                pageSize={pageSize}
                total={skuQuery.data?.pagination.total ?? 0}
                onPageChange={setSkuPage}
                emptyContent={t('productsNoData')}
                isLoading={skuQuery.isFetching}
                columnSelectorLabel={t('tableColumns')}
                goToPageLabel={t('tableGoTo')}
                pageLabel={t('tablePage')}
                rowsLabel={t('tableRows')}
                prevLabel={t('tablePrev')}
                nextLabel={t('tableNext')}
                goLabel={t('tableGo')}
                toggleColumnsLabel={t('tableToggleColumns')}
                loadingLabel={t('tableLoadingPage')}
                selectAllColumnsLabel={t('tableSelectAllColumns')}
                deselectAllColumnsLabel={t('tableDeselectAllColumns')}
              />
            </CardContent>
          </Card>

          <Card variant="solid" className={staticCardClassName}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-primary">
                {t('productsCostEditorTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground"
                  onClick={() => {
                    const mergedDraft: CostEditorDraft = {}
                    for (const row of costQuery.data?.items ?? []) {
                      mergedDraft[row.product_id] = costDraft[row.product_id] ?? Number(row.current_cost)
                    }
                    void updateCosts.mutateAsync(buildCostUpdatePayload(mergedDraft))
                  }}
                  disabled={updateCosts.isPending}
                >
                  {t('productsSaveCosts')}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border-subtle px-3 py-2 text-xs text-text-secondary"
                  onClick={() => setCostDraft(initialCostDraft(costQuery.data?.items ?? []))}
                >
                  {t('productsResetCosts')}
                </button>
              </div>
              <div className="relative max-w-sm">
                <Input
                  value={costSearch}
                  onChange={(event) => {
                    setCostSearch(event.target.value)
                    setCostPage(1)
                  }}
                  placeholder={t('productsFilterCostPlaceholder')}
                  className="h-9 pr-9"
                />
                {costSearch ? (
                  <button
                    type="button"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-text-tertiary hover:text-text-primary"
                    onClick={() => {
                      setCostSearch('')
                      setCostPage(1)
                    }}
                    aria-label={t('tableClearSearch')}
                  >
                    <XIcon className="size-3.5" />
                  </button>
                ) : null}
              </div>
              <PaginatedDataTable
                columns={costColumns}
                rows={costQuery.data?.items ?? []}
                getRowKey={(row) => row.product_id}
                page={costPage}
                pageSize={pageSize}
                total={costQuery.data?.pagination.total ?? 0}
                onPageChange={setCostPage}
                emptyContent={t('productsNoData')}
                isLoading={costQuery.isFetching}
                columnSelectorLabel={t('tableColumns')}
                goToPageLabel={t('tableGoTo')}
                pageLabel={t('tablePage')}
                rowsLabel={t('tableRows')}
                prevLabel={t('tablePrev')}
                nextLabel={t('tableNext')}
                goLabel={t('tableGo')}
                toggleColumnsLabel={t('tableToggleColumns')}
                loadingLabel={t('tableLoadingPage')}
                selectAllColumnsLabel={t('tableSelectAllColumns')}
                deselectAllColumnsLabel={t('tableDeselectAllColumns')}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function defaultStart(): Date {
  const d = new Date()
  d.setDate(1)
  return d
}

function parseDate(value: string | null, fallback: Date): Date {
  if (!value) return fallback
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function setDateParam(
  setParams: ReturnType<typeof useSearchParams>[1],
  params: URLSearchParams,
  key: 'start' | 'end',
  date: Date,
) {
  const next = new URLSearchParams(params)
  next.set(key, toIso(date))
  setParams(next)
}

function togglePlatform(
  setParams: ReturnType<typeof useSearchParams>[1],
  params: URLSearchParams,
  platform: 'shopify' | 'amazon' | 'mercadolibre',
) {
  const current = params.getAll('platform')
  const next = new URLSearchParams(params)
  next.delete('platform')
  const set = new Set(current)
  if (set.has(platform)) {
    set.delete(platform)
  } else {
    set.add(platform)
  }
  for (const value of set) {
    next.append('platform', value)
  }
  setParams(next)
}

function clearPlatforms(
  setParams: ReturnType<typeof useSearchParams>[1],
  params: URLSearchParams,
) {
  const next = new URLSearchParams(params)
  next.delete('platform')
  setParams(next)
}

function ProductsMarginBarChart({
  rows,
  color,
}: {
  rows: { name: string; margin_pct: number }[]
  color: string
}) {
  return (
    <div className={cn('h-[235px]', chartPlotSurfaceClassName)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 12, left: 16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 8" stroke="var(--chart-grid)" strokeOpacity={0.45} />
          <XAxis type="number" tickFormatter={(v) => `${Number(v).toFixed(1)}%`} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={170}
            tick={{ fontSize: 11 }}
            interval={0}
            tickFormatter={(value) => compactLabel(String(value), 24)}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
            }}
            formatter={(value) => `${Number(value).toFixed(1)}%`}
            cursor={{ fill: 'transparent' }}
          />
          <Bar
            dataKey="margin_pct"
            fill={color}
            radius={[0, 3, 3, 0]}
            fillOpacity={0.92}
            activeBar={{ fillOpacity: 1, stroke: '#f8fafc', strokeWidth: 1.2 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function compactLabel(value: string, max: number): string {
  if (value.length <= max) return value
  return `${value.slice(0, Math.max(0, max - 1))}…`
}
