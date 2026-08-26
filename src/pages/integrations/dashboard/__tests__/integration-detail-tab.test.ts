import { describe, expect, it } from 'vitest'

import {
  integrationDetailTabFromSearch,
  isIntegrationDetailTabId,
} from '@/pages/integrations/dashboard/integration-detail-tab'

describe('integrationDetailTabFromSearch', () => {
  it('defaults to overview', () => {
    expect(integrationDetailTabFromSearch(null)).toBe('overview')
    expect(integrationDetailTabFromSearch('overview')).toBe('overview')
    expect(integrationDetailTabFromSearch('docs')).toBe('overview')
  })

  it('reads settings from the query string', () => {
    expect(integrationDetailTabFromSearch('settings')).toBe('settings')
  })
})

describe('isIntegrationDetailTabId', () => {
  it('accepts overview and settings only', () => {
    expect(isIntegrationDetailTabId('overview')).toBe(true)
    expect(isIntegrationDetailTabId('settings')).toBe(true)
    expect(isIntegrationDetailTabId('docs')).toBe(false)
  })
})
