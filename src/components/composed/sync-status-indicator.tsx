import { cn } from '@/lib/utils'

export type SyncStatus = 'active' | 'syncing' | 'error' | 'expired'

const STATUS: Record<
  SyncStatus,
  { dot: string; label: string; text: string }
> = {
  active: {
    dot: 'bg-success',
    label: 'Synced',
    text: 'text-success',
  },
  syncing: {
    dot: 'animate-pulse bg-warning',
    label: 'Syncing',
    text: 'text-warning',
  },
  error: {
    dot: 'bg-danger',
    label: 'Error',
    text: 'text-danger',
  },
  expired: {
    dot: 'bg-text-tertiary',
    label: 'Reconnect',
    text: 'text-text-tertiary',
  },
}

type SyncStatusIndicatorProps = {
  status: SyncStatus
  className?: string
}

export function SyncStatusIndicator({
  status,
  className,
}: SyncStatusIndicatorProps) {
  const s = STATUS[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full text-xs font-medium',
        s.text,
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </span>
  )
}
