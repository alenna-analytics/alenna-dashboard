import { describe, expect, it } from 'vitest'

import {
  ShopifySyncCooldownError,
  ShopifySyncFailedRetryCapError,
  ShopifySyncInProgressError,
  ShopifySyncTenantBusyError,
} from '@/lib/types/connectors'
import {
  buildPlatformFullSyncTypedError,
  formatRetryAfterHoursLabel,
  parseApiErrorPayload,
  readApiErrorDetail,
  secondsToCeilHours,
} from '@/lib/integrations/platform-full-sync-error'

describe('buildPlatformFullSyncTypedError', () => {
  it('maps full sync in progress', () => {
    const err = buildPlatformFullSyncTypedError(409, 'platform_full_sync_in_progress', null)
    expect(err).toBeInstanceOf(ShopifySyncInProgressError)
  })

  it('maps tenant busy', () => {
    const err = buildPlatformFullSyncTypedError(409, 'platform_full_sync_tenant_busy', null)
    expect(err).toBeInstanceOf(ShopifySyncTenantBusyError)
  })

  it('maps cooldown with retry-after', () => {
    const err = buildPlatformFullSyncTypedError(429, 'platform_full_sync_cooldown', 7200)
    expect(err).toBeInstanceOf(ShopifySyncCooldownError)
    expect((err as ShopifySyncCooldownError).retryAfterSeconds).toBe(7200)
  })

  it('maps failed retry cap', () => {
    const err = buildPlatformFullSyncTypedError(429, 'platform_full_sync_failed_retry_cap', 3600)
    expect(err).toBeInstanceOf(ShopifySyncFailedRetryCapError)
    expect((err as ShopifySyncFailedRetryCapError).retryAfterSeconds).toBe(3600)
  })

  it('returns null for unrelated errors', () => {
    expect(buildPlatformFullSyncTypedError(409, 'platform_sync_in_progress', null)).toBeNull()
  })
})

describe('parseApiErrorPayload', () => {
  it('parses structured detail and prefers body retry seconds', async () => {
    const res = new Response(
      JSON.stringify({
        detail: {
          code: 'platform_full_sync_cooldown',
          retry_after_seconds: 84000,
          retry_after_at: '2026-09-19T18:56:06.605803+00:00',
        },
      }),
      { status: 429, headers: { 'Retry-After': '1' } },
    )
    const payload = await parseApiErrorPayload(res)
    expect(payload.code).toBe('platform_full_sync_cooldown')
    expect(payload.retryAfterSeconds).toBe(84000)
    expect(payload.retryAfterAt).toBe('2026-09-19T18:56:06.605803+00:00')
  })

  it('parses string detail with header retry', async () => {
    const res = new Response(JSON.stringify({ detail: 'platform_full_sync_cooldown' }), {
      status: 429,
      headers: { 'Retry-After': '3600' },
    })
    const payload = await parseApiErrorPayload(res)
    expect(payload.code).toBe('platform_full_sync_cooldown')
    expect(payload.retryAfterSeconds).toBe(3600)
  })

  it('readApiErrorDetail does not dump object JSON', async () => {
    const res = new Response(
      JSON.stringify({
        detail: { code: 'platform_full_sync_cooldown', retry_after_seconds: 10 },
      }),
      { status: 429 },
    )
    expect(await readApiErrorDetail(res)).toBe('platform_full_sync_cooldown')
  })
})

describe('formatRetryAfterHoursLabel', () => {
  it('shows sub-hour remainder instead of 0h', () => {
    expect(formatRetryAfterHoursLabel(45)).toBe('<1 (1m)')
    expect(formatRetryAfterHoursLabel(120)).toBe('<1 (2m)')
  })

  it('ceils whole hours', () => {
    expect(formatRetryAfterHoursLabel(3601)).toBe('2')
    expect(secondsToCeilHours(3601)).toBe(2)
  })

  it('returns 0 when elapsed', () => {
    expect(formatRetryAfterHoursLabel(0)).toBe('0')
    expect(formatRetryAfterHoursLabel(null)).toBe('0')
  })
})
