import type { ReactNode } from 'react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: ReactNode
  currency?: string
  footer?: ReactNode
  variant?: 'standard' | 'hero'
  className?: string
}

export function MetricCard({
  label,
  value,
  currency,
  footer,
  variant = 'standard',
  className,
}: MetricCardProps) {
  const inner = (
    <Card
      className={cn(
        'gap-0 border-border-default bg-bg-surface py-0',
        variant === 'hero' ? 'rounded-2xl' : 'rounded-xl',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between px-5 pb-0 pt-5">
        <span className="text-xs font-semibold tracking-wider text-text-secondary uppercase">
          {label}
        </span>
        {currency ? (
          <span className="font-mono text-xs text-text-tertiary">{currency}</span>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1 px-5 pt-3 pb-5">
        <p
          className={cn(
            'font-semibold text-text-primary',
            variant === 'hero'
              ? 'font-mono text-3xl lg:text-4xl'
              : 'font-mono text-2xl'
          )}
        >
          {value}
        </p>
        {footer ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">{footer}</div>
        ) : null}
      </CardContent>
    </Card>
  )

  if (variant !== 'hero') return inner

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-accent/40 via-transparent to-transparent p-px">
      {inner}
    </div>
  )
}
