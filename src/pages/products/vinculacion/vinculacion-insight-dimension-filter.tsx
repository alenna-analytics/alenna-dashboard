import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { cn } from '@/lib/utils'
import { InfoTooltip } from '@/ui/info-tooltip'
import { Label } from '@/ui/label'
import { Switch } from '@/ui/switch'

type InsightDimension = 'channel' | 'product'
type ShellT = (key: ShellStringKey) => string

type VinculacionInsightDimensionFilterProps = {
  value: InsightDimension
  onChange: (value: InsightDimension) => void
  t: ShellT
  className?: string
  switchId?: string
}

export function VinculacionInsightDimensionFilter({
  value,
  onChange,
  t,
  className,
  switchId = 'group-insight-dimension',
}: VinculacionInsightDimensionFilterProps) {
  const byChannel = value === 'channel'

  return (
    <div
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-2 bg-transparent',
        className,
      )}
    >
      <Switch
        id={switchId}
        checked={byChannel}
        onCheckedChange={(checked) => onChange(checked ? 'channel' : 'product')}
        aria-label={t('productsVinculacionGroupByChannel')}
      />
      <Label
        htmlFor={switchId}
        className="cursor-pointer text-xs font-medium text-text-secondary"
      >
        {t('productsVinculacionGroupByChannel')}
      </Label>
      <InfoTooltip side="top">{t('productsVinculacionGroupByChannelHelp')}</InfoTooltip>
    </div>
  )
}
