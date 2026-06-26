import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/react'

import { useCurrentTenant } from '@/auth/hooks'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { apiFetch } from '@/lib/api'
import type { PlatformConnection } from '@/lib/types/connectors'
import { FilterComboboxMulti } from '@/ui/filters/filter-combobox-multi'
import type { FilterOption } from '@/ui/filters/types'

import {
  PRODUCT_STOCK_ALERT_FILTER_LEVELS,
  type ProductsListFiltersState,
} from './products-list-filter-state'
import { stockAlertFilterOptionLabel } from './products-stock-alert-filter-labels'

type ProductsListFiltersProps = {
  filters: ProductsListFiltersState
  onFiltersChange: (patch: Partial<ProductsListFiltersState>) => void
  t: (key: ShellStringKey) => string
}

export function ProductsListFilters({ filters, onFiltersChange, t }: ProductsListFiltersProps) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  const connectionsQuery = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as PlatformConnection[]
    },
  })

  const statusOptions = useMemo(
    (): FilterOption[] => [
      { value: 'active', label: t('productsStatusActive') },
      { value: 'inactive', label: t('productsStatusInactive') },
    ],
    [t],
  )

  const alertOptions = useMemo(
    (): FilterOption[] =>
      PRODUCT_STOCK_ALERT_FILTER_LEVELS.map((level) => ({
        value: level,
        label: stockAlertFilterOptionLabel(t, level),
      })),
    [t],
  )

  const platformOptions = useMemo((): FilterOption[] => {
    const connections = connectionsQuery.data ?? []
    const seen = new Set<string>()
    const options: FilterOption[] = []
    for (const connection of connections) {
      const slug = connection.platform.trim().toLowerCase()
      if (!slug || seen.has(slug)) continue
      seen.add(slug)
      const ui = INTEGRATION_UI[slug]
      options.push({
        value: slug,
        label: ui?.nameKey != null ? t(ui.nameKey) : slug,
      })
    }
    return options.sort((a, b) => a.label.localeCompare(b.label))
  }, [connectionsQuery.data, t])

  return (
    <div className="flex flex-wrap items-end gap-3">
      <FilterComboboxMulti
        label={t('productsColStatus')}
        options={statusOptions}
        values={filters.statuses}
        onValuesChange={(statuses) => onFiltersChange({ statuses })}
        searchPlaceholder={t('filterSearch')}
        emptyLabel={t('filterComingSoon')}
        clearAriaLabel={t('filterClear')}
        selectAllLabel={t('homeFilterSelectAll')}
        deselectAllLabel={t('homeFilterDeselectAll')}
      />
      <FilterComboboxMulti
        label={t('productsDetailListingColAlert')}
        options={alertOptions}
        values={filters.stockAlertLevels}
        onValuesChange={(stockAlertLevels) => onFiltersChange({ stockAlertLevels })}
        searchPlaceholder={t('filterSearch')}
        emptyLabel={t('filterComingSoon')}
        clearAriaLabel={t('filterClear')}
        selectAllLabel={t('homeFilterSelectAll')}
        deselectAllLabel={t('homeFilterDeselectAll')}
      />
      <FilterComboboxMulti
        label={t('productsColChannels')}
        options={platformOptions}
        values={filters.platforms}
        onValuesChange={(platforms) => onFiltersChange({ platforms })}
        searchPlaceholder={t('homeFilterChannelsSearch')}
        emptyLabel={t('homeFilterChannelsEmpty')}
        clearAriaLabel={t('filterClear')}
        selectAllLabel={t('homeFilterSelectAll')}
        deselectAllLabel={t('homeFilterDeselectAll')}
        loading={connectionsQuery.isLoading}
        loadingLabel={t('filterComingSoon')}
      />
    </div>
  )
}
