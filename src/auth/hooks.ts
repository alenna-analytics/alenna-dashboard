import { useAuth, useUser } from '@clerk/react'
import { apiFetch, apiPostJson, type GetTokenFn } from '../lib/api'

export type TenantSummary = {
  tenant_id: string
  name: string
  plan: string
  role: string
  role_name: string
  base_currency: string
  fx_mxn_per_usd: string
}

export function useCurrentUser() {
  const { user, isLoaded, isSignedIn } = useUser()
  return { user, isLoaded, isSignedIn }
}

export function useCurrentTenant() {
  const { user } = useUser()
  const meta = user?.publicMetadata as Record<string, unknown> | undefined
  const tid = meta?.active_tenant_id
  const role = meta?.active_role
  return {
    tenantId: typeof tid === 'string' ? tid : null,
    role: typeof role === 'string' ? role : null,
  }
}

export function useTenantSwitcher() {
  const { user } = useUser()
  const { getToken } = useAuth()

  const switchTenant = async (tenantId: string) => {
    const gt: GetTokenFn = (args) => getToken(args)
    const res = await apiPostJson('/me/active-tenant', gt, {
      tenant_id: tenantId,
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(t || res.statusText)
    }
    await res.json() as {
      tenant_id: string
      tenant_name: string
      role: string
      role_name: string
    }
    if (!user) {
      return
    }
    // public_metadata is updated by the API (Clerk Backend API); client user.update(publicMetadata) returns 422 on API v2025+.
    await user.reload()
    await getToken({ skipCache: true })
  }

  return { switchTenant }
}

export async function fetchMyTenants(getToken: GetTokenFn): Promise<TenantSummary[]> {
  const res = await apiFetch('/me/tenants', getToken)
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
  return (await res.json()) as TenantSummary[]
}
