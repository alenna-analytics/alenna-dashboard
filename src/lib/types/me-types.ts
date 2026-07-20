import type { ModuleId } from '@/lib/modules/types'

/**
 * Latest FX rate for display / multi-currency conversion.
 *
 * When display differs from base: base→display pair.
 * When display equals base (MXN or USD): `/me` still returns the USD↔MXN pair
 * so surfaces like Expenses can convert foreign amounts into base.
 * Null when no matching `fx_rates` row exists.
 */
export type LatestFxForDisplay = {
  rate: string
  rate_date: string
  from: string
  to: string
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
  base_currency: string
  display_currency: string | null
  /** See `LatestFxForDisplay` — may be set even when display equals base (USD↔MXN). */
  latest_fx_for_display: LatestFxForDisplay | null
  account_deletion_status?: AccountDeletionUiStatus | null
  deletion_requested_at?: string | null
  scheduled_purge_at?: string | null
  member_count?: number | null
  is_fixture?: boolean
}

export type AccountDeletionStatusResponse = {
  status: AccountDeletionUiStatus
  deletion_requested_at: string | null
  scheduled_purge_at: string | null
  member_count: number
}

export type UserPreferencesPatch = {
  display_currency: 'MXN' | 'USD' | null
}
