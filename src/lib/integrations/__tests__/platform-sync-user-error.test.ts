import { describe, expect, it } from 'vitest'

import {
  formatPlatformSyncUserError,
  isPlatformSyncUserCancelled,
} from '@/lib/integrations/platform-sync-user-error'

describe('isPlatformSyncUserCancelled', () => {
  it('returns true for user_cancelled error code', () => {
    expect(isPlatformSyncUserCancelled('user_cancelled', null)).toBe(true)
  })

  it('returns true for normalized cancel message', () => {
    expect(isPlatformSyncUserCancelled(null, 'Sync cancelled by user.')).toBe(true)
  })
})

describe('formatPlatformSyncUserError', () => {
  it('sanitizes internal sqlalchemy errors to fallback', () => {
    const msg = formatPlatformSyncUserError(
      'greenlet_spawn has not been called',
      'en',
      'amazonSyncFailedUserMessage',
    )
    expect(msg).toBeTruthy()
    expect(msg).not.toMatch(/greenlet/i)
  })

  it('maps worker_died_silently to dedicated message', () => {
    const msg = formatPlatformSyncUserError(
      null,
      'en',
      'amazonSyncFailedUserMessage',
      'worker_died_silently',
    )
    expect(msg).toMatch(/worker|sync/i)
  })

  it('returns clean API message when safe', () => {
    const msg = formatPlatformSyncUserError(
      'Could not refresh Amazon token',
      'en',
      'amazonSyncFailedUserMessage',
    )
    expect(msg).toBe('Could not refresh Amazon token')
  })
})
