import { Info } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import { useLanguage } from '@/shell/providers/language-provider'

export function FixtureTenantBanner() {
  const { lang } = useLanguage()

  return (
    <div
      className="border-b border-border-default bg-[var(--status-blue-50,#eff6ff)] px-4 py-2 text-sm text-text-primary"
      role="status"
    >
      <div className="mx-auto flex max-w-none items-start gap-2 lg:max-w-[1600px]">
        <Info className="mt-0.5 size-4 shrink-0 text-[var(--status-blue-600,#2563eb)]" aria-hidden />
        <p>{shellT(lang, 'fixtureTenantBannerMessage')}</p>
      </div>
    </div>
  )
}
