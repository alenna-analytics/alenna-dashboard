import { Link } from 'react-router-dom'

import { buttonVariants } from '@/ui/button'
import { cn } from '@/lib/utils'

type ServerErrorPageProps = {
  error?: Error | null
  onRetry?: () => void
}

export function ServerErrorPage({ error, onRetry }: ServerErrorPageProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-bg-base px-6 text-center">
      <div className="space-y-2">
        <p className="font-mono text-5xl font-semibold text-text-primary">500</p>
        <h1 className="text-xl font-semibold text-text-primary">
          Something went wrong
        </h1>
        <p className="max-w-md text-sm text-text-secondary">
          An unexpected error occurred. You can try again or return to the
          dashboard.
        </p>
        {import.meta.env.DEV && error ? (
          <pre className="mt-4 max-h-40 max-w-lg overflow-auto rounded-md border border-border-default bg-bg-sunken p-3 text-left font-mono text-xs break-words whitespace-pre-wrap text-danger">
            {error.message}
          </pre>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'default' }))}
            onClick={onRetry}
          >
            Try again
          </button>
        ) : null}
        <Link className={cn(buttonVariants({ variant: onRetry ? 'outline' : 'default' }))} to="/">
          Back to home
        </Link>
        <Link
          className={cn(buttonVariants({ variant: 'outline' }))}
          to="/dashboard/sales"
        >
          Sales
        </Link>
      </div>
    </div>
  )
}
