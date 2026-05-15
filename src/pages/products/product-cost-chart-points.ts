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

type ChartSegment = { effective_from: string; effective_to: string | null; value: number }

function addDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d + deltaDays)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/** Inclusive YYYY-MM-DD range (assumes start <= end). */
function ymdRangeInclusive(start: string, end: string): string[] {
  if (start > end) return [start]
  const out: string[] = []
  let cur = start
  while (cur <= end) {
    out.push(cur)
    cur = addDaysYmd(cur, 1)
  }
  return out
}

/** Value on each calendar day from collapsed [from, to] segments (0 outside segments). */
export function fillSeriesForDates(
  segments: ReadonlyArray<ChartSegment>,
  sortedDates: readonly string[],
): Map<string, number> {
  const sortedSegs = [...segments].sort((a, b) => a.effective_from.localeCompare(b.effective_from))
  const out = new Map<string, number>()
  if (sortedSegs.length === 0) {
    for (const d of sortedDates) out.set(d, 0)
    return out
  }
  let j = 0
  for (const d of sortedDates) {
    while (j < sortedSegs.length && sortedSegs[j].effective_from <= d) {
      j += 1
    }
    const k = j - 1
    let value = 0
    if (k >= 0) {
      const seg = sortedSegs[k]
      const to = seg.effective_to
      if (to == null || to === '' || d <= to) {
        value = seg.value
      }
    }
    out.set(d, value)
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
  const boundaryDates = new Set<string>([todayYmd])
  for (const s of costSegments) {
    boundaryDates.add(s.effective_from)
    if (s.effective_to) boundaryDates.add(s.effective_to)
  }
  for (const s of listingPriceSegments) {
    boundaryDates.add(s.effective_from)
    if (s.effective_to) boundaryDates.add(s.effective_to)
  }
  const sortedBoundary = [...boundaryDates].sort((a, b) => a.localeCompare(b))
  const minD = sortedBoundary[0] ?? todayYmd
  const maxD = sortedBoundary[sortedBoundary.length - 1] ?? todayYmd
  const endD = maxD >= todayYmd ? maxD : todayYmd
  const sortedDates = ymdRangeInclusive(minD, endD)

  const seriesPoints = new Map<string, Map<string, number>>()
  const seriesMeta: ProductCostPriceChartSeries[] = []

  const costSegs: ChartSegment[] = costSegments.map((s) => ({
    effective_from: s.effective_from,
    effective_to: s.effective_to,
    value: s.cost,
  }))
  seriesMeta.push({
    key: 'cost',
    label: 'Costo',
    currency: baseCurrency,
    color: '#111111',
    kind: 'cost',
  })
  seriesPoints.set('cost', fillSeriesForDates(costSegs, sortedDates))

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
    const priceSegs: ChartSegment[] = rows.map((s) => ({
      effective_from: s.effective_from,
      effective_to: s.effective_to,
      value: s.price,
    }))
    seriesPoints.set(key, fillSeriesForDates(priceSegs, sortedDates))
  }

  const points: ProductCostPriceChartPoint[] = sortedDates.map((d) => ({
    dateKey: d,
    values: Object.fromEntries(seriesMeta.map((s) => [s.key, seriesPoints.get(s.key)?.get(d) ?? 0])),
  }))
  return { points, series: seriesMeta }
}
