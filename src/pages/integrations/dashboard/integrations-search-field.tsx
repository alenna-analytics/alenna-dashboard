import { Search, X } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
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
    <div className="relative w-72 shrink-0">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-7 border-border-default bg-white pl-8 text-xs placeholder:text-xs focus-visible:border-border-emphasis focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {value.trim() ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute top-1/2 right-0.5 z-10 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={shellT(lang, 'productsSearchClearAria')}
          onClick={() => onChange('')}
        >
          <X className="size-4 shrink-0" aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}
