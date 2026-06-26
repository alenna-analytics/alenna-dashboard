import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, toggleLang } = useLanguage()

  return (
    <button
      type="button"
      className={cn(
        'inline-flex size-8 items-center justify-center rounded text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
        className,
      )}
      onClick={toggleLang}
      aria-label={shellT(lang, 'ariaSwitchLanguage')}
    >
      {lang.toUpperCase()}
    </button>
  )
}
