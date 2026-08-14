import { describe, expect, it } from 'vitest'

import { userInitials } from '@/lib/user/initials'

describe('userInitials', () => {
  it('uses first and last name', () => {
    expect(userInitials({ firstName: 'John', lastName: 'Samuels' })).toBe('JS')
  })

  it('falls back to email when names are missing', () => {
    expect(userInitials({ email: 'ada@example.com' })).toBe('A')
  })
})
