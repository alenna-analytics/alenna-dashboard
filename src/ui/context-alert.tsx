import type { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

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
            'text-[13px] font-medium text-foreground',
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
  const [open, setOpen] = useState(true)
  const panelId = useId()
  const headingId = useId()

  return (
    <section
      className={cn('flex w-full flex-col', className)}
      aria-labelledby={headingId}
    >
      <button
        type="button"
        className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-md text-left outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <h2 id={headingId} className="text-sm font-semibold text-foreground">
          {title}
        </h2>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-text-secondary transition-transform duration-300 ease-out',
            open ? 'rotate-0' : '-rotate-90',
          )}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-label={ariaLabel ?? title}
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              'flex w-full flex-col gap-2 pt-2 transition-opacity duration-300 ease-out',
              open ? 'opacity-100' : 'opacity-0',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

export type { ContextAlertTone }
export { ContextAlertCard, ContextAlertsGroup }
