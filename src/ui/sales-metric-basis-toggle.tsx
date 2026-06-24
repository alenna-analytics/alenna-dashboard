import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { SalesMetricBasis } from '@/lib/sales-metric-basis'
import { cn } from '@/lib/utils'

type SalesMetricBasisToggleProps = {
  basis: SalesMetricBasis
  onBasisChange: (basis: SalesMetricBasis) => void
  t: (key: ShellStringKey) => string
  className?: string
}

const OPTIONS: { id: SalesMetricBasis; label: ShellStringKey }[] = [
  { id: 'net', label: 'kpiSalesMetricBasisNet' },
  { id: 'gross', label: 'kpiSalesMetricBasisGross' },
]

export function SalesMetricBasisToggle({
  basis,
  onBasisChange,
  t,
  className,
}: SalesMetricBasisToggleProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="tablist"
      aria-label={t('kpiSalesMetricBasisToggleAria')}
    >
      <span className="text-xs font-medium text-text-secondary">{t('kpiSalesMetricBasisToggleLabel')}</span>
      {OPTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={basis === id}
          onClick={() => onBasisChange(id)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
            basis === id
              ? 'border-brand bg-brand-dim text-brand shadow-[var(--shadow-ink-xs)]'
              : 'border-border-default bg-bg-elevated/90 text-text-secondary hover:border-border-emphasis hover:text-text-primary',
          )}
        >
          {t(label)}
        </button>
      ))}
    </div>
  )
}
