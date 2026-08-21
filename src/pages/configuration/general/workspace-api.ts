import type { GetTokenFn } from '@/lib/api/client'
import { apiPatchJson } from '@/lib/api/client'
import type { MeResponse } from '@/lib/types/me-types'

export type WorkspaceCurrencyCode = 'MXN' | 'USD'

export type WorkspacePatch = {
  name?: string
  base_currency?: WorkspaceCurrencyCode
}

export function isWorkspaceCurrencyCode(value: string): value is WorkspaceCurrencyCode {
  return value === 'MXN' || value === 'USD'
}

export async function patchWorkspace(
  getToken: GetTokenFn,
  tenantId: string,
  payload: WorkspacePatch,
): Promise<MeResponse> {
  const res = await apiPatchJson('/me/workspace', getToken, payload, {}, tenantId)
  if (!res.ok) {
    throw new Error('workspace_patch_failed')
  }
  return (await res.json()) as MeResponse
}
