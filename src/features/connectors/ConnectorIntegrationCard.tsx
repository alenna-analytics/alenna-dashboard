import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ConnectorCardCopy } from '@/features/connectors/connector-card-copy'
import { ACCENT_STYLES, type ConnectorDefinition } from '@/features/connectors/connector-definitions'
import { PlatformLogo } from '@/features/connectors/platform-logos'
import { useSyncElapsedSeconds } from '@/features/connectors/use-sync-elapsed'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { Locale } from 'date-fns'
import { ChevronDown, Loader2, Settings2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'

export type ConnectorCardMode = 'connected' | 'disconnected' | 'coming_soon'

export type ConnectorIntegrationCardProps = {
  definition: ConnectorDefinition
  copy: ConnectorCardCopy
  dateLocale: Locale
  mode: ConnectorCardMode
  canManage: boolean
  isSyncing?: boolean
  storeName?: string | null
  lastSyncAt?: string | null
  statusText?: string | null
  lastError?: string | null
  onConnect?: () => void
  connectPending?: boolean
  connectDisabled?: boolean
  onSync?: () => void
  onDisconnect?: () => void
  disconnectPending?: boolean
  connectError?: string | null
  syncError?: string | null
  disconnectError?: string | null
  setupContent?: ReactNode
  advancedContent?: ReactNode
  lastRunSummaryLine?: string | null
}

function formatLastSync(iso: string | null | undefined, locale: Locale): string | null {
  if (!iso) return null
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return formatDistanceToNow(d, { addSuffix: true, locale })
  } catch {
    return null
  }
}

export function ConnectorIntegrationCard({
  definition,
  copy,
  dateLocale,
  mode,
  canManage,
  isSyncing = false,
  storeName,
  lastSyncAt,
  statusText,
  lastError,
  onConnect,
  connectPending = false,
  connectDisabled = false,
  onSync,
  onDisconnect,
  disconnectPending = false,
  connectError,
  syncError,
  disconnectError,
  setupContent,
  advancedContent,
  lastRunSummaryLine,
}: ConnectorIntegrationCardProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const accent = ACCENT_STYLES[definition.accent]
  const elapsed = useSyncElapsedSeconds(isSyncing)
  const lastSyncLabel = formatLastSync(lastSyncAt ?? null, dateLocale)
  const actionsLocked = isSyncing || connectPending || disconnectPending

  return (
    <div
      className={cn(
        'group/card overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md',
        'border-l-4',
        accent.border,
      )}
    >
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 gap-4">
          <div
            className={cn(
              'flex size-14 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset',
              accent.logoBg,
              accent.ring,
            )}
          >
            <PlatformLogo accent={definition.accent} className="size-8" title={copy.connectorName} />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold tracking-tight">{copy.connectorName}</h3>
              {mode === 'connected' && (
                <Badge variant="secondary" className="font-normal">
                  {copy.activeBadge}
                </Badge>
              )}
              {mode === 'coming_soon' && (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  {copy.comingSoonBadge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{copy.connectorDescription}</p>
            {setupContent && mode === 'disconnected' && definition.implemented ? (
              <div className="pt-3">{setupContent}</div>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-48 flex-col gap-1 border-border md:border-l md:pl-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {copy.statusColumn}
          </p>
          {mode === 'connected' ? (
            <>
              <p className="text-sm font-medium text-foreground">{copy.statusConnected}</p>
              {storeName ? (
                <p className="truncate text-sm text-muted-foreground" title={storeName}>
                  {storeName}
                </p>
              ) : null}
              {statusText ? <p className="text-xs text-muted-foreground">{statusText}</p> : null}
              {lastSyncLabel ? (
                <p className="text-xs text-muted-foreground">
                  {copy.lastSyncPrefix} {lastSyncLabel}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{copy.noSyncYet}</p>
              )}
            </>
          ) : mode === 'coming_soon' ? (
            <p className="text-sm text-muted-foreground">{copy.statusNotAvailable}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{copy.statusNotConnected}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 md:items-end">
          {mode === 'connected' && definition.implemented ? (
            <>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  size="default"
                  disabled={!canManage || actionsLocked}
                  onClick={() => onSync?.()}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                      {copy.syncing}
                    </>
                  ) : (
                    copy.sync
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  disabled={!canManage || actionsLocked}
                  onClick={() => onDisconnect?.()}
                >
                  {disconnectPending ? copy.disconnecting : copy.disconnect}
                </Button>
              </div>
              {canManage && advancedContent ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-muted-foreground md:w-auto md:min-w-40"
                  disabled={actionsLocked}
                  onClick={() => setAdvancedOpen((o) => !o)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Settings2 className="size-4" />
                    {advancedOpen ? copy.hideOptions : copy.advanced}
                  </span>
                  <ChevronDown
                    className={cn('size-4 shrink-0 transition-transform', advancedOpen && 'rotate-180')}
                  />
                </Button>
              ) : null}
            </>
          ) : null}

          {mode === 'disconnected' && definition.implemented ? (
            <Button
              type="button"
              disabled={!canManage || isSyncing || connectPending || connectDisabled}
              onClick={() => onConnect?.()}
            >
              {connectPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                  {copy.redirecting}
                </>
              ) : (
                copy.connect
              )}
            </Button>
          ) : null}

          {mode === 'coming_soon' ? (
            <Button type="button" variant="outline" disabled className="opacity-70">
              {copy.comingSoonButton}
            </Button>
          ) : null}

          {!canManage && definition.implemented ? (
            <p className="max-w-56 text-right text-xs text-muted-foreground">{copy.adminsOnly}</p>
          ) : null}
        </div>
      </div>

      {lastError && mode === 'connected' ? (
        <div className="border-t border-border bg-destructive/5 px-5 py-2 text-xs text-destructive">
          {lastError}
        </div>
      ) : null}

      {(connectError || syncError || disconnectError) && (
        <div className="border-t border-border px-5 py-2 text-xs text-destructive">
          {connectError ?? syncError ?? disconnectError}
        </div>
      )}

      {lastRunSummaryLine && !isSyncing ? (
        <div className="border-t border-border bg-muted/30 px-5 py-2 text-xs text-muted-foreground">
          {lastRunSummaryLine}
        </div>
      ) : null}

      {isSyncing ? (
        <div className={cn('border-t px-5 py-4', accent.subtle)}>
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>{copy.syncProgressTitle}</span>
            <span className="font-normal text-muted-foreground tabular-nums">
              {elapsed}s {copy.syncElapsedSuffix}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="connector-sync-indeterminate-bar h-full w-2/5 rounded-full bg-primary/90"
              aria-hidden
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{copy.syncProgressHint}</p>
        </div>
      ) : null}

      {advancedOpen && advancedContent && mode === 'connected' && definition.implemented ? (
        <div className="border-t border-border bg-muted/20 px-5 py-4">{advancedContent}</div>
      ) : null}
    </div>
  )
}
