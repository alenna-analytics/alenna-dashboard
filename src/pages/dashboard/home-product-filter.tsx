import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import type { ProductListResponse } from '@/lib/types/catalog'
import { FilterComboboxMulti } from '@/ui/filters/filter-combobox-multi'
import type { FilterOption } from '@/ui/filters/types'

type Props = {
  values: string[]
  onValuesChange: (values: string[]) => void
  label: string
  applyLabel: string
  searchPlaceholder: string
  emptyLabel: string
  selectAllLabel: string
  deselectAllLabel: string
  selectAllContainingLabel: string
  deselectAllContainingLabel: string
  allContainingSummaryLabel: string
  triggerClassName?: string
}

const FETCH_LIMIT = 200

/**
 * Product picker for the home page filter row.
 *
 * Backed by `GET /catalog/products?q=...&limit=50`. Server-side search is
 * mandatory because tenants can have thousands of products; pre-loading
 * the catalog into memory would balloon initial JS payload and break
 * the existing combobox's local filter at scale.
 *
 * Debounced 250ms to keep keystrokes responsive without firing a fetch
 * per character. The persisted `value` is rendered as a fallback option
 * (`selectedTitle`) so a stale id from `localStorage` still shows a
 * label rather than a bare UUID until the user opens the picker.
 */
export function HomeProductFilter({
  values,
  onValuesChange,
  label,
  applyLabel,
  searchPlaceholder,
  emptyLabel,
  selectAllLabel,
  deselectAllLabel,
  selectAllContainingLabel,
  deselectAllContainingLabel,
  allContainingSummaryLabel,
  triggerClassName,
}: Props) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  const [catalogFetchEnabled, setCatalogFetchEnabled] = useState(() => values.length > 0)
  useEffect(() => {
    if (values.length > 0) setCatalogFetchEnabled(true)
  }, [values.length])

  const { data, isFetching } = useQuery({
    queryKey: ['catalog', 'product-options', tenantId],
    enabled: Boolean(tenantId && catalogFetchEnabled),
    queryFn: async (): Promise<ProductListResponse> => {
      const sortBase = {
        sort_by: 'title',
        sort_dir: 'asc',
      }
      let offset = 0
      let total = 0
      const items: ProductListResponse['items'] = []
      do {
        const params = new URLSearchParams({
          ...sortBase,
          limit: String(FETCH_LIMIT),
          offset: String(offset),
        })
        const res = await apiFetch(
          `/catalog/products?${params}`,
          (a) => getToken(a),
          {},
          tenantId,
        )
        if (!res.ok) throw new Error(await res.text())
        const page = (await res.json()) as ProductListResponse
        total = page.total
        items.push(...page.items)
        offset += page.items.length
        if (page.items.length === 0) break
      } while (offset < total)

      return {
        items,
        total: items.length,
        limit: items.length,
        offset: 0,
        base_currency: items[0]?.currency || 'MXN',
      }
    },
  })

  const options = useMemo<FilterOption[]>(() => {
    const items = data?.items ?? []
    return items.map((p) => ({
      value: p.id,
      label: p.title,
    }))
  }, [data])

  return (
    <FilterComboboxMulti
      label={label}
      options={options}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setCatalogFetchEnabled(true)
      }}
      values={values}
      onValuesChange={onValuesChange}
      applyLabel={applyLabel}
      searchPlaceholder={searchPlaceholder}
      emptyLabel={emptyLabel}
      loading={isFetching}
      showSelectAllContainingToggle
      selectAllLabel={selectAllLabel}
      deselectAllLabel={deselectAllLabel}
      selectAllContainingLabel={selectAllContainingLabel}
      deselectAllContainingLabel={deselectAllContainingLabel}
      allContainingSummaryLabel={allContainingSummaryLabel}
      triggerClassName={triggerClassName}
    />
  )
}
