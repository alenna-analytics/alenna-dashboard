import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { BootSpinner } from '@/ui/boot-spinner'

export function AppBootLoader() {
  const { lang } = useLanguage()
  const srStatus = shellT(lang, 'bootLoadingWorkspace')

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center bg-[var(--bg-base)] px-6 motion-safe:animate-[boot-loader-enter_0.35s_ease-out]"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{srStatus}</span>
      <BootSpinner />
    </div>
  )
}
