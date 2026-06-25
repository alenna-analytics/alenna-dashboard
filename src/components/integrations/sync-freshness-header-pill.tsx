import { LoadingIcon } from '@/ui/app-icon'

import {
  useSyncFreshnessHeaderPill,
  type SyncFreshnessPillViewModel,
} from '@/components/integrations/use-sync-freshness-header-pill'
import { Badge } from '@/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'
import { cn } from '@/lib/utils'

export function SyncFreshnessPillBadge({ model }: { model: SyncFreshnessPillViewModel }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={model.variant}
          className={cn(
            'h-7 max-w-[min(100vw-8rem,28rem)] min-w-0 shrink cursor-default gap-1.5 truncate px-2.5 py-0 text-xs font-medium',
            model.isSyncing && 'cursor-pointer transition-opacity hover:opacity-90',
          )}
          render={
            <button
              type="button"
              className="inline-flex max-w-full min-w-0 items-center gap-1.5"
              aria-label={model.label}
              onClick={model.onBadgeClick}
            />
          }
        >
          {model.pill.kind === 'syncing' ? (
            <LoadingIcon className="size-3 shrink-0" />
          ) : null}
          <span className="truncate">{model.label}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6} className="max-w-56 text-center">
        {model.pillTooltip}
      </TooltipContent>
    </Tooltip>
  )
}

export function SyncFreshnessHeaderPill() {
  const model = useSyncFreshnessHeaderPill()
  if (!model) return null
  return <SyncFreshnessPillBadge model={model} />
}
