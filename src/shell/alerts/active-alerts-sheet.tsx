import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Gauge, Package } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { AlertItemApi, AlertPostponeDuration } from '@/lib/types/alerts'
import { cn } from '@/lib/utils'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Skeleton } from '@/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'
import { SheetRowButton, sheetRowButtonClassName } from '@/ui/sheet-row'

import {
  alertChannelName,
  alertProductChannelLine,
  alertTypeName,
  type AlertSeverityFilter,
} from './alert-display'

type AlertTab = 'active' | 'postponed'

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

function severityBadgeVariant(severity: AlertItemApi['severity']): 'error' | 'warning' | 'secondary' {
  if (severity === 'critical') return 'error'
  if (severity === 'low') return 'warning'
  return 'secondary'
}

function filterItems(items: AlertItemApi[], severityFilter: AlertSeverityFilter): AlertItemApi[] {
  if (severityFilter === 'all') return items
  return items.filter((item) => item.severity === severityFilter)
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

function AlertSeverityFilterBar({
  value,
  onChange,
  t,
}: {
  value: AlertSeverityFilter
  onChange: (value: AlertSeverityFilter) => void
  t: (key: ShellStringKey) => string
}) {
  const options: { id: AlertSeverityFilter; label: string }[] = [
    { id: 'all', label: t('homeAlertsSheetFilterAll') },
    { id: 'critical', label: t('homeAlertsSheetFilterCritical') },
    { id: 'low', label: t('homeAlertsSheetFilterLow') },
    { id: 'informational', label: t('homeAlertsSheetFilterInfo') },
  ]

  return (
    <div
      className="flex shrink-0 flex-wrap gap-2 border-b border-border-subtle px-6 py-3"
      role="group"
      aria-label={t('homeAlertsSheetFilterAria')}
    >
      {options.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          className={cn(
            'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
            value === id
              ? 'border-foreground bg-foreground text-background'
              : 'border-border-default bg-bg-elevated text-muted-foreground hover:border-border-strong hover:bg-muted hover:text-foreground',
          )}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
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
  const channelName = alertChannelName(item, connectionPlatformById, t)
  const headline = alertTypeName(t, item)
  const subtitle = alertProductChannelLine(item, channelName)

  return (
    <SheetRowButton onClick={() => onSelect(item.id)}>
      <Icon
        className={cn(
          'size-4 shrink-0',
          item.severity === 'critical'
            ? 'text-[var(--stock-alert-critical)]'
            : 'text-[var(--stock-alert-warning)]',
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{headline}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
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

function AlertDetailView({
  item,
  connectionPlatformById,
  isAdmin,
  postponePending,
  isPostponedSection,
  onBack,
  onPostpone,
  t,
}: {
  item: AlertItemApi
  connectionPlatformById: ReadonlyMap<string, string>
  isAdmin: boolean
  postponePending: boolean
  isPostponedSection: boolean
  onBack: () => void
  onPostpone: (alertId: string, duration: AlertPostponeDuration) => void
  t: (key: ShellStringKey) => string
}) {
  const stock = payloadNumber(item.payload, 'stock_quantity')
  const sold = payloadNumber(item.payload, 'prev_month_units_sold')
  const productHref = item.product_id ? `/dashboard/products/${item.product_id}` : null
  const channelName = alertChannelName(item, connectionPlatformById, t)
  const headline = alertTypeName(t, item)
  const productChannelLine = alertProductChannelLine(item, channelName)

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
      <div className="flex items-start gap-2 border-b border-border-subtle px-5 py-4 pr-14">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="mt-0.5 shrink-0"
          onClick={onBack}
          aria-label={t('homeAlertsSheetBackToList')}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <h2 className="min-w-0 flex-1 text-base font-semibold leading-snug text-foreground">
              {headline}
            </h2>
            <Badge
              variant={severityBadgeVariant(item.severity)}
              className="h-5 shrink-0 rounded-md px-1.5 text-[10px] font-semibold tracking-wide uppercase"
            >
              {severityBadgeLabel(t, item.severity)}
            </Badge>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{productChannelLine}</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <AlertDetailSection title={t('homeAlertsSheetEntity')}>
          <span className="inline-flex max-w-full items-center gap-2 rounded-md border border-border-subtle bg-muted/30 px-2.5 py-1.5 text-xs text-foreground">
            <Package className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{productChannelLine}</span>
          </span>
        </AlertDetailSection>

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
          <div className="flex flex-col gap-3">
            {isAdmin && !isPostponedSection ? (
              <div className="flex flex-wrap gap-2">
                {(['1h', '1d', '1w'] as const).map((duration) => (
                  <Button
                    key={duration}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={postponePending}
                    onClick={() => onPostpone(item.id, duration)}
                  >
                    {t(
                      duration === '1h'
                        ? 'homeAlertsDialogPostpone1h'
                        : duration === '1d'
                          ? 'homeAlertsDialogPostpone1d'
                          : 'homeAlertsDialogPostpone1w',
                    )}
                  </Button>
                ))}
              </div>
            ) : null}
            {productHref ? (
              <Button variant="outline" size="sm" className="w-fit" render={<Link to={productHref} />}>
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
  tab,
  onTabChange,
  items,
  loading,
  emptyLabel,
  filterEmptyLabel,
  severityFilter,
  onSeverityFilterChange,
  connectionPlatformById,
  onSelect,
  t,
}: {
  tab: AlertTab
  onTabChange: (tab: AlertTab) => void
  items: AlertItemApi[]
  loading: boolean
  emptyLabel: string
  filterEmptyLabel: string
  severityFilter: AlertSeverityFilter
  onSeverityFilterChange: (value: AlertSeverityFilter) => void
  connectionPlatformById: ReadonlyMap<string, string>
  onSelect: (id: string) => void
  t: (key: ShellStringKey) => string
}) {
  const tabs: { id: AlertTab; label: string }[] = [
    { id: 'active', label: t('homeAlertsDialogActiveSection') },
    { id: 'postponed', label: t('homeAlertsDialogPostponedSection') },
  ]

  const filteredItems = useMemo(
    () => filterItems(items, severityFilter),
    [items, severityFilter],
  )

  const listEmptyLabel =
    items.length > 0 && filteredItems.length === 0 ? filterEmptyLabel : emptyLabel

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="shrink-0">
        <SheetTitle>{t('homeAlertsDialogTitle')}</SheetTitle>
        <SheetDescription>{t('homeAlertsDialogDescription')}</SheetDescription>
      </SheetHeader>

      <div
        className="flex shrink-0 gap-6 border-b border-border-subtle px-6"
        role="tablist"
        aria-label={t('homeAlertsDialogTitle')}
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={cn(
              '-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors',
              tab === id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onTabChange(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <AlertSeverityFilterBar value={severityFilter} onChange={onSeverityFilterChange} t={t} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <AlertListSkeleton />
        ) : filteredItems.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">{listEmptyLabel}</p>
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
  const [tab, setTab] = useState<AlertTab>('active')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<AlertSeverityFilter>('all')

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedId(null)
      setTab('active')
      setSeverityFilter('all')
    }
    onOpenChange(nextOpen)
  }

  const handleTabChange = (nextTab: AlertTab) => {
    setTab(nextTab)
    setSeverityFilter('all')
  }

  const items = tab === 'active' ? activeItems : postponedItems
  const loading = tab === 'active' ? activeLoading : postponedLoading
  const emptyLabel =
    tab === 'active' ? t('homeAlertsDialogActiveEmpty') : t('homeAlertsDialogPostponedEmpty')
  const filterEmptyLabel = t('homeAlertsSheetFilterEmpty')

  const selectedItem = useMemo(() => {
    if (!selectedId) return null
    return [...activeItems, ...postponedItems].find((item) => item.id === selectedId) ?? null
  }, [activeItems, postponedItems, selectedId])

  const handlePostpone = (alertId: string, duration: AlertPostponeDuration) => {
    onPostpone(alertId, duration)
    setSelectedId(null)
    setTab('postponed')
    setSeverityFilter('all')
  }

  const showDetail = selectedItem !== null

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full max-w-xl flex-col overflow-hidden sm:max-w-xl">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className={cn(
              'absolute inset-0 flex flex-col transition-transform duration-300 ease-out motion-reduce:transition-none',
              showDetail ? '-translate-x-full' : 'translate-x-0',
            )}
          >
            <AlertListView
              tab={tab}
              onTabChange={handleTabChange}
              items={items}
              loading={loading}
              emptyLabel={emptyLabel}
              filterEmptyLabel={filterEmptyLabel}
              severityFilter={severityFilter}
              onSeverityFilterChange={setSeverityFilter}
              connectionPlatformById={connectionPlatformById}
              onSelect={setSelectedId}
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
                isPostponedSection={tab === 'postponed'}
                onBack={() => setSelectedId(null)}
                onPostpone={handlePostpone}
                t={t}
              />
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
