import type { ProductCostHistorySegmentApi } from '@/lib/types/catalog'

export type ProductCostChartPoint = {
  dateKey: string
  cost: number
  currency: string
}

function addDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d + deltaDays)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function mergeSameDayPoints(pts: ProductCostChartPoint[]): ProductCostChartPoint[] {
  pts.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  const out: ProductCostChartPoint[] = []
  for (const p of pts) {
    if (out.length > 0 && out[out.length - 1].dateKey === p.dateKey) {
      out[out.length - 1] = p
    } else {
      out.push(p)
    }
  }
  return out
}

export function buildProductCostChartPoints(
  segments: readonly ProductCostHistorySegmentApi[],
  options: { todayYmd: string; baseCurrency: string },
): ProductCostChartPoint[] {
  const sorted = [...segments].sort((a, b) => a.effective_from.localeCompare(b.effective_from))
  if (sorted.length === 0) return []

  const { todayYmd, baseCurrency } = options
  const pts: ProductCostChartPoint[] = []

  for (let i = 0; i < sorted.length; i++) {
    const seg = sorted[i]
    const next = sorted[i + 1]
    pts.push({ dateKey: seg.effective_from, cost: seg.cost, currency: seg.currency })

    const effTo = seg.effective_to
    if (effTo == null || effTo === '') continue

    const gapStart = addDaysYmd(effTo, 1)
    if (next) {
      if (gapStart < next.effective_from) {
        pts.push({ dateKey: gapStart, cost: 0, currency: baseCurrency })
      }
    } else if (gapStart <= todayYmd) {
      pts.push({ dateKey: gapStart, cost: 0, currency: baseCurrency })
      if (todayYmd > gapStart) {
        pts.push({ dateKey: todayYmd, cost: 0, currency: baseCurrency })
      }
    }
  }

  const last = sorted[sorted.length - 1]
  const lastOpen = last.effective_to == null || last.effective_to === ''
  if (lastOpen && last.effective_from < todayYmd) {
    pts.push({ dateKey: todayYmd, cost: last.cost, currency: last.currency })
  }

  return mergeSameDayPoints(pts)
}
