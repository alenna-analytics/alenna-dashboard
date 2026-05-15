import { SignIn } from '@clerk/react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'
import { AlennaLogo } from '@/ui/alenna-logo'

const signInAppearance = {
  variables: {
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: 'var(--text-primary)',
    colorText: 'var(--text-primary)',
    colorTextSecondary: 'var(--text-secondary)',
    colorPrimary: 'var(--brand)',
    colorDanger: 'var(--danger)',
    colorSuccess: 'var(--success)',
    borderRadius: '14px',
  },
  elements: {
    rootBox: 'auth-login-clerk-shell clerk-signin-light w-full max-w-full',
    card: 'border-0 bg-transparent shadow-none backdrop-blur-none',
    cardBox: 'shadow-none',
    headerTitle:
      'text-[color:var(--text-primary)] text-[1.4rem] font-semibold tracking-[-0.02em]',
    headerSubtitle: '!text-neutral-600 text-[0.95rem] leading-relaxed mt-1',
    socialButtonsBlockButtonText: 'text-[color:var(--text-primary)] text-[14px] font-medium',
    socialButtonsBlockButton:
      '!min-h-11 !rounded-[14px] border border-neutral-200 bg-white text-[color:var(--text-primary)] hover:bg-neutral-50',
    socialButtonsBlockButtonArrow: 'text-[color:var(--text-secondary)]',
    dividerLine: 'bg-neutral-300/45',
    dividerText: 'text-neutral-500 text-[13px]',
    formFieldLabel: 'text-[color:var(--text-primary)] text-[13px] font-medium mb-1.5',
    formButtonPrimary:
      '!min-h-[46px] !rounded-[14px] !py-0 !text-[14px] font-semibold !shadow-none transition-[filter,transform] duration-200 hover:!brightness-[1.05] hover:!-translate-y-px active:!translate-y-0',
    formFieldInput:
      '!min-h-[46px] !rounded-[14px] border border-neutral-200 bg-white text-[color:var(--text-primary)] placeholder:text-neutral-400',
    formFieldInputShowPasswordButton:
      'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]',
    formResendCodeLink: 'text-[color:var(--brand)] hover:text-[color:var(--brand-light)]',
    footerActionText: 'text-neutral-600 text-[14px]',
    footerActionLink: 'text-[color:var(--brand)] hover:text-[color:var(--brand-light)] font-medium',
    identityPreviewText: 'text-[color:var(--text-primary)]',
    identityPreviewEditButton:
      'text-[color:var(--brand)] hover:text-[color:var(--brand-light)]',
    footer: '!pb-0',
  },
}

export function AuthLoginPage() {
  const { lang } = useLanguage()
  const t = (key: ShellStringKey) => shellT(lang, key)

  return (
    <div className="relative z-10 mx-auto w-full max-w-[1080px]">
      <div className="flex flex-col gap-14 lg:grid lg:grid-cols-[1fr_minmax(0,420px)] lg:items-center lg:gap-x-16 lg:gap-y-0 xl:gap-x-20">
        <div className="flex max-w-lg flex-col [--auth-editorial-shadow:0_2px_28px_rgba(0,0,0,0.22)]">
          <AlennaLogo
            variant="atmospheric"
            className="h-9 w-auto max-w-[10rem] object-contain object-left opacity-[0.96]"
          />
          <h1
            className="mt-10 text-[1.65rem] font-semibold leading-snug tracking-[-0.03em] text-white drop-shadow-[var(--auth-editorial-shadow)] sm:text-[1.85rem] lg:text-[2rem]"
          >
            {t('authLoginHeadline')}
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/78 drop-shadow-[0_1px_18px_rgba(0,0,0,0.18)]">
            {t('authLoginSupporting')}
          </p>
        </div>

        <div className="flex w-full justify-center lg:justify-end">
          <div className="relative w-full max-w-[400px] motion-safe:animate-[boot-card-enter_0.65s_ease-out_both]">
            <SignIn appearance={signInAppearance} forceRedirectUrl="/dashboard" />
          </div>
        </div>
      </div>
    </div>
  )
}
