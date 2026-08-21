import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  connectionDisplaySubtitle,
  resolveConnectionLastSuccessfulSyncLine,
} from '@/lib/integrations/connection-last-sync-display'
import { isAdsPlatform } from '@/lib/integrations/ads-scope'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import { formatRelativeAgeLabel } from '@/lib/integrations/sync-freshness-pill-label'
import {
  deriveConnectionSyncFreshness,
  filterActiveHeaderConnections,
} from '@/lib/integrations/sync-freshness'
import type { PlatformConnection } from '@/lib/types/connectors'
import { shellT } from '@/lib/i18n/shell-strings'
import { usePlatformConnectionsQuery } from '@/hooks/use-platform-connections-query'
import { useLanguage } from '@/shell/providers/language-provider'
import { AppIcon, LoadingIcon } from '@/ui/app-icon'
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
      className="flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-[var(--sidebar-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
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

function ConnectionGroup({
  label,
  connections,
  lang,
  showLabel,
}: {
  label: string
  connections: PlatformConnection[]
  lang: string
  showLabel: boolean
}) {
  if (connections.length === 0) return null

  return (
    <li className="list-none">
      {showLabel ? (
        <p className="px-2 pb-1 pt-1.5 text-[0.625rem] font-semibold uppercase tracking-wide text-text-secondary">
          {label}
        </p>
      ) : null}
      <ul className="flex flex-col gap-0.5">
        {connections.map((conn) => (
          <li key={conn.id}>
            <ConnectionHoverRow conn={conn} lang={lang} />
          </li>
        ))}
      </ul>
    </li>
  )
}

export function HeaderConnectionsMenu({ className }: { className?: string }) {
  const { lang } = useLanguage()
  const { data: connections, isLoading } = usePlatformConnectionsQuery()
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeConnections = useMemo(
    () => filterActiveHeaderConnections(connections ?? []),
    [connections],
  )

  const { ecommerceConnections, adsConnections } = useMemo(() => {
    const locale = lang === 'en' ? 'en' : 'es'
    const byName = (a: PlatformConnection, b: PlatformConnection) => {
      const nameOf = (conn: PlatformConnection) => {
        const ui = INTEGRATION_UI[conn.platform]
        return ui?.nameKey ? shellT(lang, ui.nameKey) : conn.platform
      }
      return nameOf(a).localeCompare(nameOf(b), locale, { sensitivity: 'base' })
    }

    const ecommerce: PlatformConnection[] = []
    const ads: PlatformConnection[] = []
    for (const conn of activeConnections) {
      if (isAdsPlatform(conn.platform)) ads.push(conn)
      else ecommerce.push(conn)
    }
    ecommerce.sort(byName)
    ads.sort(byName)
    return { ecommerceConnections: ecommerce, adsConnections: ads }
  }, [activeConnections, lang])

  const showGroupLabels = ecommerceConnections.length > 0 && adsConnections.length > 0

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
        <AppIcon name="integrations" colorize className="size-3.5 shrink-0" />
        <span>{shellT(lang, 'headerConnectionsLabel')}</span>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-1.5 w-[min(20rem,calc(100vw-2rem))] rounded-md border border-border-subtle bg-white p-1.5 shadow-md"
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
            <ul className="flex flex-col gap-1">
              <ConnectionGroup
                label={shellT(lang, 'integrationsNavEcommerce')}
                connections={ecommerceConnections}
                lang={lang}
                showLabel={showGroupLabels}
              />
              <ConnectionGroup
                label={shellT(lang, 'navAds')}
                connections={adsConnections}
                lang={lang}
                showLabel={showGroupLabels}
              />
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
