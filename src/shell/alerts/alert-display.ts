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

export function alertChannelName(
  item: AlertItemApi,
  connectionPlatformById: ReadonlyMap<string, string>,
  t: (key: ShellStringKey) => string,
): string {
  if (item.platform?.trim()) {
    return platformDisplayName(t, item.platform)
  }
  if (item.platform_connection_id) {
    const platform = connectionPlatformById.get(item.platform_connection_id)
    if (platform) return platformDisplayName(t, platform)
  }
  return ''
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

export function alertProductChannelLine(
  item: AlertItemApi,
  channelName: string,
): string {
  const product = item.title.trim()
  const channel = channelName.trim()
  if (product && channel) return `${product} - ${channel}`
  return product || channel || item.entity_type
}

export type AlertSeverityFilter = AlertSeverity | 'all'

export function activeAlertsDisplayCount(
  criticalCount: number | undefined,
  lowCount: number | undefined,
): number {
  return (criticalCount ?? 0) + (lowCount ?? 0)
}
