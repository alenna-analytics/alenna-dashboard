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
  return (
    <Card
      className={cn(
        'h-full min-h-[7.5rem] gap-0 border-border-subtle bg-bg-surface py-0',
        variant === 'hero' && 'border-l-[3px] border-l-white/[0.12]',
        'rounded-[12px]',
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 px-6 pb-0 pt-6">
        <span className="text-[11px] font-medium leading-tight tracking-tight text-text-tertiary">
          {label}
        </span>
        {currency ? (
          <span className="shrink-0 tabular-nums font-mono text-[11px] font-medium text-text-tertiary/90">
            {currency}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1.5 px-6 pt-3 pb-6">
        <p
          className={cn(
            'tabular-nums font-medium tracking-wide text-text-primary',
            variant === 'hero'
              ? 'font-mono text-2xl lg:text-[1.75rem] leading-none'
              : 'font-mono text-xl lg:text-[1.35rem] leading-tight'
          )}
        >
          {value}
        </p>
        {footer ? (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">{footer}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}
