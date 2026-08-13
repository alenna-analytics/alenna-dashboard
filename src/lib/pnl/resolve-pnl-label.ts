import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { PNL_ROW_LABEL_KEYS } from '@/lib/pnl/pnl-label-keys'
import type { PnlLabelLocale, PnlLabelOverridesApi } from '@/lib/types/pnl-labels'
import type { PnlRowId } from '@/pages/reports/reports-pnl-rows'

export function resolvePnlLabel(
  rowId: PnlRowId,
  locale: PnlLabelLocale,
  t: (key: ShellStringKey) => string,
  overrides: PnlLabelOverridesApi | undefined,
): string {
  const custom = overrides?.[rowId]?.[locale]?.trim()
  if (custom) return custom
  return t(PNL_ROW_LABEL_KEYS[rowId])
}
