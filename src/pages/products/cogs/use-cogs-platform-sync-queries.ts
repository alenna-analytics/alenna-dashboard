import { useAuth } from '@clerk/react'
import { useMutation } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiPostJson } from '@/lib/api'
import type {
  CogsPlatformSyncApplyBody,
  CogsPlatformSyncApplyResponse,
  CogsPlatformSyncPreviewBody,
  CogsPlatformSyncPreviewResponse,
} from '@/lib/types/cogs-platform-sync'

async function readApiError(res: Response): Promise<string> {
  const text = await res.text()
  try {
    const parsed = JSON.parse(text) as { detail?: unknown }
    const detail = parsed.detail
    if (typeof detail === 'string') return detail
    if (detail && typeof detail === 'object' && 'message' in detail) {
      const message = (detail as { message?: unknown }).message
      if (typeof message === 'string') return message
    }
  } catch {
    /* fall through */
  }
  return text || res.statusText
}

export function useCogsPlatformSyncPreviewMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async (body: CogsPlatformSyncPreviewBody) => {
      const res = await apiPostJson(
        '/catalog/cogs-platform-sync/preview',
        (a) => getToken(a),
        body,
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await readApiError(res))
      return (await res.json()) as CogsPlatformSyncPreviewResponse
    },
  })
}

export function useCogsPlatformSyncApplyMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async (body: CogsPlatformSyncApplyBody) => {
      const res = await apiPostJson(
        '/catalog/cogs-platform-sync/apply',
        (a) => getToken(a),
        body,
        {},
        tenantId,
      )
      if (!res.ok) throw new Error(await readApiError(res))
      return (await res.json()) as CogsPlatformSyncApplyResponse
    },
  })
}

export function isDefaultSelectedRow(
  row: Pick<CogsPlatformSyncPreviewResponse['items'][number], 'diff_status' | 'platform_cost' | 'currency_mismatch'>,
): boolean {
  return (
    row.diff_status === 'different' &&
    !row.currency_mismatch &&
    row.platform_cost != null &&
    row.platform_cost > 0
  )
}
