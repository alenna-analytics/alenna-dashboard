import { AlertCircle, CheckCircle2 } from 'lucide-react'

import { LoadingIcon } from '@/ui/app-icon'

import { shellT } from '@/lib/i18n/shell-strings'
import { Badge } from '@/ui/badge'
import {
  useGlobalActivity,
  type GlobalActivityPhase,
} from '@/shell/providers/global-activity-provider'
import { useLanguage } from '@/shell/providers/language-provider'
import { cn } from '@/lib/utils'

function pillVariantForPhase(phase: GlobalActivityPhase): 'secondary' | 'success' | 'error' {
  if (phase === 'loading') return 'secondary'
  if (phase === 'success') return 'success'
  return 'error'
}

export function GlobalActivityHeaderIndicator() {
  const { lang } = useLanguage()
  const { hasMinimized, minimizedAggregatePhase, restoreAllActivities } = useGlobalActivity()

  if (!hasMinimized || minimizedAggregatePhase === null) return null

  const phase = minimizedAggregatePhase
  const aria = shellT(lang, 'globalActivityRestoreBarAria')

  const label =
    phase === 'loading'
      ? shellT(lang, 'globalActivityPillLoading')
      : phase === 'success'
        ? shellT(lang, 'globalActivityPillSuccess')
        : shellT(lang, 'globalActivityPillError')

  return (
    <Badge
      variant={pillVariantForPhase(phase)}
      className={cn(
        'h-7 max-w-[min(100vw-10rem,14rem)] shrink-0 cursor-pointer gap-1.5 truncate px-2.5 py-0 text-xs font-medium transition-opacity hover:opacity-90',
      )}
      render={<button type="button" aria-label={aria} title={aria} onClick={() => restoreAllActivities()} />}
    >
      {phase === 'loading' ? (
        <LoadingIcon className="size-3 shrink-0" />
      ) : phase === 'success' ? (
        <CheckCircle2 className="size-3 shrink-0" aria-hidden />
      ) : (
        <AlertCircle className="size-3 shrink-0" aria-hidden />
      )}
      <span className="truncate">{label}</span>
    </Badge>
  )
}
