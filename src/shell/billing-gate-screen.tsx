import type { ReactNode } from 'react'

import { shellT } from '@/lib/i18n/shell-strings'
import { supportEmail, supportMailto } from '@/lib/support-email'
import { useLanguage } from '@/shell/providers/language-provider'
import { AlennaLogo } from '@/ui/alenna-logo'

type BillingGateScreenProps = {
  title: string
  description: string
  actions: ReactNode
  footer?: ReactNode
}

export function BillingGateScreen({
  title,
  description,
  actions,
  footer,
}: BillingGateScreenProps) {
  const { lang } = useLanguage()
  const email = supportEmail()
  const helpTemplate = shellT(lang, 'billingGateHelp', { email: '__EMAIL__' })
  const [helpBefore, helpAfter = ''] = helpTemplate.split('__EMAIL__')

  return (
    <main className="relative flex min-h-dvh w-full flex-col bg-white">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center px-6 py-5 sm:px-8 sm:py-6">
        <AlennaLogo className="pointer-events-auto h-5 w-auto max-w-[8.5rem] object-contain object-left" />
      </header>

      <div className="flex min-h-dvh w-full flex-col items-center justify-center px-6 text-center">
        <div className="flex w-full max-w-md flex-col items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{title}</h1>
          <p className="text-sm leading-relaxed text-neutral-500">{description}</p>
          <p className="text-sm leading-relaxed text-neutral-500">
            {helpBefore}
            <a
              href={supportMailto()}
              className="font-medium text-neutral-700 underline underline-offset-2 hover:text-text-primary"
            >
              {email}
            </a>
            {helpAfter}
          </p>
          <div className="mt-4 flex w-full flex-row flex-wrap items-center justify-center gap-3">
            {actions}
          </div>
        </div>
      </div>

      {footer ? (
        <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-8 sm:pb-10">
          {footer}
        </div>
      ) : null}
    </main>
  )
}
