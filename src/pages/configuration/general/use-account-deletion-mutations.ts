import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'

import { apiPostJson } from '@/lib/api'
import type { AccountDeletionStatusResponse } from '@/lib/types/me-types'
import { useCurrentTenant } from '@/auth/hooks'

export function useDeleteAccountMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async (): Promise<AccountDeletionStatusResponse> => {
      const res = await apiPostJson(
        '/me/account-deletion',
        (args) => getToken(args),
        {},
        {},
        tenantId,
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Request failed')
      }
      return (await res.json()) as AccountDeletionStatusResponse
    },
  })
}

export function useCancelAccountDeletionMutation() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async (): Promise<AccountDeletionStatusResponse> => {
      const res = await apiPostJson(
        '/me/account-deletion/cancel',
        (args) => getToken(args),
        {},
        {},
        tenantId,
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Request failed')
      }
      return (await res.json()) as AccountDeletionStatusResponse
    },
  })
}
