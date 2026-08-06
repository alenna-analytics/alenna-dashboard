import { describe, expect, it } from 'vitest'

import type { ProductListingApi, ProductSettlementApi } from '@/lib/types/catalog'

import {
  mergeListingSettlementsByPlatform,
  resolveProductPlatformSettlement,
} from './product-detail-settlement-by-platform'

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

function listing(
  id: string,
  platform: string,
  periodSettlement: ProductSettlementApi | null,
): ProductListingApi {
  return {
    id,
    platform,
    platform_sku: 'SKU-1',
    platform_title: null,
    platform_price: null,
    platform_fee_pct: null,
    currency: null,
    active: true,
    has_orders: true,
    period_sales: 0,
    period_orders: 0,
    period_units_sold: 0,
    velocity_units_per_day_90d: null,
    inventory_days: null,
    stock_quantity: null,
    stock_observed_at: null,
    platform_synced_at: null,
    prev_month_units_sold: 0,
    stock_alert: 'none',
    period_settlement: periodSettlement,
  }
}

describe('mergeListingSettlementsByPlatform', () => {
  it('sums multiple mercadolibre listings into one platform row', () => {
    const rows = mergeListingSettlementsByPlatform([
      listing('a', 'mercadolibre', settlement({ gross_revenue: 100, net_revenue: 90, estimated_payout: 80 })),
      listing('b', 'mercadolibre', settlement({ gross_revenue: 50, net_revenue: 45, estimated_payout: 40 })),
      listing('c', 'shopify', settlement({ gross_revenue: 20, net_revenue: 20, estimated_payout: 18 })),
    ])

    expect(rows).toHaveLength(2)
    const meli = rows.find((row) => row.platform === 'mercadolibre')
    expect(meli?.gross_revenue).toBe(150)
    expect(meli?.net_revenue).toBe(135)
    expect(meli?.estimated_payout).toBe(120)
  })
})

describe('resolveProductPlatformSettlement', () => {
  it('returns product total for all channels', () => {
    const total = settlement({ gross_revenue: 300, net_revenue: 250, estimated_payout: 220 })
    const resolved = resolveProductPlatformSettlement({
      channelFilter: 'all',
      periodSettlement: total,
      periodSettlementByPlatform: [],
      listings: [],
    })
    expect(resolved).toEqual(total)
  })

  it('prefers API platform row over listing merge', () => {
    const resolved = resolveProductPlatformSettlement({
      channelFilter: 'shopify',
      periodSettlement: settlement({ gross_revenue: 999 }),
      periodSettlementByPlatform: [
        { platform: 'shopify', ...settlement({ gross_revenue: 120, net_revenue: 100, estimated_payout: 90 }) },
      ],
      listings: [listing('s1', 'shopify', settlement({ gross_revenue: 50 }))],
    })
    expect(resolved?.gross_revenue).toBe(120)
  })
})
