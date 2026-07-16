import type { ReactNode } from 'react'

import authBrandBg from '@/assets/img/alenna-bg-fade-vertical.png'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { AlennaLogo } from '@/ui/alenna-logo'
import { cn } from '@/lib/utils'

type AuthShellProps = {
  children: ReactNode
  headlineKey?: ShellStringKey
  supportingKey?: ShellStringKey
  /** Page mesh gradient — login only. */
  atmosphere?: boolean
}

export function AuthShell({
  children,
  headlineKey = 'authLoginHeadline',
  supportingKey = 'authLoginSupporting',
  atmosphere = false,
}: AuthShellProps) {
  const { lang } = useLanguage()
  const t = (key: ShellStringKey) => shellT(lang, key)

  return (
    <main
      className={cn(
        'auth-split-shell relative flex min-h-dvh w-full',
        atmosphere ? 'auth-login-shell' : 'bg-white',
      )}
    >
      <div className="relative z-10 flex min-h-dvh w-full flex-col lg:grid lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:gap-6 lg:p-6 xl:gap-8 xl:p-8">
        <section
          className="auth-split-brand relative flex min-h-[220px] shrink-0 flex-col justify-between overflow-hidden sm:min-h-[260px] lg:min-h-0 lg:rounded-2xl"
          style={{ backgroundImage: `url(${authBrandBg})` }}
        >
          <div className="auth-split-brand-scrim pointer-events-none absolute inset-0" aria-hidden />
          <div className="auth-split-gutter relative z-10 flex h-full flex-col justify-between py-7 sm:py-8 lg:py-10 xl:py-12">
            <AlennaLogo
              variant="onDark"
              className="h-8 w-auto max-w-[9.5rem] shrink-0 object-contain object-left sm:h-9"
            />
            <div className="mt-10 max-w-xl sm:mt-12 lg:mt-0">
              <h1 className="text-[1.65rem] font-semibold leading-[1.15] tracking-[-0.03em] text-white sm:text-[1.9rem] xl:text-[2.35rem]">
                {t(headlineKey)}
              </h1>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/88 sm:mt-4 sm:text-[15px] xl:text-[16px]">
                {t(supportingKey)}
              </p>
            </div>
          </div>
        </section>

        <section className="auth-split-form relative z-10 -mt-5 flex flex-1 flex-col rounded-t-[28px] bg-white pb-10 pt-8 sm:-mt-6 sm:pt-9 lg:mt-0 lg:items-center lg:justify-center lg:rounded-none lg:py-8">
          <div className="auth-split-gutter mx-auto w-full min-w-0 max-w-[420px] motion-safe:animate-[boot-card-enter_0.55s_ease-out_both]">
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
