import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Gauge, Package } from 'lucide-react'

import { LoadingIcon } from '@/ui/app-icon'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { AlertItemApi, AlertPostponeDuration } from '@/lib/types/alerts'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'

type AlertTab = 'active' | 'postponed'

type HomeActiveAlertsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeItems: AlertItemApi[]
  postponedItems: AlertItemApi[]
  activeLoading: boolean
  postponedLoading: boolean
  isAdmin: boolean
  postponePending: boolean
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

function severityBadgeClass(severity: AlertItemApi['severity']): string {
  if (severity === 'critical') {
    return 'border-[color:var(--stock-alert-critical)]/35 bg-[color:var(--stock-alert-critical)]/10 text-[color:var(--stock-alert-critical)]'
  }
  if (severity === 'low') {
    return 'border-[color:var(--stock-alert-warning)]/35 bg-[color:var(--stock-alert-warning)]/10 text-[color:var(--stock-alert-warning)]'
  }
  return 'border-border-subtle bg-muted/40 text-muted-foreground'
}

function listSubtitle(item: AlertItemApi): string {
  const parts = [item.platform, item.platform_sku].filter(Boolean)
  return parts.join(' · ') || item.entity_type
}

function AlertListRow({
  item,
  onSelect,
}: {
  item: AlertItemApi
  onSelect: (id: string) => void
}) {
  const Icon = item.severity === 'critical' ? Package : Gauge

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 border-b border-border-subtle px-6 py-3.5 text-left transition-colors hover:bg-muted/30"
      onClick={() => onSelect(item.id)}
    >
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
        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{listSubtitle(item)}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
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
  isAdmin,
  postponePending,
  isPostponedSection,
  onBack,
  onPostpone,
  t,
}: {
  item: AlertItemApi
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
  const entityLabel = listSubtitle(item)

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
      <div className="flex items-start gap-2 border-b border-border-subtle px-4 py-4 pr-14">
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
              {item.title}
            </h2>
            <span
              className={cn(
                'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                severityBadgeClass(item.severity),
              )}
            >
              {severityBadgeLabel(t, item.severity)}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{entityLabel}</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
        <AlertDetailSection title={t('homeAlertsSheetEntity')}>
          <span className="inline-flex max-w-full items-center gap-2 rounded-md border border-border-subtle bg-muted/30 px-2.5 py-1.5 font-mono text-xs text-foreground">
            <Package className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{entityLabel}</span>
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
  onSelect,
  t,
}: {
  tab: AlertTab
  onTabChange: (tab: AlertTab) => void
  items: AlertItemApi[]
  loading: boolean
  emptyLabel: string
  onSelect: (id: string) => void
  t: (key: ShellStringKey) => string
}) {
  const tabs: { id: AlertTab; label: string }[] = [
    { id: 'active', label: t('homeAlertsDialogActiveSection') },
    { id: 'postponed', label: t('homeAlertsDialogPostponedSection') },
  ]

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

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-muted-foreground">
            <LoadingIcon className="size-4" />
            {t('homeAlertsDialogLoading')}
          </div>
        ) : items.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <AlertListRow key={item.id} item={item} onSelect={onSelect} />
          ))
        )}
      </div>
    </div>
  )
}

export function HomeActiveAlertsSheet({
  open,
  onOpenChange,
  activeItems,
  postponedItems,
  activeLoading,
  postponedLoading,
  isAdmin,
  postponePending,
  onPostpone,
  t,
}: HomeActiveAlertsSheetProps) {
  const [tab, setTab] = useState<AlertTab>('active')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedId(null)
      setTab('active')
    }
    onOpenChange(nextOpen)
  }

  const items = tab === 'active' ? activeItems : postponedItems
  const loading = tab === 'active' ? activeLoading : postponedLoading
  const emptyLabel =
    tab === 'active' ? t('homeAlertsDialogActiveEmpty') : t('homeAlertsDialogPostponedEmpty')

  const selectedItem = useMemo(() => {
    if (!selectedId) return null
    return [...activeItems, ...postponedItems].find((item) => item.id === selectedId) ?? null
  }, [activeItems, postponedItems, selectedId])

  const handlePostpone = (alertId: string, duration: AlertPostponeDuration) => {
    onPostpone(alertId, duration)
    setSelectedId(null)
    setTab('postponed')
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full max-w-xl flex-col sm:max-w-xl">
        {selectedItem ? (
          <AlertDetailView
            item={selectedItem}
            isAdmin={isAdmin}
            postponePending={postponePending}
            isPostponedSection={tab === 'postponed'}
            onBack={() => setSelectedId(null)}
            onPostpone={handlePostpone}
            t={t}
          />
        ) : (
          <AlertListView
            tab={tab}
            onTabChange={setTab}
            items={items}
            loading={loading}
            emptyLabel={emptyLabel}
            onSelect={setSelectedId}
            t={t}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
