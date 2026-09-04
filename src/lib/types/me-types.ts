import type { ModuleId } from '@/lib/modules/types'

export type LatestFxForDisplay = {
  rate: string
  rate_date: string
  from: string
  to: string
}

export type MeCurrencyCapabilities = {
  multi_currency_enabled: boolean
  base_currency: string
  expense_currencies: string[]
  display_currencies: string[]
}

export type AccountDeletionUiStatus = 'active' | 'pending'

export type MeResponse = {
  tenant_id: string
  tenant_name: string
  plan: string
  modules: ModuleId[]
  trial_ends_at: string | null
  trial_expired: boolean
  user_id: string
  clerk_user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  role_name: string
  permissions?: string[]
  is_owner?: boolean
  can_manage_roles?: boolean
  roles_used?: number
  roles_limit?: number | null
  base_currency: string
  display_currency: string | null
  currency?: MeCurrencyCapabilities
  /** See `LatestFxForDisplay` — may be set even when display equals base. */
  latest_fx_for_display: LatestFxForDisplay | null
  account_deletion_status?: AccountDeletionUiStatus | null
  deletion_requested_at?: string | null
  scheduled_purge_at?: string | null
  member_count?: number | null
  is_fixture?: boolean
  team_invites_enabled?: boolean
  plan_display_name?: string
  orders_used?: number
  orders_limit?: number | null
  skus_used?: number
  skus_limit?: number | null
  users_used?: number
  users_limit?: number | null
  sync_paused?: boolean
  sync_paused_reason?: 'orders_limit' | 'skus_limit' | 'trial_expired' | null
  upgrade_cta?: 'growth' | 'enterprise' | 'none'
  has_stripe_subscription?: boolean
  has_stripe_customer?: boolean
  signup_intent: 'trial' | 'growth'
  payment_required: boolean
}

export type AccountDeletionStatusResponse = {
  status: AccountDeletionUiStatus
  deletion_requested_at: string | null
  scheduled_purge_at: string | null
  member_count: number
}

export type UserPreferencesPatch = {
  display_currency: string | null
}
