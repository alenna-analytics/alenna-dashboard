import { describe, expect, it } from 'vitest'

import type { ProductDetailApi, ProductListingApi, ProductSettlementApi } from '@/lib/types/catalog'

import {
  filteredProductDetailPeriod,
  PRODUCT_DETAIL_ALL_CHANNELS,
} from './product-detail-analytics-filter'

function settlement(partial: Partial<ProductSettlementApi> = {}): ProductSettlementApi {
  return {
    gross_revenue: partial.gross_revenue ?? 0,
    discounts: partial.discounts ?? 0,
    returns: partial.returns ?? 0,
    net_revenue: partial.net_revenue ?? 0,
    marketplace_fees: partial.marketplace_fees ?? 0,
    shipping_charges: partial.shipping_charges ?? 0,
    tax_withholdings: partial.tax_withholdings ?? 0,
    estimated_payout: partial.estimated_payout ?? 0,
    completeness: partial.completeness ?? 'partial',
  }
}

function listing(id: string, platform: string, orders: number, units: number): ProductListingApi {
  return {
    id,
    platform,
    platform_sku: 'SKU',
    platform_variant_id: null,
    platform_title: null,
    platform_price: null,
    platform_fee_pct: null,
    currency: null,
    active: true,
    has_orders: true,
    period_sales: 100,
    period_orders: orders,
    period_units_sold: units,
    velocity_units_per_day_90d: null,
    inventory_days: null,
    stock_quantity: null,
    stock_observed_at: null,
    platform_synced_at: null,
    prev_month_units_sold: 0,
    stock_alert: 'none',
    period_settlement: settlement(),
  }
}

function detail(partial: Partial<ProductDetailApi>): ProductDetailApi {
  return {
    id: 'p1',
    internal_sku: null,
    period_gross_units_sold: 10,
    period_net_units_sold: 10,
    period_units_sold: 10,
    period_cogs: 100,
    period_gross_sales: 1000,
    period_net_sales: 900,
    period_sales: 900,
    period_gross_profit: 900,
    period_orders: 8,
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    gross_profit: 800,
    gross_margin_pct: 88.9,
    velocity_units_per_day_90d: null,
    consolidated_stock_quantity: null,
    inventory_days: 0,
    velocity_window_days: 90,
    period_by_platform: [
      {
        platform: 'mercadolibre',
        gross_sales: 600,
        net_sales: 540,
        gross_units_sold: 6,
        net_units_sold: 6,
        sales: 540,
        units_sold: 6,
      },
      {
        platform: 'shopify',
        gross_sales: 400,
        net_sales: 360,
        gross_units_sold: 4,
        net_units_sold: 4,
        sales: 360,
        units_sold: 4,
      },
    ],
    period_settlement: settlement(),
    period_settlement_by_platform: [],
    weekly_net_sales: [],
    title: 'Product',
    brand: null,
    cost: null,
    currency: null,
    image_url: null,
    active: true,
    status: 'active',
    cost_missing: true,
    base_currency: 'MXN',
    has_listing_currency_mismatch: false,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    listings: [
      listing('l1', 'mercadolibre', 3, 3),
      listing('l2', 'mercadolibre', 2, 3),
      listing('l3', 'shopify', 3, 4),
    ],
    variants: [],
    variant_count: 0,
    variant_label: null,
    parent_product_id: null,
    parent_title: null,
    stock_alert_summary: [],
    cost_history: [],
    listing_price_history: [],
    ...partial,
  }
}

describe('filteredProductDetailPeriod', () => {
  it('returns product totals for all channels', () => {
    const filtered = filteredProductDetailPeriod(detail({}), PRODUCT_DETAIL_ALL_CHANNELS)
    expect(filtered.period_gross_sales).toBe(1000)
    expect(filtered.period_orders).toBe(8)
  })

  it('aggregates mercadolibre listings into one platform view', () => {
    const filtered = filteredProductDetailPeriod(detail({}), 'mercadolibre')
    expect(filtered.period_gross_sales).toBe(600)
    expect(filtered.period_net_sales).toBe(540)
    expect(filtered.period_units_sold).toBe(6)
    expect(filtered.period_orders).toBe(5)
  })
})
