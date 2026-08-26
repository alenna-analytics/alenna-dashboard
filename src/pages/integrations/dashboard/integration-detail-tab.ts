export type IntegrationDetailTabId = 'overview' | 'settings'

export function integrationDetailTabFromSearch(raw: string | null): IntegrationDetailTabId {
  return raw === 'settings' ? 'settings' : 'overview'
}

export function isIntegrationDetailTabId(value: string): value is IntegrationDetailTabId {
  return value === 'overview' || value === 'settings'
}
