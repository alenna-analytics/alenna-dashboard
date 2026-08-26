import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { AlertItemApi, AlertSeverity } from '@/lib/types/alerts'
import { formatPlatformSlug } from '@/pages/products/product-detail-range'

export function platformDisplayName(
  t: (key: ShellStringKey) => string,
  platformSlug: string | null | undefined,
): string {
  const slug = platformSlug?.trim().toLowerCase() ?? ''
  if (!slug) return ''
  const ui = INTEGRATION_UI[slug]
  if (ui?.nameKey != null) return t(ui.nameKey)
  return formatPlatformSlug(slug)
}

export function alertPlatformSlug(
  item: AlertItemApi,
  connectionPlatformById: ReadonlyMap<string, string>,
): string {
  const direct = item.platform?.trim().toLowerCase()
  if (direct) return direct
  if (!item.platform_connection_id) return ''
  return connectionPlatformById.get(item.platform_connection_id)?.trim().toLowerCase() ?? ''
}

export function alertChannelName(
  item: AlertItemApi,
  connectionPlatformById: ReadonlyMap<string, string>,
  t: (key: ShellStringKey) => string,
): string {
  const slug = alertPlatformSlug(item, connectionPlatformById)
  return slug ? platformDisplayName(t, slug) : ''
}

export function alertTypeName(
  t: (key: ShellStringKey) => string,
  item: Pick<AlertItemApi, 'alert_type' | 'severity'>,
): string {
  if (item.alert_type === 'stock') {
    if (item.severity === 'critical') return t('homeAlertsSheetAlertNameCritical')
    if (item.severity === 'low') return t('homeAlertsSheetAlertNameLow')
  }
  if (item.severity === 'critical') return t('homeAlertsSheetSeverityCritical')
  if (item.severity === 'low') return t('homeAlertsSheetSeverityLow')
  return t('homeAlertsSheetSeverityInformational')
}

export function alertProductTitle(item: AlertItemApi): string {
  return item.title.trim() || item.entity_type
}

export function alertProductChannelLine(
  item: AlertItemApi,
  channelName: string,
): string {
  const product = item.title.trim()
  const channel = channelName.trim()
  if (product && channel) return `${channel} · ${product}`
  return product || channel || item.entity_type
}

export type AlertSeverityFilter = AlertSeverity | 'all'

export function activeAlertsDisplayCount(
  criticalCount: number | undefined,
  lowCount: number | undefined,
): number {
  return (criticalCount ?? 0) + (lowCount ?? 0)
}
