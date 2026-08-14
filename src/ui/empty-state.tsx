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
  children?: ReactNode
  size?: EmptyStateSize
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  children,
  size = 'md',
  className,
}: EmptyStateProps) {
  const compact = size === 'sm'
  const cta = children ?? action

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
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-md bg-muted text-text-tertiary',
            compact ? 'size-8' : 'size-10',
          )}
        >
          <AppIcon name={icon} colorize className={compact ? 'size-4' : 'size-5'} />
        </div>
      ) : null}
      <div className={cn('flex max-w-sm flex-col', compact ? 'gap-1' : 'gap-1.5')}>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description ? (
          <p className="text-sm leading-snug text-text-tertiary">{description}</p>
        ) : null}
      </div>
      {cta ? <div className="mt-1">{cta}</div> : null}
    </div>
  )
}
