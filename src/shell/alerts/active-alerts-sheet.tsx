import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Gauge, Package } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { AlertItemApi, AlertPostponeDuration, AlertSection, AlertSeverity } from '@/lib/types/alerts'
import { cn } from '@/lib/utils'
import { StatusPill } from '@/ui/status-pill'
import { Button } from '@/ui/button'
import { FilterComboboxSingle } from '@/ui/filters/filter-combobox-single'
import { EmbeddedShellPanel } from '@/ui/embedded-shell-panel'
import { Skeleton } from '@/ui/skeleton'
import { SheetRowButton, sheetRowButtonClassName } from '@/ui/sheet-row'

import {
  alertChannelName,
  alertProductChannelLine,
  alertTypeName,
} from './alert-display'

type SeverityTabConfig = {
  id: AlertSeverity
  labelKey: ShellStringKey
  activeBorderColor: string
}

const SEVERITY_TABS: SeverityTabConfig[] = [
  { id: 'critical', labelKey: 'homeAlertsSheetFilterCritical', activeBorderColor: 'var(--stock-alert-critical)' },
  { id: 'low', labelKey: 'homeAlertsSheetFilterLow', activeBorderColor: 'var(--stock-alert-warning)' },
  { id: 'informational', labelKey: 'homeAlertsSheetFilterInfo', activeBorderColor: 'var(--info)' },
]

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

function filterItemsBySeverity(items: AlertItemApi[], severity: AlertSeverity): AlertItemApi[] {
  return items.filter((item) => item.severity === severity)
}

function AlertPanelHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="shrink-0 border-b border-border-subtle px-6 py-4 pr-14">
      <h2 className="font-heading text-base font-semibold text-text-primary">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
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

function AlertTabsToolbar({
  severityTab,
  onSeverityTabChange,
  statusFilter,
  onStatusFilterChange,
  t,
}: {
  severityTab: AlertSeverity
  onSeverityTabChange: (value: AlertSeverity) => void
  statusFilter: AlertSection
  onStatusFilterChange: (value: AlertSection) => void
  t: (key: ShellStringKey) => string
}) {
  return (
    <div className="flex min-h-12 shrink-0 items-stretch justify-between gap-4 border-b border-border-subtle px-6">
      <div
        className="flex min-w-0 flex-1 gap-6 self-stretch"
        role="tablist"
        aria-label={t('homeAlertsSheetSeverityTabsAria')}
      >
        {SEVERITY_TABS.map(({ id, labelKey, activeBorderColor }) => {
          const selected = severityTab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn(
                '-mb-px flex items-center border-b-2 px-0 text-sm font-medium transition-colors',
                selected ? 'text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
              style={selected ? { borderBottomColor: activeBorderColor } : undefined}
              onClick={() => onSeverityTabChange(id)}
            >
              {t(labelKey)}
            </button>
          )
        })}
      </div>

      <div className="flex shrink-0 items-center">
        <FilterComboboxSingle
          label={t('homeAlertsSheetStatusLabel')}
          options={[
            { value: 'active', label: t('homeAlertsDialogActiveSection') },
            { value: 'postponed', label: t('homeAlertsDialogPostponedSection') },
          ]}
          value={statusFilter}
          onValueChange={(next) => {
            if (next === 'active' || next === 'postponed') onStatusFilterChange(next)
          }}
          selectionMode="single"
          searchPlaceholder={t('filterSearch')}
          emptyLabel={t('filterComingSoon')}
          allowClear={false}
          popoverSide="bottom"
        />
      </div>
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
            : item.severity === 'low'
              ? 'text-[var(--stock-alert-warning)]'
              : 'text-[var(--info)]',
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
            <StatusPill
              variant={severityStatusPillVariant(item.severity)}
              className="h-5 shrink-0 rounded-md px-1.5 text-[10px] font-semibold tracking-wide uppercase"
            >
              {severityBadgeLabel(t, item.severity)}
            </StatusPill>
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
  statusFilter,
  onStatusFilterChange,
  severityTab,
  onSeverityTabChange,
  items,
  loading,
  emptyLabel,
  filterEmptyLabel,
  connectionPlatformById,
  onSelect,
  t,
}: {
  statusFilter: AlertSection
  onStatusFilterChange: (value: AlertSection) => void
  severityTab: AlertSeverity
  onSeverityTabChange: (value: AlertSeverity) => void
  items: AlertItemApi[]
  loading: boolean
  emptyLabel: string
  filterEmptyLabel: string
  connectionPlatformById: ReadonlyMap<string, string>
  onSelect: (id: string) => void
  t: (key: ShellStringKey) => string
}) {
  const filteredItems = useMemo(
    () => filterItemsBySeverity(items, severityTab),
    [items, severityTab],
  )

  const listEmptyLabel =
    items.length > 0 && filteredItems.length === 0 ? filterEmptyLabel : emptyLabel

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AlertPanelHeader
        title={t('homeAlertsDialogTitle')}
        description={t('homeAlertsDialogDescription')}
      />

      <AlertTabsToolbar
        severityTab={severityTab}
        onSeverityTabChange={onSeverityTabChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        t={t}
      />

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
  const [statusFilter, setStatusFilter] = useState<AlertSection>('active')
  const [severityTab, setSeverityTab] = useState<AlertSeverity>('critical')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedId(null)
      setStatusFilter('active')
      setSeverityTab('critical')
    }
    onOpenChange(nextOpen)
  }

  const items = statusFilter === 'active' ? activeItems : postponedItems
  const loading = statusFilter === 'active' ? activeLoading : postponedLoading
  const emptyLabel =
    statusFilter === 'active' ? t('homeAlertsDialogActiveEmpty') : t('homeAlertsDialogPostponedEmpty')
  const filterEmptyLabel = t('homeAlertsSheetFilterEmpty')

  const selectedItem = useMemo(() => {
    if (!selectedId) return null
    return [...activeItems, ...postponedItems].find((item) => item.id === selectedId) ?? null
  }, [activeItems, postponedItems, selectedId])

  const handlePostpone = (alertId: string, duration: AlertPostponeDuration) => {
    onPostpone(alertId, duration)
    setSelectedId(null)
    setStatusFilter('postponed')
  }

  const showDetail = selectedItem !== null

  return (
    <EmbeddedShellPanel
      open={open}
      onOpenChange={handleOpenChange}
      closeAriaLabel={t('productsDetailSheetCancel')}
    >
      <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className={cn(
            'absolute inset-0 flex flex-col transition-transform duration-300 ease-out motion-reduce:transition-none',
            showDetail ? '-translate-x-full' : 'translate-x-0',
          )}
        >
          <AlertListView
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            severityTab={severityTab}
            onSeverityTabChange={setSeverityTab}
            items={items}
            loading={loading}
            emptyLabel={emptyLabel}
            filterEmptyLabel={filterEmptyLabel}
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
              isPostponedSection={statusFilter === 'postponed'}
              onBack={() => setSelectedId(null)}
              onPostpone={handlePostpone}
              t={t}
            />
          ) : null}
        </div>
      </div>
    </EmbeddedShellPanel>
  )
}
