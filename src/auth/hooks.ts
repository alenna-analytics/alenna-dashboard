import { useAuth, useUser } from '@clerk/react'
import { apiFetch, apiPostJson, type GetTokenFn } from '../lib/api'

export type TenantSummary = {
  tenant_id: string
  name: string
  role: string
  role_name: string
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
    const data = (await res.json()) as {
      tenant_id: string
      tenant_name: string
      role: string
      role_name: string
    }
    if (!user) {
      return
    }
    const nextMeta: Record<string, unknown> = {
      ...(user.publicMetadata as Record<string, unknown>),
      active_tenant_id: data.tenant_id,
      active_role: data.role,
    }
    await user.update({ publicMetadata: nextMeta } as Parameters<typeof user.update>[0])
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
