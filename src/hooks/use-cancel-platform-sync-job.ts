import { useAuth } from '@clerk/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { useGlobalActivity } from '@/shell/providers/global-activity-provider'

export type CancelPlatformSyncJobInput = {
  jobId: string
  activityId: string
}

export class CancelPlatformSyncJobError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function useCancelPlatformSyncJob() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const queryClient = useQueryClient()
  const { lang } = useLanguage()
  const { removeActivity } = useGlobalActivity()

  return useMutation({
    mutationFn: async ({ jobId }: CancelPlatformSyncJobInput) => {
      const res = await apiFetch(
        `/catalog/jobs/${jobId}/cancel`,
        (a) => getToken(a),
        { method: 'POST' },
        tenantId,
      )
      if (!res.ok) {
        const text = await res.text()
        throw new CancelPlatformSyncJobError(res.status, text || res.statusText)
      }
      return res.json() as Promise<unknown>
    },
    onSuccess: (_data, { jobId, activityId }) => {
      removeActivity(activityId)
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
      void queryClient.invalidateQueries({ queryKey: ['catalog', 'jobs', jobId, tenantId] })
      toast.success(shellT(lang, 'platformSyncCancelSuccess'))
    },
    onError: (error) => {
      if (error instanceof CancelPlatformSyncJobError && error.status === 403) {
        toast.error(shellT(lang, 'platformSyncCancelForbidden'))
        return
      }
      toast.error(shellT(lang, 'platformSyncCancelFailed'))
    },
  })
}
