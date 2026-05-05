import { Plug } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'

type IntegrationsEmptyStateProps = {
  lang: string
  onExplore: () => void
}

export function IntegrationsEmptyState({
  lang,
  onExplore,
}: IntegrationsEmptyStateProps) {
  return (
    <div className="animate-in fade-in duration-300 flex flex-col items-center gap-6 rounded-md border border-border-subtle bg-muted/30 px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Plug className="size-8" aria-hidden />
      </div>
      <div className="max-w-sm space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {shellT(lang, 'integrationsEmptyTitle')}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {shellT(lang, 'integrationsEmptyDescription')}
        </p>
      </div>
      <Button onClick={onExplore} size="lg" className="gap-2">
        <Plug className="size-4" aria-hidden />
        {shellT(lang, 'integrationsExploreCta')}
      </Button>
    </div>
  )
}
