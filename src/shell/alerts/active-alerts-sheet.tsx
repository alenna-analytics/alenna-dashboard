import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gauge,
  Package,
  X,
  type LucideIcon,
} from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { AlertItemApi, AlertPostponeDuration } from '@/lib/types/alerts'
import { matchSuggestionIdFromPayload } from '@/pages/dashboard/home-permission-flags'
import { PRODUCTS_LINKING_PATH } from '@/pages/products/products-inner-nav'
import { cn } from '@/lib/utils'
import { StatusPill } from '@/ui/status-pill'
import { Button, buttonVariants } from '@/ui/button'
import { EmptyState } from '@/ui/empty-state'
import { ProductPlatformLogoName } from '@/pages/products/product-platform-logo-name'
import { AppIcon, LoadingIcon } from '@/ui/app-icon'
import { EmbeddedShellPanel } from '@/ui/embedded-shell-panel'
import { Skeleton } from '@/ui/skeleton'
import { SheetRowButton, sheetRowButtonClassName } from '@/ui/sheet-row'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

import {
  alertPlatformSlug,
  alertProductTitle,
  alertTypeName,
} from './alert-display'
import {
  DEFAULT_ALERTS_LIST_FILTERS,
  filterAlertsByListFilters,
  uniqueAlertChannelSlugs,
  type AlertKindFilter,
  type AlertsListFilters,
} from './alerts-filter'
import { AlertsFiltersToolbar } from './alerts-filter-menu'

const alertPanelIconButtonClassName = 'size-7 shrink-0 [&_svg]:size-4'

type ActiveAlertsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeItems: AlertItemApi[]
  postponedItems: AlertItemApi[]
  activeTotal: number
  postponedTotal: number
  activeLoading: boolean
  postponedLoading: boolean
  isAdmin: boolean
  canLinkProducts?: boolean
  postponePending: boolean
  linkPending?: boolean
  rejectPending?: boolean
  connectionPlatformById: ReadonlyMap<string, string>
  onPostpone: (alertId: string, duration: AlertPostponeDuration) => void
  onAcceptMatch?: (suggestionId: string) => void
  onRejectMatch?: (suggestionId: string) => void
  /** Apply this kind filter when the sheet opens (e.g. from Home match banner). */
  initialKind?: AlertKindFilter | null
  onInitialKindConsumed?: () => void
  t: (key: ShellStringKey) => string
}

function payloadNumber(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function severityBadgeLabel(
  t: (key: ShellStringKey) => string,
  severity: AlertItemApi['severity'],
): string {
  if (severity === 'critical') return t('homeAlertsSheetSeverityCritical')
  if (severity === 'low') return t('homeAlertsSheetSeverityLow')
  return t('homeAlertsSheetSeverityInformational')
}

function severityStatusPillVariant(
  severity: AlertItemApi['severity'],
): 'error' | 'warning' | 'neutral' {
  if (severity === 'critical') return 'error'
  if (severity === 'low') return 'warning'
  return 'neutral'
}

function AlertListSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className={sheetRowButtonClassName('pointer-events-none')}>
          <Skeleton className="size-4 shrink-0 rounded-sm" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-[min(100%,14rem)]" />
            <Skeleton className="h-3 w-[min(100%,9rem)]" />
          </div>
          <Skeleton className="size-4 shrink-0 rounded-sm" />
        </div>
      ))}
    </div>
  )
}

function AlertChannelMark({
  item,
  connectionPlatformById,
  t,
}: {
  item: AlertItemApi
  connectionPlatformById: ReadonlyMap<string, string>
  t: (key: ShellStringKey) => string
}) {
  const slug = alertPlatformSlug(item, connectionPlatformById)
  if (!slug) return null
  return (
    <ProductPlatformLogoName
      platformSlug={slug}
      t={t}
      className="shrink-0"
      logoClassName="size-3.5"
      textClassName="text-xs text-muted-foreground"
    />
  )
}

