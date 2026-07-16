import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { Language } from '@/shell/providers/language-provider'
import { AlennaLogo } from '@/ui/alenna-logo'
import { Button } from '@/ui/button'

type ServiceErrorScreenProps = {
  lang: Language | string
  titleKey?: ShellStringKey
  descriptionKey?: ShellStringKey
}

export function ServiceErrorScreen({
  lang,
  titleKey = 'shellErrorTitle',
  descriptionKey = 'shellErrorDescription',
}: ServiceErrorScreenProps) {
  return (
    <main className="relative flex min-h-dvh w-full flex-col bg-white">
      <header className="absolute inset-x-0 top-0 flex items-center px-6 py-5 sm:px-8 sm:py-6">
        <AlennaLogo className="h-5 w-auto max-w-[8.5rem] object-contain object-left" />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex w-full max-w-md flex-col items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
            {shellT(lang, titleKey)}
          </h1>
          <p className="text-sm leading-relaxed text-neutral-500">
            {shellT(lang, descriptionKey)}
          </p>
          <Button
            type="button"
            variant="accent"
            className="mt-4 min-w-44 rounded-lg px-6"
            onClick={() => window.location.reload()}
          >
            {shellT(lang, 'shellErrorRefresh')}
          </Button>
        </div>
      </div>
    </main>
  )
}
