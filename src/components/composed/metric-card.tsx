import type { ReactNode } from 'react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: ReactNode
  currency?: string
  footer?: ReactNode
  /** `accent` highlights the primary KPI (e.g. net sales). */
  variant?: 'standard' | 'hero' | 'accent'
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
        'h-full min-h-[7.5rem] gap-0 border-border-subtle bg-card py-0',
        variant === 'hero' && 'border-l border-l-white/[0.1]',
        variant === 'accent' &&
          'border-accent/35 bg-gradient-to-br from-accent/[0.12] via-card to-card shadow-[0_0_0_1px_rgba(91,140,255,0.12),0_8px_40px_-12px_rgba(91,140,255,0.25)] dark:from-accent/[0.14]',
        'rounded-[12px]',
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 px-5 pb-0 pt-5">
        <span
          className={cn(
            'text-[11px] font-normal leading-tight tracking-wide text-text-tertiary',
            variant === 'accent' && 'text-accent-light/90'
          )}
        >
          {label}
        </span>
        {currency ? (
          <span
            className={cn(
              'shrink-0 tabular-nums font-mono text-[10px] font-normal text-text-tertiary/80',
              variant === 'accent' && 'text-accent-light/85'
            )}
          >
            {currency}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 px-5 pt-3 pb-6">
        <p
          className={cn(
            'tabular-nums font-normal tracking-tight text-text-primary',
            variant === 'hero' || variant === 'accent'
              ? 'font-mono text-2xl font-light lg:text-[1.7rem] leading-none tracking-[0.02em]'
              : 'font-mono text-xl font-light lg:text-[1.32rem] leading-snug tracking-[0.015em]'
          )}
        >
          {currency ? (
            <>
              <span
                className={cn(
                  variant === 'accent' ? 'text-accent-light' : 'text-text-primary'
                )}
              >
                $
              </span>
              {value}
            </>
          ) : (
            value
          )}
        </p>
        {footer ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">{footer}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}
