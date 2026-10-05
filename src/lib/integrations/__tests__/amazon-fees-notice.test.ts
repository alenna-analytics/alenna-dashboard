import { describe, expect, it } from 'vitest'

import {
  amazonFeesNoticeStateFromConnection,
  resolveAmazonFeesNoticeState,
} from '@/lib/integrations/amazon-fees-notice'
import type { PlatformConnection } from '@/lib/types/connectors'

function amazonConn(fees_status: string | null): PlatformConnection {
  return {
    id: 'conn-1',
    platform: 'amazon',
    status: 'active',
    connection_status: 'active',
    fees_status,
  } as PlatformConnection
}

describe('amazon-fees-notice', () => {
  it('resolveAmazonFeesNoticeState ignores partial fees that a later sync will fill', () => {
    expect(resolveAmazonFeesNoticeState([amazonConn('partial')], [])).toBe('none')
  })

  it('resolveAmazonFeesNoticeState still warns when fees are unavailable', () => {
    expect(
      resolveAmazonFeesNoticeState([amazonConn('partial'), amazonConn('unavailable')], []),
    ).toBe('unavailable')
  })

  it('amazonFeesNoticeStateFromConnection ignores non-amazon', () => {
    expect(
      amazonFeesNoticeStateFromConnection({
        ...amazonConn('partial'),
        platform: 'shopify',
      }),
    ).toBe('none')
  })
})
