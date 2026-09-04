import { can } from '@/lib/permissions/can'
import type { MeResponse } from '@/lib/types/me-types'

export type HomePermissionFlags = {
  canSalesHome: boolean
  canAdsHome: boolean
  canChannelHome: boolean
  canAlertsHome: boolean
  canFetchConnectors: boolean
  hasAnyHomeWidget: boolean
}

export function resolveHomePermissionFlags(me: MeResponse | null | undefined): HomePermissionFlags {
  const canSalesHome =
    can(me, 'reports.view') || can(me, 'sales.view') || can(me, 'products.view')
  const canAdsHome = can(me, 'ads.view')
  const canChannelHome = can(me, 'channels.view') || can(me, 'reports.view')
  const canAlertsHome = can(me, 'alerts.view')
  const canIntegrations = can(me, 'integrations.view')
  const canFetchConnectors =
    canSalesHome || canAdsHome || canChannelHome || canIntegrations || canAlertsHome
  return {
    canSalesHome,
    canAdsHome,
    canChannelHome,
    canAlertsHome,
    canFetchConnectors,
    hasAnyHomeWidget: canSalesHome || canAdsHome || canChannelHome,
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Extract product-link suggestion id from a match_suggestion alert payload. */
export function matchSuggestionIdFromPayload(
  payload: Record<string, unknown> | null | undefined,
): string | null {
  if (!payload || typeof payload !== 'object') return null
  const raw = payload.suggestion_id
  if (typeof raw !== 'string') return null
  const id = raw.trim()
  return UUID_RE.test(id) ? id : null
}
