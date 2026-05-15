export type LatestFxForDisplay = {
  rate: string
  rate_date: string
  from: string
  to: string
}

export type MeResponse = {
  tenant_id: string
  tenant_name: string
  plan: string
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
}

export type UserPreferencesPatch = {
  display_currency: 'MXN' | 'USD' | null
}
