import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { AlertItemApi, AlertSection, AlertSeverity } from '@/lib/types/alerts'

export type AlertSeverityFilter = AlertSeverity | 'all'

export type AlertKindFilter = 'all' | 'stock_out' | 'stock_low'

export type AlertsListFilters = {
  lifecycle: AlertSection
  severity: AlertSeverityFilter
  kind: AlertKindFilter
}

export const DEFAULT_ALERTS_LIST_FILTERS: AlertsListFilters = {
  lifecycle: 'active',
  severity: 'all',
  kind: 'all',
}

type AlertKindOption = {
  id: AlertKindFilter
  labelKey: ShellStringKey
  matches: (item: AlertItemApi) => boolean
}

export const ALERT_KIND_OPTIONS: AlertKindOption[] = [
  {
    id: 'all',
    labelKey: 'homeAlertsSheetFilterAll',
    matches: () => true,
  },
  {
    id: 'stock_out',
    labelKey: 'homeAlertsSheetAlertNameCritical',
    matches: (item) => item.alert_type === 'stock' && item.severity === 'critical',
  },
  {
    id: 'stock_low',
    labelKey: 'homeAlertsSheetAlertNameLow',
    matches: (item) => item.alert_type === 'stock' && item.severity === 'low',
  },
]

type AlertSeverityOption = {
  id: AlertSeverityFilter
  labelKey: ShellStringKey
}

export const ALERT_SEVERITY_OPTIONS: AlertSeverityOption[] = [
  { id: 'all', labelKey: 'homeAlertsSheetFilterAll' },
  { id: 'critical', labelKey: 'homeAlertsSheetFilterCritical' },
  { id: 'low', labelKey: 'homeAlertsSheetFilterLow' },
  { id: 'informational', labelKey: 'homeAlertsSheetFilterInfo' },
]

type AlertLifecycleOption = {
  id: AlertSection
  labelKey: ShellStringKey
}

export const ALERT_LIFECYCLE_OPTIONS: AlertLifecycleOption[] = [
  { id: 'active', labelKey: 'homeAlertsDialogActiveSection' },
  { id: 'postponed', labelKey: 'homeAlertsDialogPostponedSection' },
]

export function filterAlertsByListFilters(
  items: AlertItemApi[],
  filters: AlertsListFilters,
): AlertItemApi[] {
  const kindMatcher = ALERT_KIND_OPTIONS.find((option) => option.id === filters.kind)?.matches
  return items.filter((item) => {
    if (filters.severity !== 'all' && item.severity !== filters.severity) return false
    if (kindMatcher && !kindMatcher(item)) return false
    return true
  })
}

export function countActiveAlertsFilters(filters: AlertsListFilters): number {
  let count = 0
  if (filters.lifecycle !== 'active') count += 1
  if (filters.severity !== 'all') count += 1
  if (filters.kind !== 'all') count += 1
  return count
}
