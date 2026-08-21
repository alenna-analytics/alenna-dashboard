import { describe, expect, it } from 'vitest'

import {
  filterEcommerceConnections,
  resolveAdsApiScope,
  resolveAdsPageScope,
} from '@/lib/integrations/ads-scope'
import type { PlatformConnection } from '@/lib/types/connectors'

function conn(
  overrides: Partial<PlatformConnection> & Pick<PlatformConnection, 'id' | 'platform'>,
): PlatformConnection {
  return {
    shop_domain: null,
    status: 'active',
    connection_status: 'active',
    last_synced_at: null,
    last_error: null,
    orders_watermark_at: null,
    orders_backfill_completed_through: null,
    fees_status: null,
    sync_plan: null,
    linked_commerce_connection_id: null,
    ...overrides,
  }
}

describe('resolveAdsApiScope', () => {
  const shopify = conn({ id: 'shopify-1', platform: 'shopify' })
  const amazon = conn({ id: 'amz-1', platform: 'amazon' })
  const adsLinked = conn({
    id: 'ads-1',
    platform: 'amazon_ads',
    linked_commerce_connection_id: 'amz-1',
  })
  const adsUnlinked = conn({ id: 'ads-c', platform: 'amazon_ads' })

  it('includes case C ads when there is no home filter', () => {
    const scope = resolveAdsApiScope([shopify, amazon, adsLinked, adsUnlinked])
    expect(scope.adsConnectionIds.sort()).toEqual(['ads-1', 'ads-c'].sort())
    expect(scope.queryConnectionIds.sort()).toEqual(['ads-1', 'ads-c', 'amz-1'].sort())
    expect(scope.hasAdsConnections).toBe(true)
  })

  it('does not inject unlinked ads into a filtered home view', () => {
    const scope = resolveAdsApiScope([shopify, amazon, adsLinked, adsUnlinked], ['shopify-1'])
    expect(scope.adsConnectionIds).toEqual([])
    expect(scope.queryConnectionIds).toEqual([])
    expect(scope.hasAdsConnections).toBe(false)
  })

  it('keeps linked ads when the sibling is in the home filter', () => {
    const scope = resolveAdsApiScope([shopify, amazon, adsLinked, adsUnlinked], ['amz-1'])
    expect(scope.adsConnectionIds).toEqual(['ads-1'])
    expect(scope.queryConnectionIds.sort()).toEqual(['ads-1', 'amz-1'].sort())
  })
})

describe('resolveAdsPageScope', () => {
  it('filters by ads connection ids when selected', () => {
    const shopify = conn({ id: 'shopify-1', platform: 'shopify' })
    const adsA = conn({ id: 'ads-a', platform: 'google_ads' })
    const adsB = conn({ id: 'ads-b', platform: 'amazon_ads' })
    const scope = resolveAdsPageScope([shopify, adsA, adsB], ['ads-a'])
    expect(scope.hasAdsConnections).toBe(true)
    expect(scope.adsConnectionIds).toEqual(['ads-a'])
    expect(scope.queryConnectionIds).toEqual(['ads-a'])
  })

  it('excludes ads from ecommerce filter helper', () => {
    const rows = [
      conn({ id: 's', platform: 'shopify' }),
      conn({ id: 'g', platform: 'google_ads' }),
    ]
    expect(filterEcommerceConnections(rows).map((r) => r.id)).toEqual(['s'])
  })
})
