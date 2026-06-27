import { useMemo } from 'react'

import type { StockRuleApi } from '@/lib/types/alert-rules'
import type { StockAlertLevel } from '@/lib/types/catalog'

import { useStockRuleQuery } from './use-alert-rules-queries'

export function effectiveStockAlertLevel(
  level: StockAlertLevel,
  rule: StockRuleApi | undefined,
): StockAlertLevel {
  if (level === 'none' || !rule) return level
  if (level === 'out' && !rule.out_of_stock_enabled) return 'none'
  if (level === 'low' && !rule.enabled) return 'none'
  return level
}

export function useStockAlertDisplayRule() {
  const { data: rule } = useStockRuleQuery()
  return rule
}

export function useEffectiveStockAlertLevel(level: StockAlertLevel): StockAlertLevel {
  const rule = useStockAlertDisplayRule()
  return useMemo(() => effectiveStockAlertLevel(level, rule), [level, rule])
}
