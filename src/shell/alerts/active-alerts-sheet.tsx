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
import { cn } from '@/lib/utils'
import { StatusPill } from '@/ui/status-pill'
import { Button, buttonVariants } from '@/ui/button'
import { EmptyState } from '@/ui/empty-state'
import { ProductPlatformLogoName } from '@/pages/products/product-platform-logo-name'
import { LoadingIcon } from '@/ui/app-icon'
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
  type AlertsListFilters,
} from './alerts-filter'
import { AlertsFiltersToolbar } from './alerts-filter-menu'

const alertPanelIconButtonClassName = 'size-7 shrink-0 [&_svg]:size-4'

type ActiveAlertsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeItems: AlertItemApi[]
  postponedItems: AlertItemApi[]
  activeLoading: boolean
  postponedLoading: boolean
  isAdmin: boolean
  postponePending: boolean
  connectionPlatformById: ReadonlyMap<string, string>
  onPostpone: (alertId: string, duration: AlertPostponeDuration) => void
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
  onClose,
  closeAriaLabel,
  t,
}: {
  filters: AlertsListFilters
  onFiltersChange: (patch: Partial<AlertsListFilters>) => void
  channelSlugs: string[]
  onClose: () => void
  closeAriaLabel: string
  t: (key: ShellStringKey) => string
}) {
  return (
    <div className="flex min-h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-6 py-3">
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
  const Icon = item.severity === 'critical' ? Package : Gauge
  const headline = alertTypeName(t, item)

  return (
    <SheetRowButton onClick={() => onSelect(item.id)}>
      <Icon
        className={cn(
          'size-4 shrink-0',
          item.severity === 'critical'
            ? 'text-[var(--stock-alert-critical)]'
            : item.severity === 'low'
              ? 'text-[var(--stock-alert-warning)]'
              : 'text-[var(--info)]',
        )}
        aria-hidden
      />
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
  postponePending,
  isPostponedSection,
  onBack,
  onClosePanel,
  onPostpone,
  t,
}: {
  item: AlertItemApi
  connectionPlatformById: ReadonlyMap<string, string>
  isAdmin: boolean
  postponePending: boolean
  isPostponedSection: boolean
  onBack: () => void
  onClosePanel: () => void
  onPostpone: (alertId: string, duration: AlertPostponeDuration) => void
  t: (key: ShellStringKey) => string
}) {
  const stock = payloadNumber(item.payload, 'stock_quantity')
  const sold = payloadNumber(item.payload, 'prev_month_units_sold')
  const productHref = item.product_id ? `/dashboard/products/${item.product_id}` : null
  const headline = alertTypeName(t, item)
  const productTitle = alertProductTitle(item)
  const channelSlug = alertPlatformSlug(item, connectionPlatformById)

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

        <AlertDetailSection title={t('homeAlertsSheetIssue')}>{issueText}</AlertDetailSection>

        <AlertDetailSection title={t('homeAlertsSheetDescription')}>
          {t('homeAlertsSheetDescriptionStock')}
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
            {productHref ? (
              <Button variant="accent" size="tiny" render={<Link to={productHref} />}>
                {t('homeAlertsDialogViewProduct')}
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AlertListToolbar
        filters={filters}
        onFiltersChange={onFiltersChange}
        channelSlugs={channelSlugs}
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
  activeLoading,
  postponedLoading,
  isAdmin,
  postponePending,
  connectionPlatformById,
  onPostpone,
  t,
}: ActiveAlertsSheetProps) {
  const [filters, setFilters] = useState<AlertsListFilters>(DEFAULT_ALERTS_LIST_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
              postponePending={postponePending}
              isPostponedSection={filters.lifecycle === 'postponed'}
              onBack={() => setSelectedId(null)}
              onClosePanel={() => handleOpenChange(false)}
              onPostpone={handlePostpone}
              t={t}
            />
          ) : null}
        </div>
      </div>
    </EmbeddedShellPanel>
  )
}
