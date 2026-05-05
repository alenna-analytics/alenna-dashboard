import type { ProductCostHistorySegmentApi, ProductListingPriceSegmentApi } from '@/lib/types/catalog'

export type ProductCostPriceChartPoint = {
  dateKey: string
  values: Record<string, number>
}

export type ProductCostPriceChartSeries = {
  key: string
  label: string
  currency: string
  color: string
  kind: 'cost' | 'channel'
}

export type ProductCostPriceChartData = {
  points: ProductCostPriceChartPoint[]
  series: ProductCostPriceChartSeries[]
}

function addDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d + deltaDays)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function expandSeriesPoints(
  segments: ReadonlyArray<{ effective_from: string; effective_to: string | null; value: number }>,
  todayYmd: string,
  options?: { zeroFillGaps: boolean },
): Map<string, number> {
  const zeroFillGaps = options?.zeroFillGaps ?? true
  const sorted = [...segments].sort((a, b) => a.effective_from.localeCompare(b.effective_from))
  const out = new Map<string, number>()
  if (sorted.length === 0) {
    out.set(todayYmd, 0)
    return out
  }

  for (let i = 0; i < sorted.length; i++) {
    const seg = sorted[i]
    const next = sorted[i + 1]
    out.set(seg.effective_from, seg.value)
    if (!seg.effective_to) continue

    const gapStart = addDaysYmd(seg.effective_to, 1)
    if (next) {
      if (zeroFillGaps && gapStart < next.effective_from) out.set(gapStart, 0)
    } else if (gapStart <= todayYmd) {
      if (zeroFillGaps) {
        out.set(gapStart, 0)
        out.set(todayYmd, 0)
      }
    }
  }

  const last = sorted[sorted.length - 1]
  if (!last.effective_to && last.effective_from < todayYmd) {
    out.set(todayYmd, last.value)
  }
  return out
}

function platformLabel(slug: string): string {
  return slug
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

const PRICE_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2']

export function buildProductCostPriceChartData(
  costSegments: readonly ProductCostHistorySegmentApi[],
  listingPriceSegments: readonly ProductListingPriceSegmentApi[],
  options: { todayYmd: string; baseCurrency: string },
): ProductCostPriceChartData {
  const { todayYmd, baseCurrency } = options
  const seriesPoints = new Map<string, Map<string, number>>()
  const seriesMeta: ProductCostPriceChartSeries[] = []

  seriesMeta.push({
    key: 'cost',
    label: 'Costo',
    currency: baseCurrency,
    color: '#111111',
    kind: 'cost',
  })
  seriesPoints.set(
    'cost',
    expandSeriesPoints(
      costSegments.map((s) => ({
        effective_from: s.effective_from,
        effective_to: s.effective_to,
        value: s.cost,
      })),
      todayYmd,
      { zeroFillGaps: true },
    ),
  )

  const grouped = new Map<string, ProductListingPriceSegmentApi[]>()
  for (const seg of listingPriceSegments) {
    const key = `${seg.listing_id}:${seg.currency}`
    const arr = grouped.get(key)
    if (arr) arr.push(seg)
    else grouped.set(key, [seg])
  }
  let colorIdx = 0
  for (const [groupKey, rows] of grouped.entries()) {
    const first = rows[0]
    const key = `price:${groupKey}`
    seriesMeta.push({
      key,
      label: platformLabel(first.platform),
      currency: first.currency,
      color: PRICE_COLORS[colorIdx % PRICE_COLORS.length],
      kind: 'channel',
    })
    colorIdx += 1
    seriesPoints.set(
      key,
      expandSeriesPoints(
        rows.map((s) => ({
          effective_from: s.effective_from,
          effective_to: s.effective_to,
          value: s.price,
        })),
        todayYmd,
        { zeroFillGaps: false },
      ),
    )
  }

  const dateKeys = new Set<string>([todayYmd])
  for (const points of seriesPoints.values()) {
    for (const d of points.keys()) dateKeys.add(d)
  }
  const sortedDates = [...dateKeys].sort((a, b) => a.localeCompare(b))
  const points: ProductCostPriceChartPoint[] = sortedDates.map((d) => ({
    dateKey: d,
    values: Object.fromEntries(seriesMeta.map((s) => [s.key, seriesPoints.get(s.key)?.get(d) ?? 0])),
  }))
  return { points, series: seriesMeta }
}
