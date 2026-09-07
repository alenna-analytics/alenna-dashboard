import { describe, expect, it } from 'vitest'

import {
  GLOBAL_ACTIVITY_AMAZON_SYNC_ID,
  GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID,
  GLOBAL_ACTIVITY_SYNC_AUTO_DISMISS_MS,
  resolveGlobalActivityAutoDismissMs,
} from '@/shell/providers/global-activity-provider'

describe('resolveGlobalActivityAutoDismissMs', () => {
  it('defaults platform sync ids to 10s', () => {
    expect(resolveGlobalActivityAutoDismissMs(GLOBAL_ACTIVITY_AMAZON_SYNC_ID)).toBe(
      GLOBAL_ACTIVITY_SYNC_AUTO_DISMISS_MS,
    )
  })

  it('allows explicit delay override', () => {
    expect(resolveGlobalActivityAutoDismissMs(GLOBAL_ACTIVITY_AMAZON_SYNC_ID, 5_000)).toBe(5_000)
  })

  it('allows opting out with 0 even for sync ids', () => {
    expect(resolveGlobalActivityAutoDismissMs(GLOBAL_ACTIVITY_AMAZON_SYNC_ID, 0)).toBeUndefined()
  })

  it('leaves non-sync activities manual-only by default', () => {
    expect(
      resolveGlobalActivityAutoDismissMs(GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID),
    ).toBeUndefined()
  })

  it('still allows opting in non-sync activities explicitly', () => {
    expect(
      resolveGlobalActivityAutoDismissMs(GLOBAL_ACTIVITY_COGS_BULK_BACKFILL_ID, 8_000),
    ).toBe(8_000)
  })
})
