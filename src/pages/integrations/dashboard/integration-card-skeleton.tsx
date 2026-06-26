import { Skeleton } from '@/ui/skeleton'
import { cn } from '@/lib/utils'

export function IntegrationCardSkeleton() {
  return (
    <li>
      <div
        className={cn(
          'flex h-full flex-col rounded-md border border-border-default bg-white p-5',
        )}
        aria-hidden
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <Skeleton className="size-11 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="mt-2 h-3 w-full max-w-56 rounded" />
        <Skeleton className="mt-1.5 h-3 w-3/4 max-w-40 rounded" />
        <Skeleton className="mt-4 h-5 w-16 rounded-full" />
      </div>
    </li>
  )
}
