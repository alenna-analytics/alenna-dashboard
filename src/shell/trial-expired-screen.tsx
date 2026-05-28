import { UserButton } from '@clerk/react'

import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { buttonVariants } from '@/ui/button'
import { cn } from '@/lib/utils'

const UPGRADE_MAILTO = 'mailto:support@alenna.io?subject=Upgrade%20plan'

export function TrialExpiredScreen() {
  const { lang } = useLanguage()
  const t = (key: ShellStringKey) => shellT(lang, key)

  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--bg-base)] p-6">
      <div className="w-full max-w-md rounded-md border border-[var(--shell-structure-border)] bg-white p-8 text-center shadow-[var(--shadow-ink-sm)]">
        <h1 className="text-xl font-semibold text-text-primary">{t('trialExpiredTitle')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{t('trialExpiredBody')}</p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <a href={UPGRADE_MAILTO} className={cn(buttonVariants())}>
            {t('trialExpiredCta')}
          </a>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>{t('trialExpiredSignOut')}</span>
            <UserButton />
          </div>
        </div>
      </div>
    </div>
  )
}
