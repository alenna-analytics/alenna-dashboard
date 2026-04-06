import { useAuth } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch, apiPostJson } from '@/lib/api'
import type { PlatformConnection, ShopifySyncResponse } from '@/lib/connectors-types'

async function fetchJson<T>(
  path: string,
  getToken: (a?: { skipCache?: boolean }) => Promise<string | null>,
  tenantId: string | null,
): Promise<T> {
  const res = await apiFetch(path, getToken, {}, tenantId)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.json() as Promise<T>
}

export function useConnectorsList() {
  const { getToken } = useAuth()
  const { tenantId, role } = useCurrentTenant()

  return useQuery<PlatformConnection[]>({
    queryKey: ['connectors', tenantId],
    queryFn: () => fetchJson<PlatformConnection[]>('/connectors', (a) => getToken(a), tenantId),
    enabled: Boolean(tenantId && role),
  })
}

export function useShopifyAuthorizationUrl() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  return useMutation({
    mutationFn: async (shop: string) => {
      const q = new URLSearchParams({ shop: shop.trim() })
      const res = await apiFetch(`/connectors/shopify/authorization-url?${q}`, (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || res.statusText)
      }
      return (await res.json()) as { url: string }
    },
  })
}

export function useShopifySync() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async (body: {
      start_date?: string | null
      end_date?: string | null
      full?: boolean
    }) => {
      const res = await apiPostJson('/connectors/shopify/sync', (a) => getToken(a), {
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        full: body.full ?? false,
      }, {}, tenantId)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || res.statusText)
      }
      return (await res.json()) as ShopifySyncResponse
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
    },
  })
}

export function useShopifyDisconnect() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const { tenantId } = useCurrentTenant()

  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/connectors/shopify', (a) => getToken(a), { method: 'DELETE' }, tenantId)
      if (!res.ok && res.status !== 204) {
        const text = await res.text()
        throw new Error(text || res.statusText)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['connectors', tenantId] })
    },
  })
}
