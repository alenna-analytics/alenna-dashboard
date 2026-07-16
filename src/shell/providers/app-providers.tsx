import type { ReactNode } from 'react'

import { ClerkLocalizedProvider } from '@/shell/providers/clerk-localized-provider'
import { LanguageProvider } from '@/shell/providers/language-provider'
import { QueryProvider } from '@/shell/providers/query-provider'
import { ThemeProvider } from '@/shell/providers/theme-provider'
import { AppToaster } from '@/ui/app-toaster'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ClerkLocalizedProvider>
          <QueryProvider>
            {children}
            <AppToaster />
          </QueryProvider>
        </ClerkLocalizedProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