function AlertProductChannelLine({
  item,
  connectionPlatformById,
  t,
  className,
}: {
  item: AlertItemApi
  connectionPlatformById: ReadonlyMap<string, string>
  t: (key: ShellStringKey) => string
  className?: string
}) {
  const slug = alertPlatformSlug(item, connectionPlatformById)
  return (
    <div className={cn('flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground', className)}>
      {slug ? (
        <>
          <AlertChannelMark
            item={item}
            connectionPlatformById={connectionPlatformById}
            t={t}
          />
          <span className="shrink-0" aria-hidden>
            ·
          </span>
        </>
      ) : null}
      <p className="min-w-0 truncate">{alertProductTitle(item)}</p>
    </div>
  )
}

function AlertListToolbar({
  filters,
  onFiltersChange,
  channelSlugs,
  countLabel,
  onClose,
  closeAriaLabel,
  t,
}: {
  filters: AlertsListFilters
  onFiltersChange: (patch: Partial<AlertsListFilters>) => void
  channelSlugs: string[]
  countLabel: string | null
  onClose: () => void
  closeAriaLabel: string
  t: (key: ShellStringKey) => string
}) {
  return (
    <div className="shrink-0">
      <div className="flex min-h-10 shrink-0 items-center gap-2 border-b border-border-subtle px-6 py-2">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex min-w-max items-center">
            <AlertsFiltersToolbar
              filters={filters}
              onFiltersChange={onFiltersChange}
              channelSlugs={channelSlugs}
              t={t}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={alertPanelIconButtonClassName}
          onClick={onClose}
          aria-label={closeAriaLabel}
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>
      {countLabel ? (
        <div className="flex h-8 shrink-0 items-center border-b border-border-subtle px-6">
          <p className="min-w-0 truncate font-numeric text-xs tabular-nums text-text-tertiary">
            {countLabel}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function AlertListRow({
  item,
  connectionPlatformById,
  onSelect,
  t,
}: {
  item: AlertItemApi
  connectionPlatformById: ReadonlyMap<string, string>
  onSelect: (id: string) => void
  t: (key: ShellStringKey) => string
}) {
  const headline = alertTypeName(t, item)
  const iconToneClass =
    item.severity === 'critical'
      ? 'text-[var(--stock-alert-critical)]'
      : item.severity === 'low'
        ? 'text-[var(--stock-alert-warning)]'
        : 'text-[var(--info)]'

  return (
    <SheetRowButton onClick={() => onSelect(item.id)}>
      {item.alert_type === 'stock' ? (
        <AppIcon name="orders" colorize className={cn('size-4 shrink-0', iconToneClass)} />
      ) : (
        <Gauge className={cn('size-4 shrink-0', iconToneClass)} aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-foreground">{headline}</p>
        <AlertProductChannelLine
          item={item}
          connectionPlatformById={connectionPlatformById}
          t={t}
          className="mt-0.5"
        />
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </SheetRowButton>
  )
}

function AlertDetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

const ALERT_POSTPONE_DURATIONS = ['1h', '1d', '1w'] as const satisfies readonly AlertPostponeDuration[]

const alertPostponeLabelKey: Record<AlertPostponeDuration, ShellStringKey> = {
  '1h': 'homeAlertsDialogPostpone1h',
  '1d': 'homeAlertsDialogPostpone1d',
  '1w': 'homeAlertsDialogPostpone1w',
}

const alertPostponeDurationIcon: Record<AlertPostponeDuration, LucideIcon> = {
  '1h': Clock,
  '1d': Calendar,
  '1w': CalendarDays,
}

function AlertPostponeButton({
  postponePending,
  onPostpone,
  t,
}: {
  postponePending: boolean
  onPostpone: (duration: AlertPostponeDuration) => void
  t: (key: ShellStringKey) => string
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger
        type="button"
        disabled={postponePending}
        className={cn(buttonVariants({ variant: 'inverse', size: 'tiny' }), 'gap-1')}
        aria-busy={postponePending || undefined}
        aria-label={t('productsDetailStockAlertPostponeAria')}
      >
        {postponePending ? (
          <>
            <LoadingIcon className="size-3.5 shrink-0 text-white" />
            <span>{t('productsDetailStockAlertPostponeLoading')}</span>
          </>
        ) : (
          <>
            <span>{t('productsDetailStockAlertPostpone')}</span>
            <ChevronDown className="size-3.5 shrink-0 text-white/80" aria-hidden />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {ALERT_POSTPONE_DURATIONS.map((duration) => {
          const Icon = alertPostponeDurationIcon[duration]
          return (
            <DropdownMenuItem
              key={duration}
              disabled={postponePending}
              className="gap-2"
              onClick={() => {
                setMenuOpen(false)
                onPostpone(duration)
              }}
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {t(alertPostponeLabelKey[duration])}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AlertDetailView({
  item,
  connectionPlatformById,
  isAdmin,
  canLinkProducts,
  postponePending,
  linkPending,
  rejectPending,
  isPostponedSection,
  onBack,
  onClosePanel,
  onPostpone,
  onAcceptMatch,
  onRejectMatch,
  t,
}: {
  item: AlertItemApi
  connectionPlatformById: ReadonlyMap<string, string>
  isAdmin: boolean
  canLinkProducts: boolean
  postponePending: boolean
  linkPending: boolean
  rejectPending: boolean
  isPostponedSection: boolean
  onBack: () => void
  onClosePanel: () => void
  onPostpone: (alertId: string, duration: AlertPostponeDuration) => void
  onAcceptMatch: (suggestionId: string) => void
  onRejectMatch: (suggestionId: string) => void
  t: (key: ShellStringKey) => string
}) {
  const stock = payloadNumber(item.payload, 'stock_quantity')
  const sold = payloadNumber(item.payload, 'prev_month_units_sold')
  const isMatch = item.alert_type === 'match_suggestion'
  const suggestionId = isMatch ? matchSuggestionIdFromPayload(item.payload) : null
  const productHref = isMatch
    ? PRODUCTS_LINKING_PATH
    : item.product_id
      ? `/dashboard/products/${item.product_id}`
      : null
  const headline = alertTypeName(t, item)
  const productTitle = alertProductTitle(item)
  const channelSlug = alertPlatformSlug(item, connectionPlatformById)
  const showMatchActions = isMatch && canLinkProducts && suggestionId !== null && !isPostponedSection

  const issueText =
    item.severity === 'critical'
      ? t('homeAlertsSheetIssueCritical')
          .replace('{stock}', stock !== null ? String(stock) : '—')
          .replace('{sold}', sold !== null ? String(sold) : '—')
      : t('homeAlertsSheetIssueLow')
          .replace('{stock}', stock !== null ? String(stock) : '—')
          .replace('{sold}', sold !== null ? String(sold) : '—')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(alertPanelIconButtonClassName, 'self-center')}
          onClick={onBack}
          aria-label={t('homeAlertsSheetBackToList')}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1 overflow-hidden">
          <h2 className="truncate text-sm font-semibold leading-snug text-foreground">{headline}</h2>
        </div>
        <StatusPill
          variant={severityStatusPillVariant(item.severity)}
          className="h-5 shrink-0 self-center rounded-md px-1.5 text-[10px] font-semibold tracking-wide uppercase"
        >
          {severityBadgeLabel(t, item.severity)}
        </StatusPill>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(alertPanelIconButtonClassName, 'self-center')}
          onClick={onClosePanel}
          aria-label={t('productsDetailSheetCancel')}
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <AlertDetailSection title={t('homeAlertsSheetEntity')}>
          <span className="inline-flex max-w-full items-center gap-2 rounded-md border border-border-subtle bg-muted/30 px-2.5 py-1.5 text-xs text-foreground">
            <Package className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 truncate">{productTitle}</span>
          </span>
        </AlertDetailSection>

        {channelSlug ? (
          <AlertDetailSection title={t('homeAlertsSheetChannel')}>
            <ProductPlatformLogoName
              platformSlug={channelSlug}
              t={t}
              logoClassName="size-3.5"
              textClassName="text-sm text-muted-foreground"
            />
          </AlertDetailSection>
        ) : null}

        {!isMatch ? (
          <AlertDetailSection title={t('homeAlertsSheetIssue')}>{issueText}</AlertDetailSection>
        ) : null}

        <AlertDetailSection title={t('homeAlertsSheetDescription')}>
          {isMatch ? t('productsVinculacionSubtitle') : t('homeAlertsSheetDescriptionStock')}
        </AlertDetailSection>

        {isPostponedSection && item.postponed_until ? (
          <AlertDetailSection title={t('homeAlertsSheetPostponedUntil')}>
            {new Date(item.postponed_until).toLocaleString()}
          </AlertDetailSection>
        ) : null}

        <AlertDetailSection title={t('homeAlertsSheetResolve')}>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && !isPostponedSection ? (
              <AlertPostponeButton
                postponePending={postponePending}
                onPostpone={(duration) => onPostpone(item.id, duration)}
                t={t}
              />
            ) : null}
            {showMatchActions ? (
              <>
                <Button
                  variant="outline"
                  size="tiny"
                  loading={rejectPending}
                  disabled={linkPending || rejectPending}
                  onClick={() => onRejectMatch(suggestionId)}
                >
                  {t('homeAlertsSheetRejectMatch')}
                </Button>
                <Button
                  variant="accent"
                  size="tiny"
                  loading={linkPending}
                  disabled={linkPending || rejectPending}
                  onClick={() => onAcceptMatch(suggestionId)}
                >
                  {t('homeAlertsSheetLinkProducts')}
                </Button>
              </>
            ) : null}
            {productHref ? (
              <Button
                variant={showMatchActions ? 'outline' : 'accent'}
                size="tiny"
                render={<Link to={productHref} />}
              >
                {isMatch ? t('homeAlertsDialogViewMatches') : t('homeAlertsDialogViewProduct')}
              </Button>
            ) : null}
          </div>
        </AlertDetailSection>
      </div>
    </div>
  )
}

function AlertListView({
  filters,
  onFiltersChange,
  items,
  sectionTotal,
  loading,
  emptyLabel,
  filterEmptyLabel,
  channelSlugs,
  connectionPlatformById,
  onSelect,
  onClose,
  t,
}: {
  filters: AlertsListFilters
  onFiltersChange: (patch: Partial<AlertsListFilters>) => void
  items: AlertItemApi[]
  sectionTotal: number
  loading: boolean
  emptyLabel: string
  filterEmptyLabel: string
  channelSlugs: string[]
  connectionPlatformById: ReadonlyMap<string, string>
  onSelect: (id: string) => void
  onClose: () => void
  t: (key: ShellStringKey) => string
}) {
  const filteredItems = useMemo(
    () => filterAlertsByListFilters(items, filters, connectionPlatformById),
    [items, filters, connectionPlatformById],
  )

  const listEmptyLabel =
    items.length > 0 && filteredItems.length === 0 ? filterEmptyLabel : emptyLabel

  const filtersNarrowList =
    filters.severity !== 'all' || filters.kind !== 'all' || filters.channel !== 'all'
  const unfilteredCount = Math.max(sectionTotal, items.length)
  const countLabel = loading
    ? null
    : filtersNarrowList
      ? t('homeAlertsSheetCountFiltered')
          .replace('{shown}', String(filteredItems.length))
          .replace('{total}', String(unfilteredCount))
      : t('homeAlertsSheetCount').replace('{count}', String(unfilteredCount))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AlertListToolbar
        filters={filters}
        onFiltersChange={onFiltersChange}
        channelSlugs={channelSlugs}
        countLabel={countLabel}
        onClose={onClose}
        closeAriaLabel={t('productsDetailSheetCancel')}
        t={t}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <AlertListSkeleton />
        ) : filteredItems.length === 0 ? (
          <div className="flex h-full min-h-[12rem] p-6">
            <EmptyState
              size="sm"
              icon="notifications"
              title={listEmptyLabel}
              className="h-full min-h-0 flex-1"
            />
          </div>
        ) : (
          filteredItems.map((item) => (
            <AlertListRow
              key={item.id}
              item={item}
              connectionPlatformById={connectionPlatformById}
              onSelect={onSelect}
              t={t}
            />
          ))
        )}
      </div>
    </div>
  )
}

export function ActiveAlertsSheet({
  open,
  onOpenChange,
  activeItems,
  postponedItems,
  activeTotal,
  postponedTotal,
  activeLoading,
  postponedLoading,
  isAdmin,
  canLinkProducts = false,
  postponePending,
  linkPending = false,
  rejectPending = false,
  connectionPlatformById,
  onPostpone,
  onAcceptMatch,
  onRejectMatch,
  initialKind = null,
  onInitialKindConsumed,
  t,
}: ActiveAlertsSheetProps) {
  const [filters, setFilters] = useState<AlertsListFilters>(DEFAULT_ALERTS_LIST_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [prevOpen, setPrevOpen] = useState(open)
  const [prevInitialKind, setPrevInitialKind] = useState(initialKind)

  if (open !== prevOpen || initialKind !== prevInitialKind) {
    setPrevOpen(open)
    setPrevInitialKind(initialKind)
    if (open && initialKind) {
      setFilters({ ...DEFAULT_ALERTS_LIST_FILTERS, kind: initialKind })
      setSelectedId(null)
      onInitialKindConsumed?.()
    } else if (!open) {
      setSelectedId(null)
      setFilters(DEFAULT_ALERTS_LIST_FILTERS)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedId(null)
      setFilters(DEFAULT_ALERTS_LIST_FILTERS)
    }
    onOpenChange(nextOpen)
  }

  const handleFiltersChange = (patch: Partial<AlertsListFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  const items = filters.lifecycle === 'active' ? activeItems : postponedItems
  const sectionTotal = filters.lifecycle === 'active' ? activeTotal : postponedTotal
  const loading = filters.lifecycle === 'active' ? activeLoading : postponedLoading
  const emptyLabel =
    filters.lifecycle === 'active'
      ? t('homeAlertsDialogActiveEmpty')
      : t('homeAlertsDialogPostponedEmpty')
  const filterEmptyLabel = t('homeAlertsSheetFilterEmpty')
  const channelSlugs = useMemo(
    () => uniqueAlertChannelSlugs([...activeItems, ...postponedItems], connectionPlatformById),
    [activeItems, postponedItems, connectionPlatformById],
  )

  const selectedItem = useMemo(() => {
    if (!selectedId) return null
    return [...activeItems, ...postponedItems].find((item) => item.id === selectedId) ?? null
  }, [activeItems, postponedItems, selectedId])

  const handlePostpone = (alertId: string, duration: AlertPostponeDuration) => {
    onPostpone(alertId, duration)
    setSelectedId(null)
    setFilters((prev) => ({ ...prev, lifecycle: 'postponed' }))
  }

  const handleAcceptMatch = (suggestionId: string) => {
    onAcceptMatch?.(suggestionId)
    setSelectedId(null)
  }

  const handleRejectMatch = (suggestionId: string) => {
    onRejectMatch?.(suggestionId)
    setSelectedId(null)
  }

  const showDetail = selectedItem !== null

  return (
    <EmbeddedShellPanel
      open={open}
      onOpenChange={handleOpenChange}
      closeAriaLabel={t('productsDetailSheetCancel')}
      hideCloseButton
    >
      <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className={cn(
            'absolute inset-0 flex flex-col transition-transform duration-300 ease-out motion-reduce:transition-none',
            showDetail ? '-translate-x-full' : 'translate-x-0',
          )}
        >
          <AlertListView
            filters={filters}
            onFiltersChange={handleFiltersChange}
            items={items}
            sectionTotal={sectionTotal}
            loading={loading}
            emptyLabel={emptyLabel}
            filterEmptyLabel={filterEmptyLabel}
            channelSlugs={channelSlugs}
            connectionPlatformById={connectionPlatformById}
            onSelect={setSelectedId}
            onClose={() => handleOpenChange(false)}
            t={t}
          />
        </div>
        <div
          className={cn(
            'absolute inset-0 flex flex-col transition-transform duration-300 ease-out motion-reduce:transition-none',
            showDetail ? 'translate-x-0' : 'translate-x-full',
          )}
          aria-hidden={!showDetail}
        >
          {selectedItem ? (
            <AlertDetailView
              item={selectedItem}
              connectionPlatformById={connectionPlatformById}
              isAdmin={isAdmin}
              canLinkProducts={canLinkProducts}
              postponePending={postponePending}
              linkPending={linkPending}
              rejectPending={rejectPending}
              isPostponedSection={filters.lifecycle === 'postponed'}
              onBack={() => setSelectedId(null)}
              onClosePanel={() => handleOpenChange(false)}
              onPostpone={handlePostpone}
              onAcceptMatch={handleAcceptMatch}
              onRejectMatch={handleRejectMatch}
              t={t}
            />
          ) : null}
        </div>
      </div>
    </EmbeddedShellPanel>
  )
}
