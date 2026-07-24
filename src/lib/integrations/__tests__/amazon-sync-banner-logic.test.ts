import { describe, expect, it } from 'vitest'

import { shouldShowAmazonSyncSuccessFromConnector } from '@/lib/integrations/amazon-sync-banner-logic'

describe('shouldShowAmazonSyncSuccessFromConnector', () => {
  it('returns false when current timestamp matches baseline', () => {
    expect(
      shouldShowAmazonSyncSuccessFromConnector({
        baselineCompletedAt: '2026-01-01T12:00:00.000Z',
        currentCompletedAt: '2026-01-01T12:00:00.000Z',
      }),
    ).toBe(false)
  })

  it('returns true when current timestamp is newer than baseline', () => {
    expect(
      shouldShowAmazonSyncSuccessFromConnector({
        baselineCompletedAt: '2026-01-01T12:00:00.000Z',
        currentCompletedAt: '2026-01-02T12:00:00.000Z',
      }),
    ).toBe(true)
  })

  it('returns true when baseline is null and current exists', () => {
    expect(
      shouldShowAmazonSyncSuccessFromConnector({
        baselineCompletedAt: null,
        currentCompletedAt: '2026-01-01T12:00:00.000Z',
      }),
    ).toBe(true)
  })
})
