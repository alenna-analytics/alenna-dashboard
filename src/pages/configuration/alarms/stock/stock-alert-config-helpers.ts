import type { StockOverrideApi, StockRuleApi } from '@/lib/types/alert-rules'
import { connectionLabel } from '@/lib/integrations/connection-label'
import type { PlatformConnection } from '@/lib/types/connectors'

export type StockAlertConfigureKind = 'out_of_stock' | 'low_stock'

export function channelOverrides(items: StockOverrideApi[]): StockOverrideApi[] {
  return items.filter((item) => item.scope_type === 'channel')
}

export function lowStockScopedRules(items: StockOverrideApi[]): StockOverrideApi[] {
  return items.filter(
    (item) =>
      item.scope_type === 'product' ||
      item.scope_type === 'product_listing' ||
      item.scope_type === 'channel',
  )
}

export function findChannelOverride(
  items: StockOverrideApi[],
  connectionId: string,
): StockOverrideApi | undefined {
  return items.find(
    (item) => item.scope_type === 'channel' && item.platform_connection_id === connectionId,
  )
}

export function channelAlertEnabled(
  kind: StockAlertConfigureKind,
  rule: StockRuleApi,
  override: StockOverrideApi | undefined,
): boolean {
  if (kind === 'out_of_stock') {
    return override?.out_of_stock_enabled ?? rule.out_of_stock_enabled
  }
  return override?.enabled ?? rule.enabled
}

export function globalAlertEnabled(kind: StockAlertConfigureKind, rule: StockRuleApi): boolean {
  return kind === 'out_of_stock' ? rule.out_of_stock_enabled : rule.enabled
}

export function resolveStockRuleTargetLabel(
  lang: string,
  item: StockOverrideApi,
  connectionsById: Map<string, PlatformConnection>,
): string {
  if (item.platform_connection_id) {
    const connection = connectionsById.get(item.platform_connection_id)
    if (connection) {
      const friendlyChannel = connectionLabel(lang, connection)

      if (item.scope_type === 'channel') {
        return friendlyChannel
      }

      if (item.scope_type === 'product_listing') {
        const separator = ' · '
        const lastSeparatorIndex = item.scope_label.lastIndexOf(separator)
        if (lastSeparatorIndex !== -1) {
          return `${item.scope_label.slice(0, lastSeparatorIndex)}${separator}${friendlyChannel}`
        }
        return `${item.scope_label}${separator}${friendlyChannel}`
      }
    }
  }

  return item.scope_label
}
