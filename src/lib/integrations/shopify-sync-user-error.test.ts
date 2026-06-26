import { describe, expect, it } from 'vitest'

import { formatShopifySyncUserError } from '@/lib/integrations/shopify-sync-user-error'

describe('formatShopifySyncUserError', () => {
  it('returns friendly copy for internal sqlalchemy failures', () => {
    const raw =
      "greenlet_spawn has not been called; can't call await_only() here. (cursor='abc', page=65)"
    const out = formatShopifySyncUserError(raw, 'es')
    expect(out).toBe(
      'No se pudo completar la sincronización. Puedes reintentar en unos momentos.',
    )
    expect(out).not.toContain('greenlet')
  })

  it('passes through safe user-facing messages', () => {
    const out = formatShopifySyncUserError('Shopify is not connected for this workspace', 'en')
    expect(out).toBe('Shopify is not connected for this workspace')
  })
})
