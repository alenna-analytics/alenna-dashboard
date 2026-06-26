import { todayYmd } from './product-cost-date-utils'
import type { BulkCogsApplyApiPayload, BulkCogsApplyUiMode } from './bulk-cogs/bulk-cogs-types'

export function mapCostApplyUiModeToApi(
  mode: BulkCogsApplyUiMode,
  effectiveFromDate: string,
  rangeStart: string,
  rangeEnd: string,
): BulkCogsApplyApiPayload {
  if (mode === 'range') {
    return {
      effective_from: rangeStart,
      apply_mode: 'backfill',
      effective_to: rangeEnd,
    }
  }
  const today = todayYmd()
  return {
    effective_from: mode === 'today' ? today : effectiveFromDate,
    apply_mode: 'forward',
    effective_to: null,
  }
}

export function willBulkSaveEnqueueBackfill(
  mode: BulkCogsApplyUiMode,
  effectiveFromDate: string,
): boolean {
  if (mode === 'range') return true
  if (mode === 'from_date' && effectiveFromDate < todayYmd()) return true
  return false
}
