import { describe, expect, it } from 'vitest'

import { integrationDetailSlugFromPath } from '@/pages/integrations/dashboard/integrations-inner-nav'

describe('integrationDetailSlugFromPath', () => {
  it('returns the integration slug', () => {
    expect(integrationDetailSlugFromPath('/dashboard/integrations/amazon')).toBe('amazon')
    expect(integrationDetailSlugFromPath('/dashboard/integrations/google_ads/')).toBe('google_ads')
  })

  it('ignores list routes', () => {
    expect(integrationDetailSlugFromPath('/dashboard/integrations')).toBeNull()
    expect(integrationDetailSlugFromPath('/dashboard/integrations/ecommerce')).toBeNull()
    expect(integrationDetailSlugFromPath('/dashboard/integrations/ads')).toBeNull()
  })
})
