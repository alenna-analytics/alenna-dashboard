import { Search } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import { Input } from '@/ui/input'

type IntegrationsSearchFieldProps = {
  lang: string
  value: string
  onChange: (value: string) => void
}

export function IntegrationsSearchField({
  lang,
  value,
  onChange,
}: IntegrationsSearchFieldProps) {
  const placeholder = shellT(lang, 'integrationsSearchPlaceholder')
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-md pl-9 pr-3"
        aria-label={placeholder}
      />
    </div>
  )
}
