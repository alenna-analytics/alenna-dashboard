import { useCallback } from 'react'

import { useCurrentTenant } from '@/auth/hooks'
import { useTenantPersistedJson } from '@/hooks/use-tenant-persisted-json'
import type { SalesMetricBasis } from '@/lib/sales-metric-basis'

type SalesMetricBasisState = {
  basis: SalesMetricBasis
}

const DEFAULTS: SalesMetricBasisState = { basis: 'net' }

function parseSalesMetricBasis(raw: unknown): SalesMetricBasisState | null {
  if (!raw || typeof raw !== 'object') return null
  const basis = (raw as { basis?: unknown }).basis
  if (basis === 'net' || basis === 'gross') return { basis }
  return null
}

export function useSalesMetricBasis(): [SalesMetricBasis, (basis: SalesMetricBasis) => void] {
  const { tenantId } = useCurrentTenant()
  const [state, setPatch] = useTenantPersistedJson(
    tenantId,
    'alenna:sales-metric-basis',
    DEFAULTS,
    parseSalesMetricBasis,
  )

  const setBasis = useCallback(
    (basis: SalesMetricBasis) => {
      setPatch({ basis })
    },
    [setPatch],
  )

  return [state.basis, setBasis]
}
