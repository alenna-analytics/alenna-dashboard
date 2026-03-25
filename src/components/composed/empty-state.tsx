import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border-default bg-bg-elevated">
        {icon ?? null}
      </div>
      <p className="mb-1 text-sm font-medium text-text-primary">{title}</p>
      <p className="mb-4 max-w-sm text-sm text-text-tertiary">{description}</p>
      {action ? (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
