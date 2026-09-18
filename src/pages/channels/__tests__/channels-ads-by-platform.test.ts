import { describe, expect, it } from 'vitest'

import {
  aggregateAdsByEcommercePlatform,
  attributedRoas,
  tacosPct,
} from '@/pages/channels/channels-ads-by-platform'
import type { AdsChannelRow } from '@/pages/ads/use-ads-kpis'

function adsRow(partial: Partial<AdsChannelRow> & Pick<AdsChannelRow, 'platform'>): AdsChannelRow {
  return {
    connection_id: partial.connection_id ?? 'ads-1',
    linked_commerce_connection_id: partial.linked_commerce_connection_id ?? null,
    spend: partial.spend ?? 0,
    attributed_sales: partial.attributed_sales ?? 0,
    attributed_conversions: 0,
    impressions: 0,
    clicks: 0,
    roas: null,
    tacos: null,
    cpa: null,
    fx_incomplete: false,
    platform: partial.platform,
  }
}

describe('aggregateAdsByEcommercePlatform', () => {
  it('maps linked ads spend onto ecommerce platforms by network', () => {
    const result = aggregateAdsByEcommercePlatform(
      [
        adsRow({
          platform: 'google_ads',
          linked_commerce_connection_id: 'shop-1',
          spend: 100,
          attributed_sales: 400,
        }),
        adsRow({
          platform: 'amazon_ads',
          linked_commerce_connection_id: 'amz-1',
          spend: 50,
          attributed_sales: 200,
        }),
        adsRow({
          platform: 'google_ads',
          linked_commerce_connection_id: null,
          spend: 999,
          attributed_sales: 0,
        }),
      ],
      { 'shop-1': 'shopify', 'amz-1': 'amazon' },
      [{ slug: 'shopify' }, { slug: 'amazon' }],
    )

    expect(result.shopify.byNetwork.google_ads).toBe(100)
    expect(result.shopify.linkedSpend).toBe(100)
    expect(result.shopify.attributedSales).toBe(400)
    expect(result.amazon.byNetwork.amazon_ads).toBe(50)
    expect(result.total.linkedSpend).toBe(150)
    expect(result.total.attributedSales).toBe(600)
  })

  it('ignores unlinked ads for platform columns', () => {
    const result = aggregateAdsByEcommercePlatform(
      [adsRow({ platform: 'google_ads', spend: 10, linked_commerce_connection_id: null })],
      {},
      [{ slug: 'shopify' }],
    )
    expect(result.shopify.linkedSpend).toBe(0)
    expect(result.total.linkedSpend).toBe(0)
  })
})

describe('tacosPct / attributedRoas', () => {
  it('returns null when denominators are zero', () => {
    expect(tacosPct(10, 0)).toBeNull()
    expect(attributedRoas(100, 0)).toBeNull()
  })

  it('computes ratios', () => {
    expect(tacosPct(10, 100)).toBe(10)
    expect(attributedRoas(200, 50)).toBe(4)
  })
})
