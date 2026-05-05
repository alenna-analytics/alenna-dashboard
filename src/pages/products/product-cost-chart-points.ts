import type { ProductCostHistorySegmentApi } from '@/lib/types/catalog'

export type ProductCostChartPoint = {
  dateKey: string
  cost: number
  currency: string
}

export function buildProductCostChartPoints(
  segments: readonly ProductCostHistorySegmentApi[],
  options: { todayYmd: string; tailCost: number | null; tailCurrency: string },
): ProductCostChartPoint[] {
  const sorted = [...segments].sort((a, b) => a.effective_from.localeCompare(b.effective_from))
  const pts: ProductCostChartPoint[] = sorted.map((s) => ({
    dateKey: s.effective_from,
    cost: s.cost,
    currency: s.currency,
  }))
  if (pts.length === 0) return pts
  const lastSeg = sorted[sorted.length - 1]
  const tailCost =
    options.tailCost != null && Number.isFinite(options.tailCost)
      ? options.tailCost
      : lastSeg.cost
  const tailCurrency = options.tailCurrency || lastSeg.currency
  const lastKey = pts[pts.length - 1].dateKey
  if (lastKey < options.todayYmd) {
    pts.push({ dateKey: options.todayYmd, cost: tailCost, currency: tailCurrency })
  }
  return pts
}
