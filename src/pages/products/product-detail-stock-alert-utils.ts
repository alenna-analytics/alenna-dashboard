import type { StockRuleApi } from '@/lib/types/alert-rules'
import type { AlertItemApi } from '@/lib/types/alerts'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductDetailApi, StockAlertLevel } from '@/lib/types/catalog'
import { effectiveStockAlertLevel } from '@/pages/configuration/alarms/stock/use-stock-alert-display'

import { productPlatformLabel } from './product-platform-label'
import { displayStockQuantity } from './product-stock-alert-ui'

export type ProductDetailAlertRow = {
  platformSlug: string
  platformLabel: string
  level: Extract<StockAlertLevel, 'low' | 'out'>
  stockQuantity: number | null
  listingIds: string[]
  alertIds: string[]
}

export type AlertRowsQueryState = {
  isSuccess: boolean
  isError: boolean
  isLoading: boolean
}

function alertLevelRank(level: StockAlertLevel): number {
  if (level === 'out') return 2
  if (level === 'low') return 1
  return 0
}

export function normalizeId(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase()
  return trimmed ? trimmed : null
}

export function hasSummaryStockAlerts(
  summary: ProductDetailApi['stock_alert_summary'],
  rule: StockRuleApi | undefined,
): boolean {
  for (const alert of summary ?? []) {
    const level = effectiveStockAlertLevel(alert.stock_alert, rule)
    if (level === 'low' || level === 'out') return true
  }
  return false
}

export function activeStockAlertsForProduct(
  alerts: AlertItemApi[] | undefined,
  productId: string | undefined,
  listingIds: string[],
): AlertItemApi[] {
  const normalizedProductId = normalizeId(productId)
  const listingIdSet = new Set(
    listingIds.map((id) => normalizeId(id)).filter((id): id is string => id != null),
  )

  return (alerts ?? []).filter((alert) => {
    if (alert.alert_type !== 'stock') return false
    const alertProductId = normalizeId(alert.product_id)
    if (normalizedProductId && alertProductId === normalizedProductId) return true
    const entityId = normalizeId(alert.entity_id)
    return entityId != null && listingIdSet.has(entityId)
  })
}

export function resolveAlertIdsForRow(
  activeAlerts: AlertItemApi[],
  platformSlug: string,
  listingIds: string[],
): string[] {
  const listingIdSet = new Set(
    listingIds.map((id) => normalizeId(id)).filter((id): id is string => id != null),
  )
  const matched = new Set<string>()

  for (const alert of activeAlerts) {
    const entityId = normalizeId(alert.entity_id)
    const alertPlatform = normalizeId(alert.platform)
    const matchesListing = entityId != null && listingIdSet.has(entityId)
    const matchesPlatform = alertPlatform === platformSlug
    if (matchesListing || matchesPlatform) {
      matched.add(alert.id)
    }
  }

  return Array.from(matched)
}

export function buildAlertRows(
  summary: ProductDetailApi['stock_alert_summary'],
  rule: StockRuleApi | undefined,
  activeAlerts: AlertItemApi[],
  t: (key: ShellStringKey) => string,
): ProductDetailAlertRow[] {
  const byPlatform = new Map<string, ProductDetailAlertRow>()

  for (const alert of summary ?? []) {
    const level = effectiveStockAlertLevel(alert.stock_alert, rule)
    if (level !== 'low' && level !== 'out') continue

    const platformSlug = alert.platform?.trim().toLowerCase()
    if (!platformSlug) continue

    const stockQuantity = displayStockQuantity(alert.stock_quantity)
    const existing = byPlatform.get(platformSlug)

    if (!existing || alertLevelRank(level) > alertLevelRank(existing.level)) {
      const listingIds = alert.listing_id ? [alert.listing_id] : []
      byPlatform.set(platformSlug, {
        platformSlug,
        platformLabel: productPlatformLabel(alert.platform, t),
        level,
        stockQuantity,
        listingIds,
        alertIds: resolveAlertIdsForRow(activeAlerts, platformSlug, listingIds),
      })
      continue
    }

    if (alert.listing_id && !existing.listingIds.includes(alert.listing_id)) {
      existing.listingIds.push(alert.listing_id)
    }

    if (
      existing.level === level
      && stockQuantity != null
      && (existing.stockQuantity == null || stockQuantity < existing.stockQuantity)
    ) {
      existing.stockQuantity = stockQuantity
    }

    existing.alertIds = resolveAlertIdsForRow(activeAlerts, platformSlug, existing.listingIds)
  }

  return Array.from(byPlatform.values()).sort((a, b) => {
    const levelDiff = alertLevelRank(b.level) - alertLevelRank(a.level)
    if (levelDiff !== 0) return levelDiff
    return a.platformLabel.localeCompare(b.platformLabel)
  })
}

export function filterVisibleAlertRows(
  rows: ProductDetailAlertRow[],
  queryState: AlertRowsQueryState,
): ProductDetailAlertRow[] {
  if (queryState.isError || queryState.isLoading || !queryState.isSuccess) return []
  return rows.filter((row) => row.alertIds.length > 0)
}

export function alertRowKey(row: ProductDetailAlertRow): string {
  return `${row.level}-${row.platformSlug}`
}
