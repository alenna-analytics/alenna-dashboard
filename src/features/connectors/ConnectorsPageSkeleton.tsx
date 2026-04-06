import { Skeleton } from '@/components/ui/skeleton'

function ConnectorRowSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-center md:gap-6">
      <div className="flex min-w-0 flex-1 gap-4">
        <Skeleton className="size-14 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-2/3 max-w-sm" />
        </div>
      </div>
      <div className="flex min-w-48 flex-col gap-2 border-border md:border-l md:pl-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-36" />
      </div>
      <div className="flex shrink-0 flex-col gap-2 md:items-end">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  )
}

export function ConnectorsPageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-1 pb-12">
      <header className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </header>
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <ConnectorRowSkeleton />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-36" />
        <div className="space-y-4">
          <ConnectorRowSkeleton />
          <ConnectorRowSkeleton />
          <ConnectorRowSkeleton />
        </div>
      </div>
    </div>
  )
}
