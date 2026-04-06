import { describe, expect, it } from 'vitest'

import {
  buildCostUpdatePayload,
  initialCostDraft,
  maxHeatmapValue,
  toHeatmapRows,
  toMarginChartRows,
  toTopProductChartRows,
} from '@/lib/products-page-utils'

describe('products-page-utils', () => {
  const insight = {
    product_id: 'p1',
    title: 'Product One',
    internal_sku: 'SKU-1',
    revenue_by_platform: {
      shopify: '100',
      amazon: '50',
      mercadolibre: '25',
    },
    units_by_platform: {
      shopify: 2,
      amazon: 1,
      mercadolibre: 1,
    },
    total_revenue: '175',
    total_units: 4,
    cogs_total: '80',
    margin_pct: '54.3',
    unit_cost: '20',
    cogs_by_platform: { shopify: '40', amazon: '30', mercadolibre: '10' },
    fees_by_platform: { shopify: '0', amazon: '0', mercadolibre: '0' },
    lowest_unit_cost: '10',
  }

  it('builds top-product chart rows from API insights', () => {
    const rows = toTopProductChartRows([insight])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      shopify: 100,
      amazon: 50,
      mercadolibre: 25,
    })
  })

  it('builds margin chart rows from API insights', () => {
    const rows = toMarginChartRows([insight])
    expect(rows[0].margin_pct).toBeCloseTo(54.3)
  })

  it('builds heatmap rows and computes max value', () => {
    const rows = toHeatmapRows([insight], ['shopify', 'amazon', 'mercadolibre'])
    expect(rows[0].values.shopify).toBe(100)
    expect(maxHeatmapValue(rows, ['shopify', 'amazon', 'mercadolibre'])).toBe(100)
  })

  it('builds cost editor draft and patch payload', () => {
    const draft = initialCostDraft([
      {
        product_id: 'p1',
        title: 'Product One',
        original_cost: '20',
        current_cost: '22.5',
        total_units: 4,
        cogs_original: '80',
        cogs_current: '90',
        delta_cogs: '10',
      },
    ])
    expect(draft.p1).toBe(22.5)
    expect(buildCostUpdatePayload(draft)).toEqual({
      items: [{ product_id: 'p1', cost: 22.5 }],
    })
  })
})
