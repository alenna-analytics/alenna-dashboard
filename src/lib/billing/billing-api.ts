import { apiPostJson } from '@/lib/api/client'
import type { GetTokenFn } from '@/lib/api/client'

export type CheckoutPlanSlug = 'basic' | 'growth'

type BillingSessionResponse = {
  url: string
}

async function parseBillingUrl(res: Response): Promise<string> {
  if (!res.ok) {
    let message = 'Unable to start Stripe checkout.'
    try {
      const body = (await res.json()) as {
        detail?: string | { message?: string; code?: string }
      }
      const detail = body.detail
      if (typeof detail === 'string' && detail.trim()) {
        message = detail
      } else if (
        typeof detail === 'object' &&
        detail !== null &&
        typeof detail.message === 'string' &&
        detail.message.trim()
      ) {
        message = detail.message
      }
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  const data = (await res.json()) as BillingSessionResponse
  if (!data.url?.trim()) {
    throw new Error('Stripe did not return a checkout URL.')
  }
  return data.url.trim()
}

export async function createCheckoutSession(
  plan: CheckoutPlanSlug,
  getToken: GetTokenFn,
  tenantId: string,
): Promise<string> {
  const res = await apiPostJson('/billing/checkout-session', getToken, { plan }, {}, tenantId)
  return parseBillingUrl(res)
}

export async function createCustomerPortalSession(
  getToken: GetTokenFn,
  tenantId: string,
): Promise<string> {
  const res = await apiPostJson('/billing/customer-portal', getToken, {}, {}, tenantId)
  return parseBillingUrl(res)
}

export function redirectToStripe(url: string): void {
  window.location.assign(url)
}
