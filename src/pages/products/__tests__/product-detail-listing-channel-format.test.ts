import { describe, expect, it } from 'vitest'

import {
  formatListingPublicationDisplay,
  formatListingPublicationSubtitle,
  formatPlatformListingVariantLabel,
  resolveListingVariantId,
  truncateListingLabel,
} from '../product-detail-listing-channel-format'

describe('formatPlatformListingVariantLabel', () => {
  it('extracts numeric tail for Mercado Libre item ids', () => {
    expect(formatPlatformListingVariantLabel('mercadolibre', 'MLM5705153018')).toBe('#5705153018')
  })

  it('extracts variant digits from Shopify gid', () => {
    expect(
      formatPlatformListingVariantLabel(
        'shopify',
        'gid://shopify/ProductVariant/44772407312638',
      ),
    ).toBe('#44772407312638')
  })

  it('returns raw id for Amazon ASIN', () => {
    expect(formatPlatformListingVariantLabel('amazon', 'B0ABC123')).toBe('B0ABC123')
  })
})

describe('resolveListingVariantId', () => {
  it('falls back to gid embedded in Shopify SKU when variant id is missing', () => {
    expect(
      resolveListingVariantId({
        platform: 'shopify',
        platform_variant_id: null,
        platform_sku: 'gid://shopify/ProductVariant/44772407312638',
      }),
    ).toBe('gid://shopify/ProductVariant/44772407312638')
  })
})

describe('formatListingPublicationDisplay', () => {
  it('separates Meli publication id and list price', () => {
    const display = formatListingPublicationDisplay({
      platform: 'mercadolibre',
      platform_variant_id: 'MLM5739971588',
      platform_sku: 'gat1kg',
      platform_price: 675,
      currency: 'MXN',
    })
    expect(display.variantLabel).toBe('#5739971588')
    expect(display.listPrice).toContain('675')
  })

  it('shows list price only when variant id is missing', () => {
    const display = formatListingPublicationDisplay({
      platform: 'shopify',
      platform_variant_id: null,
      platform_sku: 'my-sku',
      platform_price: 1561.45,
      currency: 'MXN',
    })
    expect(display.variantLabel).toBeNull()
    expect(display.listPrice).toContain('1,561.45')
  })
})

describe('truncateListingLabel', () => {
  it('crops long publication labels consistently', () => {
    expect(truncateListingLabel('#44772407312638')).toBe('#44772407312638')
    expect(truncateListingLabel('#4477240731263812345678')).toBe('#4477240731263812345…')
  })
})

describe('formatListingPublicationSubtitle', () => {
  it('combines variant label and list price for compact contexts', () => {
    const subtitle = formatListingPublicationSubtitle({
      platform: 'mercadolibre',
      platform_variant_id: 'MLM5739971588',
      platform_sku: 'gat1kg',
      platform_price: 675,
      currency: 'MXN',
    })
    expect(subtitle).toContain('#5739971588')
    expect(subtitle).toContain('675')
  })
})
