import { describe, expect, it } from 'vitest'

import { formatAmazonSyncUserError } from '@/lib/integrations/amazon-sync-user-error'

describe('formatAmazonSyncUserError', () => {
  it('asks to retry when the access token expired', () => {
    const raw =
      'orders/702-1/orderItems failed: HTTP 403 — The access token you provided has expired.'
    const out = formatAmazonSyncUserError(raw, 'es')
    expect(out).toContain('expiró')
    expect(out).toContain('reconectar')
    expect(out).not.toContain('no autorizó el acceso a pedidos')
  })

  it('keeps reconnect copy for a real permissions 403', () => {
    const out = formatAmazonSyncUserError(
      'Amazon denied access to orders. Disconnect and reconnect the integration.',
      'en',
    )
    expect(out).toContain('Disconnect and reconnect')
  })
})
