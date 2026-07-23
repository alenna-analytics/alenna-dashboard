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
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  secondaryActionDisabled?: boolean
  secondaryActionLoading?: boolean
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
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionDisabled = false,
  secondaryActionLoading = false,
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
        {hideAction && !(secondaryActionLabel && onSecondaryAction) ? null : (
          <div className="flex shrink-0 flex-col gap-2 self-start sm:flex-row">
            {secondaryActionLabel && onSecondaryAction ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={secondaryActionLoading}
                disabled={secondaryActionDisabled || secondaryActionLoading}
                onClick={onSecondaryAction}
              >
                {secondaryActionLabel}
              </Button>
            ) : null}
            {hideAction ? null : (
              <Button
                type="button"
                variant="accent"
                size="sm"
                loading={actionLoading}
                disabled={actionDisabled}
                onClick={onAction}
              >
                {actionLoading && actionLoadingLabel ? actionLoadingLabel : actionLabel}
              </Button>
            )}
          </div>
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
