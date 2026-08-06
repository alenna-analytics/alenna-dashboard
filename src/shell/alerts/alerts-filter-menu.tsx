import { Bell, Clock, Gauge, Layers, Package } from 'lucide-react'
import { useMemo } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { AlertSection } from '@/lib/types/alerts'
import { cn } from '@/lib/utils'
import { FilterContextPill } from '@/ui/filters/filter-context-pill'

import {
  ALERT_KIND_OPTIONS,
  ALERT_LIFECYCLE_OPTIONS,
  ALERT_SEVERITY_OPTIONS,
  type AlertKindFilter,
  type AlertsListFilters,
  type AlertSeverityFilter,
} from './alerts-filter'

type AlertsFiltersToolbarProps = {
  filters: AlertsListFilters
  onFiltersChange: (patch: Partial<AlertsListFilters>) => void
  t: (key: ShellStringKey) => string
}

function SeverityDot({ severity }: { severity: AlertSeverityFilter }) {
  if (severity === 'all') {
    return <Layers className="size-4 text-muted-foreground" aria-hidden />
  }

  const colorClass =
    severity === 'critical'
      ? 'bg-(--stock-alert-critical)'
      : severity === 'low'
        ? 'bg-(--stock-alert-warning)'
        : 'bg-(--info)'

  return <span className={cn('size-2 rounded-full', colorClass)} aria-hidden />
}

function kindLeading(kind: AlertKindFilter) {
  if (kind === 'stock_out') {
    return <Package className="size-4 text-muted-foreground" aria-hidden />
  }
  if (kind === 'stock_low') {
    return <Gauge className="size-4 text-muted-foreground" aria-hidden />
  }
  return <Layers className="size-4 text-muted-foreground" aria-hidden />
}

function lifecycleLeading(lifecycle: AlertSection) {
  if (lifecycle === 'postponed') {
    return <Clock className="size-4 text-muted-foreground" aria-hidden />
  }
  return <Bell className="size-4 text-muted-foreground" aria-hidden />
}

function AlertsSeverityFilter({
  filters,
  onFiltersChange,
  t,
}: {
  filters: AlertsListFilters
  onFiltersChange: (patch: Partial<AlertsListFilters>) => void
  t: (key: ShellStringKey) => string
}) {
  const options = useMemo(
    () =>
      ALERT_SEVERITY_OPTIONS.map(({ id, labelKey }) => ({
        value: id,
        label: t(labelKey),
        leading: <SeverityDot severity={id} />,
      })),
    [t],
  )

  return (
    <FilterContextPill
      label={t('homeAlertsSheetFilterSectionEstado')}
      triggerIcon={Layers}
      value={filters.severity}
      defaultValue="all"
      valueOnlyWhenActive
      options={options}
      onValueChange={(value) => {
        if (
          value === 'all'
          || value === 'critical'
          || value === 'low'
          || value === 'informational'
        ) {
          onFiltersChange({ severity: value })
        }
      }}
      popoverAlign="start"
    />
  )
}

function AlertsKindFilter({
  filters,
  onFiltersChange,
  t,
}: {
  filters: AlertsListFilters
  onFiltersChange: (patch: Partial<AlertsListFilters>) => void
  t: (key: ShellStringKey) => string
}) {
  const options = useMemo(
    () =>
      ALERT_KIND_OPTIONS.map(({ id, labelKey }) => ({
        value: id,
        label: t(labelKey),
        leading: kindLeading(id),
      })),
    [t],
  )

  return (
    <FilterContextPill
      label={t('homeAlertsSheetFilterSectionTipo')}
      triggerIcon={Package}
      value={filters.kind}
      defaultValue="all"
      valueOnlyWhenActive
      options={options}
      onValueChange={(value) => {
        if (value === 'all' || value === 'stock_out' || value === 'stock_low') {
          onFiltersChange({ kind: value })
        }
      }}
      popoverAlign="start"
    />
  )
}

function AlertsLifecycleFilter({
  filters,
  onFiltersChange,
  t,
}: {
  filters: AlertsListFilters
  onFiltersChange: (patch: Partial<AlertsListFilters>) => void
  t: (key: ShellStringKey) => string
}) {
  const options = useMemo(
    () =>
      ALERT_LIFECYCLE_OPTIONS.map(({ id, labelKey }) => ({
        value: id,
        label: t(labelKey),
        leading: lifecycleLeading(id),
      })),
    [t],
  )

  return (
    <FilterContextPill
      label={t('homeAlertsSheetFilterAvailabilityLabel')}
      triggerIcon={Bell}
      value={filters.lifecycle}
      defaultValue="active"
      alwaysShowValue
      valueOnlyWhenActive
      options={options}
      onValueChange={(value) => {
        if (value === 'active' || value === 'postponed') {
          onFiltersChange({ lifecycle: value })
        }
      }}
      popoverAlign="start"
    />
  )
}

export function AlertsFiltersToolbar({
  filters,
  onFiltersChange,
  t,
}: AlertsFiltersToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <AlertsSeverityFilter filters={filters} onFiltersChange={onFiltersChange} t={t} />
      <AlertsKindFilter filters={filters} onFiltersChange={onFiltersChange} t={t} />
      <AlertsLifecycleFilter filters={filters} onFiltersChange={onFiltersChange} t={t} />
    </div>
  )
}
