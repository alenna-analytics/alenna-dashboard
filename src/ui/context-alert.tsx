import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type ContextAlertTone = 'warning' | 'info' | 'critical'

const iconWrapClassByTone: Record<ContextAlertTone, string> = {
  warning: 'bg-(--stock-alert-warning-bg)',
  info: 'bg-[color-mix(in_srgb,var(--stock-alert-info)_10%,white)]',
  critical: 'bg-(--stock-alert-critical-bg)',
}

const iconClassByTone: Record<ContextAlertTone, string> = {
  warning: 'text-(--stock-alert-warning)',
  info: 'text-(--stock-alert-info)',
  critical: 'text-(--stock-alert-critical)',
}

type ContextAlertCardProps = {
  title: string
  subtitle?: string
  icon: LucideIcon
  tone?: ContextAlertTone
  action?: ReactNode
  className?: string
}

function ContextAlertCard({
  title,
  subtitle,
  icon: Icon,
  tone = 'warning',
  action,
  className,
}: ContextAlertCardProps) {
  return (
    <article
      role="status"
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border-subtle bg-white px-4 py-3.5',
        className,
      )}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md',
          iconWrapClassByTone[tone],
        )}
      >
        <Icon className={cn('size-4', iconClassByTone[tone])} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-semibold text-foreground',
            subtitle ? 'truncate' : 'leading-snug',
          )}
        >
          {title}
        </p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </article>
  )
}

type ContextAlertsGroupProps = {
  title: string
  ariaLabel?: string
  children: ReactNode
  className?: string
}

function ContextAlertsGroup({
  title,
  ariaLabel,
  children,
  className,
}: ContextAlertsGroupProps) {
  return (
    <section
      className={cn('flex w-full flex-col gap-2', className)}
      aria-label={ariaLabel ?? title}
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="flex w-full flex-col gap-2">{children}</div>
    </section>
  )
}

export type { ContextAlertTone }
export { ContextAlertCard, ContextAlertsGroup }
