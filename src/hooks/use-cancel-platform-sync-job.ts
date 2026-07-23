import { useAuth } from '@clerk/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import {
  GLOBAL_ACTIVITY_MELI_SYNC_ID,
  GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID,
  useGlobalActivity,
} from '@/shell/providers/global-activity-provider'

export function useCancelPlatformSyncJob() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()
  const { lang } = useLanguage()
  const { removeActivity } = useGlobalActivity()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiFetch(
        `/catalog/jobs/${jobId}/cancel`,
        (a) => getToken(a),
        { method: 'POST' },
        tenantId,
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || res.statusText)
      }
      return res.json() as Promise<unknown>
    },
    onSuccess: (_data, jobId) => {
      removeActivity(GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID)
      removeActivity(GLOBAL_ACTIVITY_MELI_SYNC_ID)
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      void queryClient.invalidateQueries({ queryKey: ['catalog', 'jobs', jobId, tenantId] })
      toast.success(shellT(lang, 'platformSyncCancelSuccess'))
    },
    onError: () => {
      toast.error(shellT(lang, 'platformSyncCancelFailed'))
    },
  })
}
