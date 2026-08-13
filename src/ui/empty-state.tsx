import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type EmptyStateSize = 'sm' | 'md'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  size?: EmptyStateSize
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'sm',
  className,
}: EmptyStateProps) {
  const compact = size === 'sm'
  return (
    <div
      role="status"
      className={cn(
        'mx-auto flex w-full max-w-md flex-col items-center text-center',
        compact ? 'gap-2 px-4 py-6' : 'gap-4 px-6 py-12',
        className,
      )}
    >
      {Icon ? (
        <div
          className={cn(
            'flex items-center justify-center rounded-md bg-muted text-muted-foreground',
            compact ? 'size-10' : 'size-14',
          )}
        >
          <Icon className={compact ? 'size-5' : 'size-7'} aria-hidden />
        </div>
      ) : null}
      <div className="space-y-1">
        <p className={cn('font-medium text-text-primary', compact ? 'text-sm' : 'text-base')}>
          {title}
        </p>
        {description ? (
          <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
