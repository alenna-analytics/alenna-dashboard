import { InfoIcon } from 'lucide-react'

import { useMoney } from '@/hooks/use-money'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'

/**
 * Surface the v1 currency limitations next to KPI / reporting blocks:
 *
 * - Aggregates are computed historically in `tenant.base_currency`.
 * - When a user views in a different display currency, the conversion uses
 *   the latest FX rate (`latest_fx_for_display`) and is therefore *not*
 *   historically accurate for past periods (Option A — see plan).
 *
 * The display disclaimer is only shown when conversion is actually
 * happening; otherwise the aggregate note is enough.
 */
export function MoneyDisclaimer({ className }: { className?: string }) {
  const { lang } = useLanguage()
  const { baseCurrency, effectiveDisplayCurrency, latestFxRateDate } = useMoney()
  const isConverting = effectiveDisplayCurrency.toUpperCase() !== baseCurrency.toUpperCase()

  const aggregate = shellT(lang, 'displayCurrencyAggregateDisclaimer').replace(
    '{base}',
    baseCurrency.toUpperCase(),
  )

  const displayLine =
    isConverting && latestFxRateDate
      ? shellT(lang, 'displayCurrencyDisplayDisclaimer')
          .replace('{display}', effectiveDisplayCurrency.toUpperCase())
          .replace('{date}', latestFxRateDate)
      : null

  return (
    <p
      className={cn(
        'inline-flex max-w-3xl items-start gap-1.5 text-[11px] leading-snug text-text-tertiary',
        className,
      )}
    >
      <InfoIcon className="mt-0.5 size-3 shrink-0" aria-hidden />
      <span>
        {aggregate}
        {displayLine ? ` ${displayLine}` : ''}
      </span>
    </p>
  )
}
