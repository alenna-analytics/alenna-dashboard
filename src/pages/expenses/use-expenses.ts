import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch, apiPatchJson, apiPostJson } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
import type { Expense, ExpenseCreate, ExpenseUpdate } from '@/lib/types/expenses'
import { useLanguage } from '@/shell/providers/language-provider'

export function useExpenses() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { lang } = useLanguage()
  const queryClient = useQueryClient()
  const key = ['expenses', tenantId]

  const invalidateReports = () => {
    void queryClient.invalidateQueries({ queryKey: ['reports'] })
  }

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<Expense[]> => {
      const res = await apiFetch('/expenses', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as Expense[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (body: ExpenseCreate): Promise<Expense> => {
      const res = await apiPostJson('/expenses', (a) => getToken(a), body, {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as Expense
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key })
      invalidateReports()
      toast.success(shellT(lang, 'expensesToastCreated'))
    },
    onError: () => {
      toast.error(shellT(lang, 'expensesToastFailed'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }: ExpenseUpdate & { id: string }): Promise<Expense> => {
      const res = await apiPatchJson(`/expenses/${id}`, (a) => getToken(a), body, {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as Expense
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key })
      invalidateReports()
      toast.success(shellT(lang, 'expensesToastUpdated'))
    },
    onError: () => {
      toast.error(shellT(lang, 'expensesToastFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await apiFetch(
        `/expenses/${id}`,
        (a) => getToken(a),
        { method: 'DELETE' },
        tenantId,
      )
      if (!res.ok) throw new Error(await res.text())
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key })
      invalidateReports()
      toast.success(shellT(lang, 'expensesToastDeleted'))
    },
    onError: () => {
      toast.error(shellT(lang, 'expensesToastFailed'))
    },
  })

  return { query, createMutation, updateMutation, deleteMutation }
}
