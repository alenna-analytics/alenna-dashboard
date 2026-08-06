/** UI constants for trial copy (aligned with API TRIAL_DURATION_DAYS). */
export const TRIAL_DAYS = 15
export const TRIAL_PRICE_USD = 30

export type SignupIntent = 'trial' | 'growth'

export const SIGNUP_INTENT_STORAGE_KEY = 'alenna_signup_intent'

export function readSignupIntent(): SignupIntent {
  const raw = sessionStorage.getItem(SIGNUP_INTENT_STORAGE_KEY)
  if (raw === 'growth') return 'growth'
  return 'trial'
}

export function writeSignupIntent(intent: SignupIntent): void {
  sessionStorage.setItem(SIGNUP_INTENT_STORAGE_KEY, intent)
}
