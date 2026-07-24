import { describe, expect, it } from 'vitest'

import {
  ShopifySyncCooldownError,
  ShopifySyncFailedRetryCapError,
  ShopifySyncInProgressError,
  ShopifySyncTenantBusyError,
} from '@/lib/types/connectors'
import { buildPlatformFullSyncTypedError } from '@/lib/integrations/platform-full-sync-error'

describe('buildPlatformFullSyncTypedError', () => {
  it('maps full sync in progress', () => {
    const err = buildPlatformFullSyncTypedError(409, 'shopify_full_sync_in_progress', null)
    expect(err).toBeInstanceOf(ShopifySyncInProgressError)
  })

  it('maps tenant busy', () => {
    const err = buildPlatformFullSyncTypedError(409, 'shopify_full_sync_tenant_busy', null)
    expect(err).toBeInstanceOf(ShopifySyncTenantBusyError)
  })

  it('maps cooldown with retry-after', () => {
    const err = buildPlatformFullSyncTypedError(429, 'shopify_full_sync_cooldown', 7200)
    expect(err).toBeInstanceOf(ShopifySyncCooldownError)
    expect((err as ShopifySyncCooldownError).retryAfterSeconds).toBe(7200)
  })

  it('maps failed retry cap', () => {
    const err = buildPlatformFullSyncTypedError(429, 'shopify_full_sync_failed_retry_cap', 3600)
    expect(err).toBeInstanceOf(ShopifySyncFailedRetryCapError)
    expect((err as ShopifySyncFailedRetryCapError).retryAfterSeconds).toBe(3600)
  })

  it('returns null for unrelated errors', () => {
    expect(buildPlatformFullSyncTypedError(409, 'platform_sync_in_progress', null)).toBeNull()
  })
})
