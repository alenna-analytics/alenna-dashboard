import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'

type ComingSoonPageProps = {
  titleKey: ShellStringKey
  descriptionKey?: ShellStringKey
}

export function ComingSoonPage({ titleKey, descriptionKey }: ComingSoonPageProps) {
  const { lang } = useLanguage()
  const t = (key: ShellStringKey) => shellT(lang, key)

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
        {t('comingSoonBadge')}
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-text-primary">{t(titleKey)}</h1>
      <p className="mt-3 max-w-md text-sm text-text-secondary">
        {t(descriptionKey ?? 'comingSoonPageBody')}
      </p>
    </div>
  )
}
