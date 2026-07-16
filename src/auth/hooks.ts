import { useAuth, useUser } from '@clerk/react'
import { useCallback, useEffect, useRef } from 'react'

import { apiFetch, apiPostJson, type GetTokenFn } from '../lib/api'

export type TenantSummary = {
  tenant_id: string
  name: string
  plan: string
  role: string
  role_name: string
  base_currency: string
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
  const userRef = useRef(user)
  const getTokenRef = useRef(getToken)

  useEffect(() => {
    userRef.current = user
    getTokenRef.current = getToken
  }, [user, getToken])

  const switchTenant = useCallback(async (tenantId: string) => {
    const gt: GetTokenFn = (args) => getTokenRef.current(args)
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
    const currentUser = userRef.current
    if (!currentUser) {
      return
    }
    // public_metadata is updated by the API (Clerk Backend API); client user.update(publicMetadata) returns 422 on API v2025+.
    await currentUser.reload()
    await getTokenRef.current({ skipCache: true })
  }, [])

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

export type CreateWorkspaceResult = {
  tenant_id: string
  tenant_name: string
  role: string
  role_name: string
  base_currency: string
  plan: string
  trial_ends_at: string
}

export class WorkspaceCreatedNeedsActiveTenantError extends Error {
  tenantId: string
  constructor(tenantId: string) {
    super('Workspace created; active-tenant retry required')
    this.name = 'WorkspaceCreatedNeedsActiveTenantError'
    this.tenantId = tenantId
  }
}

export async function createWorkspace(
  getToken: GetTokenFn,
  body: { first_name: string; last_name: string; company_name: string },
): Promise<CreateWorkspaceResult> {
  const res = await apiPostJson('/me/workspaces', getToken, body)
  if (res.status === 502) {
    try {
      const payload = (await res.json()) as {
        detail?: { code?: string; tenant_id?: string; message?: string }
      }
      const tenantId = payload.detail?.tenant_id
      if (payload.detail?.code === 'clerk_metadata_sync_failed' && typeof tenantId === 'string') {
        throw new WorkspaceCreatedNeedsActiveTenantError(tenantId)
      }
    } catch (e) {
      if (e instanceof WorkspaceCreatedNeedsActiveTenantError) throw e
    }
  }
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
  return (await res.json()) as CreateWorkspaceResult
}
