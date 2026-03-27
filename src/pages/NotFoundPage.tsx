import { Link } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NotFoundPageProps = {
  variant?: 'page' | 'embedded'
}

export function NotFoundPage({ variant = 'page' }: NotFoundPageProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-6 px-6 text-center',
        variant === 'page'
          ? 'min-h-svh bg-bg-base'
          : 'min-h-[min(70vh,32rem)] py-8'
      )}
    >
      <div className="space-y-2">
        <p className="font-mono text-5xl font-semibold text-text-primary">404</p>
        <h1 className="text-xl font-semibold text-text-primary">Page not found</h1>
        <p className="max-w-md text-sm text-text-secondary">
          The page you are looking for does not exist or was moved.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link className={cn(buttonVariants({ variant: 'default' }))} to="/">
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
