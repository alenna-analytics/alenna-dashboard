import type {
  ProductCostEditorRow,
  ProductInsight,
  ProductsInsightsResponse,
} from '@/lib/analytics-types'

export type TopProductChartRow = {
  name: string
  shopify: number
  amazon: number
  mercadolibre: number
}

export type MarginChartRow = {
  name: string
  margin_pct: number
}

export type HeatmapRow = {
  product_id: string
  title: string
  values: Record<string, number>
}

export type CostEditorDraft = Record<string, number>

export function productName(title: string, internalSku: string | null): string {
  return internalSku ? `${title} (${internalSku})` : title
}

export function toTopProductChartRows(items: ProductInsight[]): TopProductChartRow[] {
  return items.map((item) => ({
    name: productName(item.title, item.internal_sku),
    shopify: Number(item.revenue_by_platform.shopify ?? 0),
    amazon: Number(item.revenue_by_platform.amazon ?? 0),
    mercadolibre: Number(item.revenue_by_platform.mercadolibre ?? 0),
  }))
}

export function toMarginChartRows(items: ProductInsight[]): MarginChartRow[] {
  return items.map((item) => ({
    name: productName(item.title, item.internal_sku),
    margin_pct: Number(item.margin_pct ?? 0),
  }))
}

export function toHeatmapRows(
  items: ProductInsight[],
  channels: readonly string[],
): HeatmapRow[] {
  return items.map((item) => {
    const values: Record<string, number> = {}
    for (const channel of channels) {
      values[channel] = Number(item.revenue_by_platform[channel] ?? 0)
    }
    return {
      product_id: item.product_id,
      title: productName(item.title, item.internal_sku),
      values,
    }
  })
}

export function maxHeatmapValue(rows: HeatmapRow[], channels: readonly string[]): number {
  let max = 0
  for (const row of rows) {
    for (const channel of channels) {
      max = Math.max(max, Number(row.values[channel] ?? 0))
    }
  }
  return max
}

export function initialCostDraft(rows: ProductCostEditorRow[]): CostEditorDraft {
  const out: CostEditorDraft = {}
  for (const row of rows) {
    out[row.product_id] = Number(row.current_cost)
  }
  return out
}

export function buildCostUpdatePayload(draft: CostEditorDraft): {
  items: { product_id: string; cost: number }[]
} {
  return {
    items: Object.entries(draft).map(([product_id, cost]) => ({
      product_id,
      cost,
    })),
  }
}

export function insightsHasData(data: ProductsInsightsResponse | undefined): boolean {
  return Boolean(data && (data.top_products.length || data.sku_rows.length))
}
