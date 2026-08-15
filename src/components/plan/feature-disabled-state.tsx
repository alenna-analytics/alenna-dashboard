import type { ReactNode } from 'react'

import { Badge } from '@/ui/badge'
import { cn } from '@/lib/utils'

type FeatureDisabledStateProps = {
  badge: string
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function FeatureDisabledState({
  badge,
  title,
  description,
  action,
  children,
  className,
}: FeatureDisabledStateProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border border-border-default bg-white',
        className,
      )}
    >
      <div className="pointer-events-none select-none p-4 blur-[2px] opacity-40" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 px-6 text-center">
        <Badge variant="success">{badge}</Badge>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="max-w-md text-sm text-text-secondary">{description}</p>
        {action}
      </div>
    </div>
  )
}
