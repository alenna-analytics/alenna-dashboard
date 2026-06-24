import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { SalesMetricBasis } from '@/lib/sales-metric-basis'
import { Switch } from '@/ui/switch'
import { cn } from '@/lib/utils'

type SalesMetricBasisToggleProps = {
  basis: SalesMetricBasis
  onBasisChange: (basis: SalesMetricBasis) => void
  t: (key: ShellStringKey) => string
  className?: string
}

export function SalesMetricBasisToggle({
  basis,
  onBasisChange,
  t,
  className,
}: SalesMetricBasisToggleProps) {
  const showGross = basis === 'gross'

  return (
    <label
      className={cn('inline-flex cursor-pointer items-center gap-2.5', className)}
    >
      <Switch
        checked={showGross}
        onCheckedChange={(checked) => onBasisChange(checked ? 'gross' : 'net')}
        aria-label={t('kpiSalesMetricBasisShowGross')}
      />
      <span className="text-xs font-medium text-text-secondary">
        {t('kpiSalesMetricBasisShowGross')}
      </span>
    </label>
  )
}
