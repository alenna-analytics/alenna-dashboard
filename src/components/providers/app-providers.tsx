import type { ReactNode } from 'react'

import { QueryProvider } from '@/components/providers/query-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { LanguageProvider } from '@/components/providers/language-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryProvider>{children}</QueryProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
