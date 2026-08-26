import { Skeleton } from '@/ui/skeleton'

export function IntegrationDetailSkeleton() {
  return (
    <div className="flex flex-col" aria-busy="true" aria-hidden>
      <div className="flex items-start gap-4 pb-6">
        <Skeleton className="size-14 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-40 max-w-[60%] rounded" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full max-w-xl rounded" />
        </div>
      </div>

      <div className="flex gap-6 border-b border-border-subtle pb-3">
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-5 w-28 rounded" />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_15.5rem]">
        <div className="space-y-4">
          <Skeleton className="h-4 w-full max-w-2xl rounded" />
          <Skeleton className="h-4 w-full max-w-xl rounded" />
          <Skeleton className="h-32 w-full max-w-2xl rounded-md" />
        </div>
        <div className="space-y-6 lg:border-l lg:border-border-subtle lg:pl-8">
          <div className="space-y-2">
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
