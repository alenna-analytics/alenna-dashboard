import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'

type SettlementCompletenessBadgeProps = {
  completeness: string
  t: (key: ShellStringKey) => string
  className?: string
}

function labelKey(completeness: string): ShellStringKey {
  const c = completeness.trim().toLowerCase()
  if (c === 'full') return 'settlementCompletenessFull'
  if (c === 'partial') return 'settlementCompletenessPartial'
  return 'settlementCompletenessUnavailable'
}

export function SettlementCompletenessBadge({
  completeness,
  t,
  className,
}: SettlementCompletenessBadgeProps) {
  const c = completeness.trim().toLowerCase()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        c === 'full' &&
          'border-[color:color-mix(in_srgb,var(--country-green-base)_24%,transparent)] bg-[color-mix(in_srgb,var(--country-green-base)_14%,transparent)] text-[var(--country-green-base)]',
        c === 'partial' &&
          'border-[color:color-mix(in_srgb,var(--status-amber-600)_24%,transparent)] bg-[color-mix(in_srgb,var(--status-amber-600)_14%,transparent)] text-[var(--status-amber-600)]',
        c !== 'full' &&
          c !== 'partial' &&
          'border-border-default bg-muted text-text-secondary',
        className,
      )}
    >
      {t(labelKey(completeness))}
    </span>
  )
}
