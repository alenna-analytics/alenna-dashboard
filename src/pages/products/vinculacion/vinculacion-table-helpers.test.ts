import { describe, expect, it } from 'vitest'

import { primaryProductImageUrl, uniquePlatformSlugs } from './vinculacion-table-helpers'

describe('primaryProductImageUrl', () => {
  it('returns the first non-empty url', () => {
    expect(primaryProductImageUrl([null, '', ' https://a ', 'https://b'])).toBe('https://a')
  })

  it('returns null when all empty', () => {
    expect(primaryProductImageUrl([null, undefined, '  '])).toBeNull()
  })
})

describe('uniquePlatformSlugs', () => {
  it('dedupes and normalizes platform slugs', () => {
    expect(uniquePlatformSlugs(['Shopify', 'amazon', 'shopify', ' Amazon '])).toEqual([
      'shopify',
      'amazon',
    ])
  })
})
