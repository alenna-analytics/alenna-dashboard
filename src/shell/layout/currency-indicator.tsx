import { useDisplayCurrency } from '@/shell/providers/display-currency-provider'
import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'

export function CurrencyIndicator({ className }: { className?: string }) {
  const { lang } = useLanguage()
  const { effectiveDisplayCurrency } = useDisplayCurrency()
  const code = effectiveDisplayCurrency.toUpperCase()

  return (
    <span
      className={cn(
        'inline-flex h-8 items-center px-2 text-xs font-semibold tabular-nums text-text-secondary',
        className,
      )}
      aria-label={shellT(lang, 'ariaDisplayCurrency')}
    >
      {code}
    </span>
  )
}
