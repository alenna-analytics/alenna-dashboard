import { Skeleton } from '@/ui/skeleton'

import { ProductListSkeleton } from './cogs-load-select-step'

function PanelSkeleton({ actionCount = 2 }: { actionCount?: number }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-border-subtle">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-muted/30 px-3 py-2">
        <Skeleton className="h-4 w-36" />
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
      <header className="shrink-0 space-y-2 pb-3 pt-1">
        <Skeleton className="h-4 w-56 max-w-full" />
        <div className="space-y-1">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-3 w-40" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="shrink-0 space-y-3 px-1">
          <Skeleton className="h-9 w-full max-w-md" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          <PanelSkeleton />
          <PanelSkeleton actionCount={1} />
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-end border-t border-border-subtle bg-white py-3">
        <Skeleton className="h-9 w-32 rounded-md" />
      </footer>
    </div>
  )
}
