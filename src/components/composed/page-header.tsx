import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  /** Tighter typography for data-heavy views (e.g. dashboard). */
  dense?: boolean
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  dense,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div>
        <h1
          className={cn(
            'tracking-tight text-text-primary',
            dense
              ? 'text-[15px] font-medium leading-snug'
              : 'text-lg font-medium leading-tight'
          )}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              'font-normal leading-relaxed text-text-tertiary',
              dense ? 'mt-1 text-xs' : 'mt-1.5 text-sm'
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
