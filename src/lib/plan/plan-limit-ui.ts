import type { MeResponse } from '@/lib/types/me-types'

export const UPGRADE_GROWTH_MAILTO =
  'mailto:support@alenna.io?subject=Upgrade%20to%20Growth'

export const CONTACT_CUSTOM_MAILTO =
  'mailto:support@alenna.io?subject=Expand%20plan%20limits'

export function upgradeMailtoForCta(upgradeCta: MeResponse['upgrade_cta']): string | null {
  if (upgradeCta === 'growth') return UPGRADE_GROWTH_MAILTO
  if (upgradeCta === 'contact') return CONTACT_CUSTOM_MAILTO
  return null
}

export function formatUserDisplayName(me: MeResponse): string {
  const parts = [me.first_name?.trim(), me.last_name?.trim()].filter(Boolean)
  if (parts.length > 0) return parts.join(' ')
  return me.email.trim() || 'User'
}

export function trialDaysRemaining(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null
  const end = new Date(trialEndsAt)
  if (Number.isNaN(end.getTime())) return null
  const diffMs = end.getTime() - Date.now()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

export function isPlanLimitSyncPaused(me: MeResponse | null | undefined): boolean {
  if (!me?.sync_paused) return false
  return me.sync_paused_reason === 'orders_limit' || me.sync_paused_reason === 'skus_limit'
}
