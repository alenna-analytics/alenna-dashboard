import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { SettlementWaterfallLine } from '@/lib/settlement-utils'

export function settlementLineLabel(
  line: SettlementWaterfallLine,
  t: (key: ShellStringKey) => string,
): string {
  if (line.key === 'net') return t('reportsNetRevenue')
  if (line.kind === 'total') return t('settlementWfTotal')
  return t(line.labelKey as ShellStringKey)
}

export function settlementLineDisplayValue(line: SettlementWaterfallLine): number {
  return line.isDeduction ? -Math.abs(line.value) : line.value
}
