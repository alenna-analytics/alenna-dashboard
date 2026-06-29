import type { ReactNode } from 'react'

import { Button } from '@/ui/button'
import { cn } from '@/lib/utils'

type IntegrationSyncActionCardProps = {
  title: string
  description: string
  actionLabel: string
  actionLoadingLabel?: string
  onAction: () => void
  actionDisabled?: boolean
  actionLoading?: boolean
  hideAction?: boolean
  badge?: ReactNode
  footer?: ReactNode
  className?: string
}

export function IntegrationSyncActionCard({
  title,
  description,
  actionLabel,
  actionLoadingLabel,
  onAction,
  actionDisabled = false,
  actionLoading = false,
  hideAction = false,
  badge,
  footer,
  className,
}: IntegrationSyncActionCardProps) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-md border border-border-default bg-white',
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            {badge}
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
        </div>
        {hideAction ? null : (
          <Button
            type="button"
            variant="accent"
            size="sm"
            className="shrink-0 self-start"
            loading={actionLoading}
            disabled={actionDisabled}
            onClick={onAction}
          >
            {actionLoading && actionLoadingLabel ? actionLoadingLabel : actionLabel}
          </Button>
        )}
      </div>
      {footer ? (
        <div className="border-t border-border-subtle px-4 py-2.5 text-xs text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
