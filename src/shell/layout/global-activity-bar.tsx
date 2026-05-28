import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useLanguage } from '@/shell/providers/language-provider'
import {
  useGlobalActivity,
  type GlobalActivityItem,
  type GlobalActivityPhase,
} from '@/shell/providers/global-activity-provider'
import { WORKSPACE_SHELL_COLUMN_CLASS } from '@/shell/layout/workspace-shell-column'
import { shellT } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'
import { cn } from '@/lib/utils'

const ROW_ACCENT: Record<GlobalActivityPhase, string> = {
  loading: 'border-l-2 border-l-[var(--global-activity-loading-bg)]',
  success: 'border-l-2 border-l-[var(--success)]',
  error: 'border-l-2 border-l-[var(--destructive)]',
}

function PhaseGlyph({ phase }: { phase: GlobalActivityPhase }) {
  const cls = 'size-3.5 shrink-0 text-text-secondary'
  if (phase === 'loading') {
    return <Loader2 className={cn(cls, 'animate-spin')} aria-hidden />
  }
  if (phase === 'success') {
    return <CheckCircle2 className={cn(cls, 'text-success')} aria-hidden />
  }
  return <AlertCircle className={cn(cls, 'text-destructive')} aria-hidden />
}

function ActivityRow({ item }: { item: GlobalActivityItem }) {
  const { lang } = useLanguage()
  const { minimizeActivity, removeActivity } = useGlobalActivity()

  const accent = ROW_ACCENT[item.phase]

  const onClose = () => {
    if (item.phase === 'loading') {
      minimizeActivity(item.id)
      return
    }
    removeActivity(item.id)
  }

  const label = [item.title, item.subtitle].filter(Boolean).join(' · ')

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('border-b border-border-subtle bg-muted/75 transition-colors last:border-b-0', accent)}
    >
      <div
        className={cn(
          WORKSPACE_SHELL_COLUMN_CLASS,
          'flex h-9 items-center gap-2 text-sm text-text-secondary',
        )}
      >
        <PhaseGlyph phase={item.phase} />
        <Link
          to={item.href}
          className="min-w-0 flex-1 truncate outline-none transition-opacity hover:opacity-90 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          title={label}
        >
          <span className="text-text-primary">{item.title}</span>
          {item.subtitle ? (
            <span className="text-muted-foreground"> · {item.subtitle}</span>
          ) : null}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-7 shrink-0 text-muted-foreground hover:bg-muted hover:text-text-primary"
          aria-label={shellT(lang, 'globalActivityDismissAria')}
          onClick={(e) => {
            e.preventDefault()
            onClose()
          }}
        >
          <X className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  )
}

export function GlobalActivityBar({ className }: { className?: string }) {
  const { visibleItems } = useGlobalActivity()
  const open = visibleItems.length > 0

  return (
    <div
      className={cn(
        'overflow-hidden transition-[max-height,opacity] duration-300 ease-out motion-reduce:transition-none',
        open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0',
        className,
      )}
      aria-hidden={!open}
    >
      <div className="flex flex-col bg-muted/40">
        {visibleItems.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
