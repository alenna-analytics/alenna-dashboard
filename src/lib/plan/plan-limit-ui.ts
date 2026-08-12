import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { AppIconName } from '@/lib/icons/catalog'
import type { Language } from '@/shell/providers/language-provider'
import type { MeResponse } from '@/lib/types/me-types'
import type { CheckoutPlanSlug } from '@/lib/billing/billing-api'

export const UPGRADE_ENTERPRISE_MAILTO =
  'mailto:support@alenna.io?subject=Upgrade%20to%20Enterprise'

export function upgradeMailtoForCta(
  upgradeCta: MeResponse['upgrade_cta'],
): string | null {
  if (upgradeCta === 'enterprise') return UPGRADE_ENTERPRISE_MAILTO
  return null
}

export function checkoutPlanForCta(
  upgradeCta: MeResponse['upgrade_cta'],
): CheckoutPlanSlug | null {
  if (upgradeCta === 'growth') return 'growth'
  return null
}

export function isBillingOwner(me: MeResponse | null | undefined): boolean {
  return me?.role === 'owner'
}

export function upgradeLabelKeyForCta(
  upgradeCta: MeResponse['upgrade_cta'],
): ShellStringKey | null {
  if (upgradeCta === 'growth') return 'planUpgradeToGrowth'
  if (upgradeCta === 'enterprise') return 'planUpgradeToEnterprise'
  return null
}

export function upgradeLabelForCta(
  upgradeCta: MeResponse['upgrade_cta'],
  lang: Language,
): string | null {
  const key = upgradeLabelKeyForCta(upgradeCta)
  if (!key) return null
  return shellT(lang, key)
}

export function upgradeIconForCta(
  upgradeCta: MeResponse['upgrade_cta'],
): AppIconName | null {
  if (upgradeCta === 'growth') return 'growth'
  if (upgradeCta === 'enterprise') return 'billing'
  return null
}

export function planPillLabel(me: MeResponse, lang: Language): string {
  if (me.plan === 'trial') {
    const days = trialDaysRemaining(me.trial_ends_at)
    if (days != null) {
      return shellT(lang, 'planPillTrialDays', { days: String(days) })
    }
    return shellT(lang, 'planPillTrial')
  }
  const name = me.plan_display_name?.trim() || me.plan
  return name.toUpperCase()
}

export function planSummaryLabel(me: MeResponse, lang: Language): string {
  if (me.plan === 'trial') {
    const days = trialDaysRemaining(me.trial_ends_at)
    if (days != null) {
      return shellT(lang, 'shellSidebarPlanTrialDays', { days: String(days) })
    }
    return shellT(lang, 'shellSidebarPlanTrial')
  }
  const planName = me.plan_display_name?.trim() || me.plan
  return shellT(lang, 'shellSidebarPlanNamed', { plan: planName })
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

export function formatTrialEndDate(trialEndsAt: string | null, lang: Language): string | null {
  if (!trialEndsAt) return null
  const end = new Date(trialEndsAt)
  if (Number.isNaN(end.getTime())) return null
  return end.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function trialEndsOnLabel(me: MeResponse, lang: Language): string | null {
  if (me.plan !== 'trial') return null
  const date = formatTrialEndDate(me.trial_ends_at, lang)
  if (!date) return null
  return shellT(lang, 'billingTrialEndsOn', { date })
}

export function billingPlanHeadline(me: MeResponse, lang: Language): string {
  if (me.plan === 'trial') return shellT(lang, 'billingTrialPlanTitle')
  return planSummaryLabel(me, lang)
}

export function billingPlanDetailLine(me: MeResponse, lang: Language): string | null {
  if (me.plan !== 'trial') return null
  const days = trialDaysRemaining(me.trial_ends_at)
  const date = formatTrialEndDate(me.trial_ends_at, lang)
  if (days != null && date) {
    return shellT(lang, 'billingTrialRemainingEnds', { days: String(days), date })
  }
  if (date) return shellT(lang, 'billingTrialEndsOn', { date })
  return null
}

export function isPlanLimitSyncPaused(me: MeResponse | null | undefined): boolean {
  if (!me?.sync_paused) return false
  return me.sync_paused_reason === 'orders_limit' || me.sync_paused_reason === 'skus_limit'
}

export function formatPlanLimit(value: number | null | undefined, lang: Language): string {
  if (value == null) return shellT(lang, 'billingLimitUnlimited')
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-MX').format(value)
}
