import type { GetTokenFn } from '@/lib/api/client'
import { apiPatchJson } from '@/lib/api/client'
import type { MeResponse } from '@/lib/types/me-types'

export type WorkspacePatch = {
  name?: string
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
