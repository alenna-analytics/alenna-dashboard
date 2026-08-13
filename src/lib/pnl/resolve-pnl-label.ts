import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { PNL_ROW_IDS, PNL_ROW_LABEL_KEYS, PNL_SHELL_KEY_TO_ROW } from '@/lib/pnl/pnl-label-keys'
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

export function resolvePnlAwareShellLabel(
  key: ShellStringKey,
  locale: PnlLabelLocale,
  t: (key: ShellStringKey) => string,
  overrides: PnlLabelOverridesApi | undefined,
): string {
  const rowId = PNL_SHELL_KEY_TO_ROW[key]
  if (!rowId) return t(key)
  return resolvePnlLabel(rowId, locale, t, overrides)
}

export function normalizePnlLabelOverrides(overrides: PnlLabelOverridesApi): PnlLabelOverridesApi {
  const normalized: PnlLabelOverridesApi = {}
  for (const rowId of PNL_ROW_IDS) {
    const locales = overrides[rowId]
    if (!locales) continue
    const cleaned: Partial<Record<PnlLabelLocale, string>> = {}
    const es = locales.es?.trim()
    const en = locales.en?.trim()
    if (es) cleaned.es = es
    if (en) cleaned.en = en
    if (Object.keys(cleaned).length > 0) normalized[rowId] = cleaned
  }
  return normalized
}

export function serializePnlLabelOverrides(overrides: PnlLabelOverridesApi): string {
  return JSON.stringify(normalizePnlLabelOverrides(overrides))
}
