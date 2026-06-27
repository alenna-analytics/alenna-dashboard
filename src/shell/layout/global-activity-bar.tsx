import { useState, type AnimationEvent } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

import { LoadingIcon } from '@/ui/app-icon'
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

type BannerPhase = 'hidden' | 'visible' | 'closing'

const ROW_SURFACE: Record<GlobalActivityPhase, string> = {
  loading:
    'border-b border-[var(--global-activity-loading-border)] bg-[var(--global-activity-loading-bg)] text-[var(--global-activity-loading-fg)]',
  success:
    'border-b border-[var(--global-activity-success-border)] bg-[var(--global-activity-success-bg)] text-[var(--global-activity-success-fg)]',
  error:
    'border-b border-[var(--global-activity-error-border)] bg-[var(--global-activity-error-bg)] text-[var(--global-activity-error-fg)]',
}

function phaseGlyphClass(phase: GlobalActivityPhase): string {
  if (phase === 'loading') {
    return 'text-[var(--global-activity-loading-fg)]'
  }
  if (phase === 'success') {
    return 'text-[var(--global-activity-success-fg)]'
  }
  return 'text-[var(--global-activity-error-fg)]'
}

function itemsChanged(next: GlobalActivityItem[], current: GlobalActivityItem[]): boolean {
  if (next.length !== current.length) return true
  return next.some(
    (item, index) =>
      item.id !== current[index]?.id ||
      item.phase !== current[index]?.phase ||
      item.subtitle !== current[index]?.subtitle ||
      item.title !== current[index]?.title,
  )
}

function PhaseGlyph({ phase }: { phase: GlobalActivityPhase }) {
  const glyphClass = cn('size-3.5 shrink-0', phaseGlyphClass(phase))
  if (phase === 'loading') {
    return <LoadingIcon className={glyphClass} />
  }
  if (phase === 'success') {
    return <CheckCircle2 className={glyphClass} aria-hidden />
  }
  return <AlertCircle className={glyphClass} aria-hidden />
}

function ActivityRow({ item }: { item: GlobalActivityItem }) {
  const { lang } = useLanguage()
  const { minimizeActivity, removeActivity } = useGlobalActivity()

  const surface = ROW_SURFACE[item.phase]

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
      className={cn('h-[var(--global-activity-bar-height)] transition-colors last:border-b-0', surface)}
    >
      <div
        className={cn(
          WORKSPACE_SHELL_COLUMN_CLASS,
          'flex h-full items-center gap-2 text-sm',
        )}
      >
        <PhaseGlyph phase={item.phase} />
        <Link
          to={item.href}
          className="min-w-0 flex-1 truncate outline-none transition-opacity hover:opacity-90 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          title={label}
        >
          <span className="font-medium">{item.title}</span>
          {item.subtitle ? (
            <span className="opacity-80"> · {item.subtitle}</span>
          ) : null}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            'size-7 shrink-0 opacity-80 hover:opacity-100',
            item.phase === 'error' || item.phase === 'success'
              ? 'text-inherit hover:bg-white/15'
              : 'hover:bg-black/5',
          )}
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
  const [heldItems, setHeldItems] = useState<GlobalActivityItem[]>(visibleItems)
  const [phase, setPhase] = useState<BannerPhase>(open ? 'visible' : 'hidden')
  const [prevOpen, setPrevOpen] = useState(open)

  if (open !== prevOpen) {
    setPrevOpen(open)
    setPhase(open ? 'visible' : 'closing')
  }

  if (visibleItems.length > 0 && itemsChanged(visibleItems, heldItems)) {
    setHeldItems(visibleItems)
  }

  const displayItems = visibleItems.length > 0 ? visibleItems : heldItems
  const isVisible = phase === 'visible'
  const isClosing = phase === 'closing'

  if (phase === 'hidden') {
    return null
  }

  const rowCount = Math.max(displayItems.length, 1)

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target || !isClosing) return
    setPhase('hidden')
    setHeldItems([])
  }

  return (
    <div
      className={cn(
        'overflow-hidden transition-[max-height,opacity] duration-280 ease-out motion-reduce:transition-none',
        isVisible
          ? 'max-h-[calc(var(--global-activity-bar-height)*var(--global-activity-row-count))] opacity-100'
          : 'max-h-0 opacity-0',
        className,
      )}
      style={{ ['--global-activity-row-count' as string]: String(rowCount) }}
      aria-hidden={!isVisible}
    >
      <div
        className={cn(
          'flex flex-col',
          isVisible &&
            'motion-safe:animate-[global-activity-bar-enter_0.28s_ease-out_both] motion-reduce:animate-none',
          isClosing &&
            'motion-safe:animate-[global-activity-bar-exit_0.28s_ease-in_forwards] motion-reduce:animate-none',
        )}
        onAnimationEnd={handleAnimationEnd}
      >
        {displayItems.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
