import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { AlertItemApi, AlertSection, AlertSeverity } from '@/lib/types/alerts'

import { alertPlatformSlug } from './alert-display'

export type AlertSeverityFilter = AlertSeverity | 'all'

export type AlertKindFilter = 'all' | 'stock_out' | 'stock_low'

export type AlertChannelFilter = 'all' | string

export type AlertsListFilters = {
  lifecycle: AlertSection
  severity: AlertSeverityFilter
  kind: AlertKindFilter
  channel: AlertChannelFilter
}

export const DEFAULT_ALERTS_LIST_FILTERS: AlertsListFilters = {
  lifecycle: 'active',
  severity: 'all',
  kind: 'all',
  channel: 'all',
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

export function isAlertChannelSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) return false
  if (normalized.endsWith('_ads')) return false
  return INTEGRATION_UI[normalized]?.categoryKey !== 'integrationsCategoryAds'
}

export function uniqueAlertChannelSlugs(
  items: AlertItemApi[],
  connectionPlatformById: ReadonlyMap<string, string>,
): string[] {
  const slugs = new Set<string>()
  for (const platform of connectionPlatformById.values()) {
    const slug = platform.trim().toLowerCase()
    if (isAlertChannelSlug(slug)) slugs.add(slug)
  }
  for (const item of items) {
    const slug = alertPlatformSlug(item, connectionPlatformById)
    if (isAlertChannelSlug(slug)) slugs.add(slug)
  }
  return [...slugs].sort((a, b) => a.localeCompare(b))
}

export function filterAlertsByListFilters(
  items: AlertItemApi[],
  filters: AlertsListFilters,
  connectionPlatformById: ReadonlyMap<string, string>,
): AlertItemApi[] {
  const kindMatcher = ALERT_KIND_OPTIONS.find((option) => option.id === filters.kind)?.matches
  return items.filter((item) => {
    if (filters.severity !== 'all' && item.severity !== filters.severity) return false
    if (kindMatcher && !kindMatcher(item)) return false
    if (filters.channel !== 'all') {
      if (alertPlatformSlug(item, connectionPlatformById) !== filters.channel) return false
    }
    return true
  })
}

export function countActiveAlertsFilters(filters: AlertsListFilters): number {
  let count = 0
  if (filters.lifecycle !== 'active') count += 1
  if (filters.severity !== 'all') count += 1
  if (filters.kind !== 'all') count += 1
  if (filters.channel !== 'all') count += 1
  return count
}
