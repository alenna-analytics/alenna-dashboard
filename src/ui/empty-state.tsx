import type { ReactNode } from 'react'

import type { AppIconName } from '@/lib/icons/catalog'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/ui/app-icon'

type EmptyStateSize = 'sm' | 'md'

type EmptyStateProps = {
  icon?: AppIconName
  title: string
  description?: string
  action?: ReactNode
  size?: EmptyStateSize
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className,
}: EmptyStateProps) {
  const compact = size === 'sm'
  return (
    <div
      role="status"
      className={cn(
        'mx-auto flex w-full max-w-md flex-col items-center justify-center text-center',
        compact ? 'min-h-[12rem] gap-3 px-4 py-8' : 'min-h-[22rem] gap-5 px-6 py-16',
        className,
      )}
    >
      {icon ? (
        <AppIcon
          name={icon}
          colorize
          className={cn('text-text-tertiary', compact ? 'size-8' : 'size-10')}
        />
      ) : null}
      <div className="space-y-1.5">
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
