import { cn } from '@/lib/utils'
import { Skeleton } from '@/ui/skeleton'

import { ProductListSkeleton } from './cogs-load-select-step'

function PanelSkeleton({ actionCount = 1 }: { actionCount?: number }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-border-subtle">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 shrink-0 rounded-[4px]" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: actionCount }, (_, index) => (
            <Skeleton key={index} className="h-8 w-28 rounded-md" />
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <ProductListSkeleton />
      </div>
    </div>
  )
}

export function CogsLoadEditorLoadingSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-col gap-4 pb-5">
        <Skeleton className="h-4 w-56 max-w-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-3 w-40" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="shrink-0 px-1 pb-5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-72 shrink-0 rounded-md" />
            <Skeleton className="h-7 w-24 shrink-0 rounded-md" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          <PanelSkeleton />
          <PanelSkeleton actionCount={1} />
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-border-subtle bg-white py-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-[26px] w-24 rounded-md" />
      </footer>
    </div>
  )
}

export function CogsLoadDetailLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-[26px] w-20 shrink-0 rounded-md" />
        </div>
        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-4 sm:inline-flex sm:flex-wrap">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className={cn(
                'flex shrink-0 flex-col gap-1',
                index > 0 && 'sm:border-l sm:border-border-subtle sm:pl-6',
                index < 3 && 'sm:pr-5',
              )}
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-28" />
            </div>
          ))}
        </div>
      </header>
      <Skeleton className="h-64 w-full rounded-md" />
    </div>
  )
}
