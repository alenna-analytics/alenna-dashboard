export type MeResponse = {
  tenant_id: string
  user_id: string
  clerk_user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  role_name: string
  /** ISO 4217; analytics amounts are stored in this currency. */
  base_currency: string
  /** MXN per 1 USD; used to convert between MXN and USD for display. */
  fx_mxn_per_usd: string
}
