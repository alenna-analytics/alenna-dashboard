import { LoadingIcon } from '@/ui/app-icon'

import {
  syncFreshnessPillBadgeVariant,
  type SyncFreshnessPillContent,
} from '@/lib/integrations/sync-freshness'
import { formatSyncFreshnessPillLabel } from '@/lib/integrations/sync-freshness-pill-label'
import { Badge } from '@/ui/badge'
import { cn } from '@/lib/utils'

type SyncFreshnessPillBadgeProps = {
  pill: SyncFreshnessPillContent
  lang: string
  className?: string
}

export function SyncFreshnessPillBadge({ pill, lang, className }: SyncFreshnessPillBadgeProps) {
  return (
    <Badge
      variant={syncFreshnessPillBadgeVariant(pill)}
      className={cn('gap-1', className)}
    >
      {pill.kind === 'syncing' ? (
        <LoadingIcon className="size-3" />
      ) : null}
      {formatSyncFreshnessPillLabel(lang, pill)}
    </Badge>
  )
}
