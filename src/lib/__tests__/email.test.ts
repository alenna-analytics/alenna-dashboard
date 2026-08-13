import { describe, expect, it } from 'vitest'

import { isValidEmail } from '@/lib/email'

describe('isValidEmail', () => {
  it('accepts a normal address', () => {
    expect(isValidEmail('ana@alenna.io')).toBe(true)
    expect(isValidEmail('user@demo.com')).toBe(true)
    expect(isValidEmail('user@company.info')).toBe(true)
  })

  it('rejects incomplete input', () => {
    expect(isValidEmail('sfdsf.')).toBe(false)
    expect(isValidEmail('ana@')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })

  it('rejects a TLD longer than 4 characters', () => {
    expect(
      isValidEmail('test@demo.comlkhkgkjhghjghjkghjghjkghhjkghjkgjhgkhjkghjkghjgjhkg'),
    ).toBe(false)
    expect(isValidEmail('user@demo.museum')).toBe(false)
  })
})
