import { ServerCrash, RefreshCw, RotateCcw } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import { cn } from '@/lib/utils'

type ShellBootstrapErrorProps = {
  lang: string
  error: string
  isRetrying: boolean
  onRetry: () => void
}

export function ShellBootstrapError({
  lang,
  isRetrying,
  onRetry,
}: ShellBootstrapErrorProps) {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-bg-base px-6 py-16 text-center">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex size-16 items-center justify-center rounded-md bg-destructive/10 text-destructive">
          <ServerCrash className="size-8" aria-hidden />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {shellT(lang, 'shellErrorTitle')}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {shellT(lang, 'shellErrorDescription')}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="gap-2"
          >
            <RefreshCw
              className={cn('size-4', isRetrying && 'animate-spin')}
              aria-hidden
            />
            {shellT(lang, 'shellErrorRetry')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RotateCcw className="size-4" aria-hidden />
            {shellT(lang, 'shellErrorRefresh')}
          </Button>
        </div>

      </div>
    </div>
  )
}
