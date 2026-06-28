import { Plug } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  connectionDisplaySubtitle,
  resolveConnectionLastSuccessfulSyncLine,
} from '@/lib/integrations/connection-last-sync-display'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { formatRelativeAgeLabel } from '@/lib/integrations/sync-freshness-pill-label'
import {
  deriveConnectionSyncFreshness,
  filterActiveSyncableConnections,
} from '@/lib/integrations/sync-freshness'
import type { PlatformConnection } from '@/lib/types/connectors'
import { shellT } from '@/lib/i18n/shell-strings'
import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import { useLanguage } from '@/shell/providers/language-provider'
import { LoadingIcon } from '@/ui/app-icon'
import { StatusPill } from '@/ui/status-pill'
import { cn } from '@/lib/utils'
import { chromeTextButtonClassName } from '@/ui/surface'

const HOVER_CLOSE_DELAY_MS = 120

function ConnectionLastSyncPill({
  conn,
  lang,
}: {
  conn: PlatformConnection
  lang: string
}) {
  const line = resolveConnectionLastSuccessfulSyncLine(conn)

  if (line.kind === 'syncing') {
    return (
      <StatusPill variant="info" className="gap-1">
        <LoadingIcon className="size-3" aria-hidden />
        {shellT(lang, 'headerConnectionsSyncing')}
      </StatusPill>
    )
  }

  if (line.kind === 'never') {
    return (
      <StatusPill variant="warning">
        {shellT(lang, 'headerConnectionsNeverSynced')}
      </StatusPill>
    )
  }

  const freshness = deriveConnectionSyncFreshness(conn)
  const variant = freshness === 'outdated' ? 'warning' : 'success'

  return (
    <StatusPill variant={variant}>
      {formatRelativeAgeLabel(lang, line.timing)}
    </StatusPill>
  )
}

function ConnectionHoverRow({
  conn,
  lang,
}: {
  conn: PlatformConnection
  lang: string
}) {
  const ui = INTEGRATION_UI[conn.platform]
  const name = ui?.nameKey ? shellT(lang, ui.nameKey) : conn.platform
  const subtitle = connectionDisplaySubtitle(conn)

  return (
    <Link
      to={`/dashboard/integrations/${conn.platform}?tab=settings`}
      className="flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
    >
      {ui?.logoSrc ? (
        <img
          src={ui.logoSrc}
          alt=""
          className="size-7 shrink-0 rounded-md border border-border-subtle bg-white object-contain p-0.5"
          draggable={false}
        />
      ) : (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-muted text-[0.625rem] font-semibold uppercase text-text-secondary">
          {conn.platform.slice(0, 2)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-text-primary">{name}</span>
        {subtitle ? (
          <span className="block truncate text-xs text-text-secondary">{subtitle}</span>
        ) : null}
      </span>
      <ConnectionLastSyncPill conn={conn} lang={lang} />
    </Link>
  )
}

export function HeaderConnectionsMenu({ className }: { className?: string }) {
  const { lang } = useLanguage()
  const { data: connections, isLoading } = usePlatformConnectionsQuery()
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeConnections = useMemo(
    () => filterActiveSyncableConnections(connections ?? []),
    [connections],
  )

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setOpen(false)
      closeTimerRef.current = null
    }, HOVER_CLOSE_DELAY_MS)
  }, [clearCloseTimer])

  const handleEnter = useCallback(() => {
    clearCloseTimer()
    setOpen(true)
  }, [clearCloseTimer])

  if (!isLoading && activeConnections.length === 0) {
    return null
  }

  return (
    <div
      className={cn('relative hidden sm:block', className)}
      onMouseEnter={handleEnter}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={cn(chromeTextButtonClassName, 'gap-1.5 px-2.5')}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={shellT(lang, 'headerConnectionsLabel')}
      >
        <Plug className="size-3.5 shrink-0" aria-hidden />
        <span>{shellT(lang, 'headerConnectionsLabel')}</span>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-1.5 w-[min(20rem,calc(100vw-2rem))] rounded-md border border-border-subtle bg-popover p-1.5 shadow-[var(--glass-shadow)]"
          onMouseEnter={handleEnter}
          onMouseLeave={scheduleClose}
          role="menu"
          aria-label={shellT(lang, 'headerConnectionsLabel')}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-text-secondary">
              <LoadingIcon className="size-4" aria-hidden />
            </div>
          ) : activeConnections.length === 0 ? (
            <p className="px-3 py-2 text-sm text-text-secondary">
              {shellT(lang, 'headerConnectionsEmpty')}
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {activeConnections.map((conn) => (
                <li key={conn.id}>
                  <ConnectionHoverRow conn={conn} lang={lang} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
