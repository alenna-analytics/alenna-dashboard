import type { GetTokenFn } from '@/lib/api/client'
import { apiPatchJson } from '@/lib/api/client'
import type { MeResponse } from '@/lib/types/me-types'

export async function patchWorkspaceName(
  getToken: GetTokenFn,
  tenantId: string,
  name: string,
): Promise<MeResponse> {
  const res = await apiPatchJson('/me/workspace', getToken, { name }, {}, tenantId)
  if (!res.ok) {
    throw new Error('workspace_rename_failed')
  }
  return (await res.json()) as MeResponse
}
