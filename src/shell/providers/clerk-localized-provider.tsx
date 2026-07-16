import { ClerkProvider } from '@clerk/react'
import { ui } from '@clerk/ui'
import { enUS, esMX } from '@clerk/localizations'
import type { ReactNode } from 'react'

import { useLanguage } from '@/shell/providers/language-provider'

export function ClerkLocalizedProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage()

  return (
    <ClerkProvider
      key={lang}
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/login"
      ui={ui}
      localization={lang === 'es' ? esMX : enUS}
    >
      {children}
    </ClerkProvider>
  )
}
