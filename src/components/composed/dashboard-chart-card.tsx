import type { ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type DashboardChartCardProps = {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function DashboardChartCard({
  title,
  subtitle,
  children,
  className,
  contentClassName,
}: DashboardChartCardProps) {
  return (
    <Card
      className={cn(
        'group/card gap-0 overflow-hidden rounded-[12px] border border-black/[0.06] bg-white py-0 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] transition-all duration-150',
        'dark:border-white/[0.06] dark:bg-[#111116] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_3px_rgba(0,0,0,0.3)]',
        'backdrop-blur-sm dark:backdrop-blur-sm',
        'hover:border-black/[0.08] dark:hover:border-white/[0.08]',
        className
      )}
    >
      <CardHeader className="mb-4 flex flex-col gap-0 border-b border-black/[0.04] px-6 pt-6 pb-4 dark:border-white/[0.04]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-[15px] font-medium leading-snug tracking-tight text-text-primary">
              {title}
            </CardTitle>
            {subtitle ? (
              <div className="text-[11px] font-medium leading-snug text-[#6B6B80] dark:text-zinc-500">
                {subtitle}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Chart options"
            className="shrink-0 rounded-md p-1 text-zinc-500 transition-all duration-150 hover:bg-black/[0.04] hover:text-zinc-300 dark:text-zinc-600 dark:hover:bg-white/[0.04] dark:hover:text-zinc-300"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className={cn('px-6 pb-6 pt-0', contentClassName)}>{children}</CardContent>
    </Card>
  )
}
