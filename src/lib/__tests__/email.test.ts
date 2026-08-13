import { describe, expect, it } from 'vitest'

import { isValidEmail } from '@/lib/email'

describe('isValidEmail', () => {
  it('accepts a normal address', () => {
    expect(isValidEmail('ana@alenna.io')).toBe(true)
  })

  it('rejects incomplete input', () => {
    expect(isValidEmail('sfdsf.')).toBe(false)
    expect(isValidEmail('ana@')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})
