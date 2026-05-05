import { useState } from 'react'
import { CloudOff, RefreshCw } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import { Button, buttonVariants } from '@/ui/button'
import { cn } from '@/lib/utils'

type IntegrationsErrorStateProps = {
  lang: string
  error: unknown
  isRetrying: boolean
  onRetry: () => void
}

export function IntegrationsErrorState({
  lang,
  error,
  isRetrying,
  onRetry,
}: IntegrationsErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false)
  const errorMessage = error instanceof Error ? error.message : String(error)

  return (
    <div
      role="alert"
      className="animate-in fade-in duration-300 rounded-md border border-destructive/20 bg-destructive/5 p-6 shadow-sm ring-1 ring-destructive/10"
    >
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
          <CloudOff className="size-5" aria-hidden />
        </div>
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-foreground">
            {shellT(lang, 'integrationsErrorTitle')}
          </p>
          <p className="text-sm text-muted-foreground">
            {shellT(lang, 'integrationsErrorDescription')}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 sm:ml-14">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
          className="gap-2 transition-all"
        >
          <RefreshCw
            className={cn('size-3.5', isRetrying && 'animate-spin')}
            aria-hidden
          />
          {isRetrying
            ? shellT(lang, 'integrationsRetrying')
            : shellT(lang, 'integrationsRetry')}
        </Button>
        <a
          href="mailto:soporte@alenna.io"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          {shellT(lang, 'integrationsContactSupport')}
        </a>
      </div>

      <div className="mt-3 sm:ml-14">
        <button
          type="button"
          onClick={() => setShowDetails((s) => !s)}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {showDetails
            ? shellT(lang, 'integrationsHideTechDetails')
            : shellT(lang, 'integrationsViewTechDetails')}
        </button>
        {showDetails && (
          <pre className="animate-in fade-in mt-2 max-h-32 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground duration-200">
            {errorMessage}
          </pre>
        )}
      </div>
    </div>
  )
}
