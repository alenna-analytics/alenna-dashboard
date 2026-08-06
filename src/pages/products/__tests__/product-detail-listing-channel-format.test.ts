import { describe, expect, it } from 'vitest'

import {
  formatListingPublicationSubtitle,
  formatPlatformListingVariantLabel,
} from '../product-detail-listing-channel-format'

describe('formatPlatformListingVariantLabel', () => {
  it('extracts numeric tail for Mercado Libre item ids', () => {
    expect(formatPlatformListingVariantLabel('mercadolibre', 'MLM5705153018')).toBe('#5705153018')
  })

  it('returns raw id for non-Meli platforms', () => {
    expect(formatPlatformListingVariantLabel('amazon', 'B0ABC123')).toBe('B0ABC123')
  })
})

describe('formatListingPublicationSubtitle', () => {
  it('combines Meli publication id and listing price', () => {
    const subtitle = formatListingPublicationSubtitle({
      platform: 'mercadolibre',
      platform_variant_id: 'MLM5739971588',
      platform_price: 675,
      currency: 'MXN',
    })
    expect(subtitle).toContain('#5739971588')
    expect(subtitle).toContain('675')
  })
})
