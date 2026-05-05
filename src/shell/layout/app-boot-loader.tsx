import { useLanguage } from '@/shell/providers/language-provider'
import { shellT } from '@/lib/i18n/shell-strings'
import { BootSpinner } from '@/ui/boot-spinner'

export function AppBootLoader() {
  const { lang } = useLanguage()
  const srStatus = shellT(lang, 'bootLoadingWorkspace')

  return (
    <div
      className="flex min-h-svh flex-col bg-[var(--bg-base)] motion-safe:animate-[boot-loader-enter_0.35s_ease-out]"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{srStatus}</span>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <BootSpinner />
      </div>

      <p className="pb-10 text-center text-sm font-medium tracking-tight text-text-secondary">
        {shellT(lang, 'bootBrandName')}
      </p>
    </div>
  )
}
