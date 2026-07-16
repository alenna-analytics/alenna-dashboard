import { useMemo } from 'react'

import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import { presetDateRangeYmd } from '@/ui/date-range-picker'

export type SalesFiltersState = {
  startDate: string
  endDate: string
  connectionIds: string[]
  productIds: string[]
  v: number
}

const FILTERS_VERSION = 1
export const SALES_FILTERS_KEY = 'alenna.sales.page.filters.v1'

function parseSalesFilters(raw: unknown): SalesFiltersState | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.v !== FILTERS_VERSION) return null
  if (typeof o.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.startDate)) return null
  if (typeof o.endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.endDate)) return null
  if (!Array.isArray(o.connectionIds)) return null
  const connectionIds = o.connectionIds.filter((x): x is string => typeof x === 'string')
  const productIds = Array.isArray(o.productIds)
    ? o.productIds.filter((x): x is string => typeof x === 'string')
    : []
  return {
    startDate: o.startDate,
    endDate: o.endDate,
    connectionIds,
    productIds,
    v: FILTERS_VERSION,
  }
}

export function useSalesPageFilters(tenantId: string | null | undefined) {
  const defaultFilters = useMemo((): SalesFiltersState => {
    const { start, end } = presetDateRangeYmd('last30')
    return {
      startDate: start,
      endDate: end,
      connectionIds: [],
      productIds: [],
      v: FILTERS_VERSION,
    }
  }, [])

  return useTenantPersistedJson(
    tenantId ?? null,
    SALES_FILTERS_KEY,
    defaultFilters,
    parseSalesFilters,
  )
}
