export type LatestFxForDisplay = {
  rate: string
  rate_date: string
  from: string
  to: string
}

import type { ModuleId } from '@/lib/modules/types'

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
  latest_fx_for_display: LatestFxForDisplay | null
  account_deletion_status?: AccountDeletionUiStatus | null
  deletion_requested_at?: string | null
  scheduled_purge_at?: string | null
  member_count?: number | null
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
