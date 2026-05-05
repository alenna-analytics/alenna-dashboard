import { Card, CardFooter, CardHeader } from '@/ui/card'
import { Skeleton } from '@/ui/skeleton'

export function IntegrationCardSkeleton() {
  return (
    <li>
      <Card
        size="sm"
        variant="solid"
        className="h-full border-border-subtle shadow-sm"
      >
        <CardHeader className="flex flex-col items-start gap-3 border-0 pb-0">
          <Skeleton className="size-14 rounded-md" />
          <div className="flex w-full flex-col gap-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-full max-w-56 rounded" />
            <Skeleton className="h-3 w-3/4 max-w-40 rounded" />
          </div>
        </CardHeader>
        <CardFooter className="flex flex-row items-center justify-between gap-3 border-border-subtle bg-transparent">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-5 w-9 rounded-md" />
        </CardFooter>
      </Card>
    </li>
  )
}
