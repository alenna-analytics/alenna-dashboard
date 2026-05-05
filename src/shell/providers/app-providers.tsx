import type { ReactNode } from 'react'

import { QueryProvider } from '@/shell/providers/query-provider'
import { ThemeProvider } from '@/shell/providers/theme-provider'
import { LanguageProvider } from '@/shell/providers/language-provider'
import { AppToaster } from '@/ui/app-toaster'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryProvider>
          {children}
          <AppToaster />
        </QueryProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
