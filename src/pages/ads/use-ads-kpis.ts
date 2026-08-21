import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'

export type AdsKpisResponse = {
  spend: number
  attributed_sales: number
  attributed_conversions: number
  impressions: number
  clicks: number
  roas: number | null
  break_even_roas: number | null
  tacos: number | null
  cpa: number | null
  currency: string
  fx_incomplete: boolean
  case_c: boolean
}

export type AdsChannelRow = {
  platform: string
  connection_id: string | null
  linked_commerce_connection_id: string | null
  spend: number
  attributed_sales: number
  attributed_conversions: number
  impressions: number
  clicks: number
  roas: number | null
  tacos: number | null
  cpa: number | null
  fx_incomplete: boolean
}

export type AdsChannelsResponse = {
  items: AdsChannelRow[]
  currency: string
}

function connectionQuery(ids: string[]): string {
  return ids.map((id) => `connection_ids=${encodeURIComponent(id)}`).join('&')
}

export function useAdsKpis(params: {
  connectionIds: string[]
  startDate: string
  endDate: string
  enabled?: boolean
}) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { connectionIds, startDate, endDate, enabled = true } = params
  return useQuery({
    queryKey: ['ads', 'kpis', tenantId, connectionIds.join(','), startDate, endDate],
    enabled: enabled && Boolean(tenantId) && connectionIds.length > 0,
    queryFn: async (): Promise<AdsKpisResponse> => {
      const qs = `${connectionQuery(connectionIds)}&start_date=${startDate}&end_date=${endDate}`
      const res = await apiFetch(`/ads/kpis?${qs}`, (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as AdsKpisResponse
    },
  })
}

export function useAdsChannels(params: {
  connectionIds: string[]
  startDate: string
  endDate: string
  enabled?: boolean
}) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { connectionIds, startDate, endDate, enabled = true } = params
  return useQuery({
    queryKey: ['ads', 'channels', tenantId, connectionIds.join(','), startDate, endDate],
    enabled: enabled && Boolean(tenantId) && connectionIds.length > 0,
    queryFn: async (): Promise<AdsChannelsResponse> => {
      const qs = `${connectionQuery(connectionIds)}&start_date=${startDate}&end_date=${endDate}`
      const res = await apiFetch(`/ads/channels?${qs}`, (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as AdsChannelsResponse
    },
  })
}

export type AdsSeriesPoint = {
  date: string
  spend: number
  attributed_sales: number
  attributed_conversions: number
  impressions: number
  clicks: number
}

export type AdsSeriesResponse = {
  currency: string
  fx_incomplete: boolean
  points: AdsSeriesPoint[]
}

export function useAdsSeries(params: {
  connectionIds: string[]
  startDate: string
  endDate: string
  enabled?: boolean
}) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { connectionIds, startDate, endDate, enabled = true } = params
  return useQuery({
    queryKey: ['ads', 'series', tenantId, connectionIds.join(','), startDate, endDate],
    enabled: enabled && Boolean(tenantId) && connectionIds.length > 0,
    queryFn: async (): Promise<AdsSeriesResponse> => {
      const qs = `${connectionQuery(connectionIds)}&start_date=${startDate}&end_date=${endDate}`
      const res = await apiFetch(`/ads/series?${qs}`, (a) => getToken(a), {}, tenantId)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      return (await res.json()) as AdsSeriesResponse
    },
  })
}
