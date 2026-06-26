import { matchPath } from 'react-router-dom'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'

export const INTEGRATIONS_BASE_PATH = '/dashboard/integrations'

export type IntegrationsNavItemId = 'all' | 'ecommerce' | 'ads'

export type IntegrationsNavItem = {
  id: IntegrationsNavItemId
  path: string
  labelKey: ShellStringKey
}

export const INTEGRATIONS_INNER_NAV: IntegrationsNavItem[] = [
  { id: 'all', path: INTEGRATIONS_BASE_PATH, labelKey: 'integrationsNavAll' },
  {
    id: 'ecommerce',
    path: `${INTEGRATIONS_BASE_PATH}/ecommerce`,
    labelKey: 'integrationsNavEcommerce',
  },
  { id: 'ads', path: `${INTEGRATIONS_BASE_PATH}/ads`, labelKey: 'integrationsNavAds' },
]

const INTEGRATION_DETAIL_SLUG_PATTERN = `${INTEGRATIONS_BASE_PATH}/:slug`

export function isIntegrationsRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/'
  return (
    normalized === INTEGRATIONS_BASE_PATH ||
    normalized.startsWith(`${INTEGRATIONS_BASE_PATH}/`)
  )
}

export function isIntegrationsNavItemActive(
  item: IntegrationsNavItem,
  pathname: string,
): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/'

  if (item.id === 'ads') {
    return matchPath({ path: item.path, end: true }, normalized) != null
  }

  if (item.id === 'ecommerce') {
    return matchPath({ path: item.path, end: true }, normalized) != null
  }

  if (normalized === INTEGRATIONS_BASE_PATH) return true

  const detailMatch = matchPath({ path: INTEGRATION_DETAIL_SLUG_PATTERN, end: true }, normalized)
  if (!detailMatch?.params.slug) return false

  const slug = detailMatch.params.slug
  return slug !== 'ecommerce' && slug !== 'ads'
}
