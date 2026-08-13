import { describe, expect, it } from 'vitest'

import type { ProductListingApi } from '@/lib/types/catalog'

import { sharedStockListingIds } from '../product-detail-listing-stock'

function listing(partial: Partial<ProductListingApi> & Pick<ProductListingApi, 'id'>): ProductListingApi {
  return {
    platform: 'mercadolibre',
    platform_sku: 'SKU-1',
    platform_variant_id: null,
    platform_title: null,
    platform_price: null,
    platform_fee_pct: null,
    currency: null,
    active: true,
    has_orders: false,
    period_sales: 0,
    period_orders: 0,
    period_units_sold: 0,
    velocity_units_per_day_90d: null,
    inventory_days: null,
    stock_quantity: 10,
    stock_observed_at: null,
    platform_synced_at: null,
    prev_month_units_sold: 0,
    stock_alert: 'none',
    period_settlement: null,
    ...partial,
  }
}

describe('sharedStockListingIds', () => {
  it('marks duplicate publications with the same SKU and stock as shared', () => {
    const listings = [
      listing({ id: 'a', platform_variant_id: 'MLA111' }),
      listing({ id: 'b', platform_variant_id: 'MLA222' }),
    ]
    expect(sharedStockListingIds(listings)).toEqual(new Set(['b']))
  })

  it('does not hide stock when quantities differ across publications', () => {
    const listings = [
      listing({ id: 'a', platform_variant_id: 'MLA111', stock_quantity: 10 }),
      listing({ id: 'b', platform_variant_id: 'MLA222', stock_quantity: 4 }),
    ]
    expect(sharedStockListingIds(listings)).toEqual(new Set())
  })
})
