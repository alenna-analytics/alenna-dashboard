import { cn } from '@/lib/utils'
import { KpiCard } from '@/ui/kpi-card'

type HomeActiveAlertsKpiProps = {
  lowCount: number
  outCount: number
  label: string
  helpText: string
  vsPriorLabel: string
  lowLabel: string
  criticalLabel: string
}

function BreakdownRow({
  label,
  count,
  tone,
}: {
  label: string
  count: number
  tone: 'low' | 'critical'
}) {
  const colorClass =
    tone === 'critical'
      ? 'text-[var(--stock-alert-critical)]'
      : 'text-[var(--stock-alert-warning)]'
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn('text-sm font-medium leading-tight', colorClass)}>{label}</span>
      <span
        className={cn(
          'font-numeric text-lg font-semibold tabular-nums leading-none',
          colorClass,
        )}
      >
        {count.toLocaleString()}
      </span>
    </div>
  )
}

export function HomeActiveAlertsKpi({
  lowCount,
  outCount,
  label,
  helpText,
  vsPriorLabel,
  lowLabel,
  criticalLabel,
}: HomeActiveAlertsKpiProps) {
  const total = lowCount + outCount

  return (
    <KpiCard
      label={label}
      helpText={helpText}
      value={total.toLocaleString()}
      vsPriorLabel={vsPriorLabel}
      priorValueDisplay={null}
      pct={null}
      trend="flat"
      comparisonUnavailable
      showComparison={false}
      valueClassName="text-[var(--color-text-primary)]"
      footer={
        <div className="flex flex-col gap-2 pt-0.5">
          <BreakdownRow label={lowLabel} count={lowCount} tone="low" />
          <BreakdownRow label={criticalLabel} count={outCount} tone="critical" />
        </div>
      }
      footerClassName="text-[var(--color-text-primary)]"
    />
  )
}
