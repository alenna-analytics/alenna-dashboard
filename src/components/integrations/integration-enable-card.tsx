import type { ReactNode } from 'react'

import { Button } from '@/ui/button'
import { Switch } from '@/ui/switch'
import { cn } from '@/lib/utils'

type IntegrationEnableCardProps = {
  title: string
  description: string
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  switchId: string
  onDisconnect?: () => void
  disconnectLabel?: string
  disconnectPending?: boolean
  switchDisabled?: boolean
  children?: ReactNode
  className?: string
}

export function IntegrationEnableCard({
  title,
  description,
  enabled,
  onEnabledChange,
  switchId,
  onDisconnect,
  disconnectLabel,
  disconnectPending = false,
  switchDisabled = false,
  children,
  className,
}: IntegrationEnableCardProps) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-md border border-border-default bg-white',
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
          </div>
          {children}
        </div>
        <Switch
          id={switchId}
          checked={enabled}
          onCheckedChange={(checked) => {
            if (switchDisabled) return
            onEnabledChange(checked)
          }}
          disabled={switchDisabled}
          className={cn('shrink-0 self-start', switchDisabled && 'pointer-events-none')}
          aria-label={title}
          aria-disabled={switchDisabled}
        />
      </div>
      {!enabled && onDisconnect ? (
        <div className="flex justify-end border-t border-border-subtle px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-destructive/35 text-destructive hover:bg-destructive/10 hover:text-destructive"
            loading={disconnectPending}
            onClick={onDisconnect}
          >
            {disconnectLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
