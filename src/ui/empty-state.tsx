import type { ReactNode } from 'react'

import type { AppIconName } from '@/lib/icons/catalog'
import { cn } from '@/lib/utils'
import { AppIcon } from '@/ui/app-icon'

type EmptyStateSize = 'sm' | 'md'

type EmptyStateProps = {
  icon?: AppIconName
  title: string
  action?: ReactNode
  size?: EmptyStateSize
  className?: string
}

export function EmptyState({
  icon,
  title,
  action,
  size = 'md',
  className,
}: EmptyStateProps) {
  const compact = size === 'sm'
  return (
    <div
      role="status"
      className={cn(
        'mx-auto flex w-full flex-col items-center justify-center text-center',
        compact ? 'min-h-[10rem] gap-2 px-4 py-8' : 'min-h-[22rem] gap-3 px-6 py-16',
        className,
      )}
    >
      {icon ? (
        <AppIcon name={icon} colorize className="size-5 text-text-tertiary" />
      ) : null}
      <p className="text-sm text-text-secondary">{title}</p>
      {action}
    </div>
  )
}
