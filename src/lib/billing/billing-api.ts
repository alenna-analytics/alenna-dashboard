import { apiFetch, apiPostJson } from '@/lib/api/client'
import type { GetTokenFn } from '@/lib/api/client'

export type CheckoutPlanSlug = 'basic' | 'growth'

type BillingSessionResponse = {
  url: string
}

type BillingErrorDetail = {
  detail?: string | { message?: string; code?: string }
}

export class BillingUseCustomerPortalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BillingUseCustomerPortalError'
  }
}

export type CheckoutSessionOptions = {
  successUrl?: string
  cancelUrl?: string
}

async function parseBillingUrl(res: Response): Promise<string> {
  if (!res.ok) {
    let message = 'Unable to start Stripe checkout.'
    let code: string | undefined
    try {
      const body = (await res.json()) as BillingErrorDetail
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
        code = typeof detail.code === 'string' ? detail.code : undefined
      }
    } catch {
      /* ignore */
    }
    if (code === 'use_customer_portal') {
      throw new BillingUseCustomerPortalError(message)
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
  options?: CheckoutSessionOptions,
): Promise<string> {
  const body: Record<string, string> = { plan }
  if (options?.successUrl?.trim()) {
    body.success_url = options.successUrl.trim()
  }
  if (options?.cancelUrl?.trim()) {
    body.cancel_url = options.cancelUrl.trim()
  }
  const res = await apiPostJson('/billing/checkout-session', getToken, body, {}, tenantId)
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

export function paymentPendingCancelUrl(): string {
  return `${window.location.origin}/payment-pending`
}

export type BillingInvoice = {
  id: string
  number: string | null
  status: string
  amount_cents: number
  currency: string
  created_at: string
  hosted_invoice_url: string | null
}

export type BillingOverview = {
  current_period_start: string | null
  current_period_end: string | null
  plan_amount_cents: number | null
  currency: string | null
  users_used: number
  users_limit: number | null
  invoices: BillingInvoice[]
}

export async function fetchBillingOverview(
  getToken: GetTokenFn,
  tenantId: string,
): Promise<BillingOverview> {
  const res = await apiFetch('/billing/overview', getToken, {}, tenantId)
  if (!res.ok) {
    throw new Error('Unable to load billing overview.')
  }
  return (await res.json()) as BillingOverview
}
