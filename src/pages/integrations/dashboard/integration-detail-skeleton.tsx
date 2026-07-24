import { Skeleton } from '@/ui/skeleton'

export function IntegrationDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-hidden>
      <div className="flex items-start gap-4">
        <Skeleton className="size-16 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-40 max-w-[60%] rounded" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full max-w-2xl rounded" />
          <Skeleton className="h-4 w-full max-w-xl rounded" />
        </div>
      </div>

      <div className="flex flex-col gap-8 border-t border-border-default pt-8">
        <div className="space-y-3">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-24 w-full max-w-2xl rounded-md" />
        </div>
        <div className="space-y-4 border-t border-border-default pt-8">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-32 w-full max-w-2xl rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </div>
    </div>
  )
}
