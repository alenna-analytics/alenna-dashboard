import { shellT } from '@/lib/i18n/shell-strings'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { AppIcon } from '@/ui/app-icon'
import { Button } from '@/ui/button'
import { StatusPill } from '@/ui/status-pill'
import { cn } from '@/lib/utils'

type StockAlertTypeCardProps = {
  lang: string
  titleKey: ShellStringKey
  descriptionKey: ShellStringKey
  active: boolean
  onConfigure: () => void
  disabled?: boolean
  currentValue?: string
  currentValueLabelKey?: ShellStringKey
}

export function StockAlertTypeCard({
  lang,
  titleKey,
  descriptionKey,
  active,
  onConfigure,
  disabled = false,
  currentValue,
  currentValueLabelKey,
}: StockAlertTypeCardProps) {
  return (
    <article
      className={cn(
        'flex w-full flex-wrap items-center gap-4 rounded-md border border-border-default bg-white p-4',
        disabled && 'opacity-60',
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-muted/20">
        <AppIcon name="decrease" className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">{shellT(lang, titleKey)}</h2>
          {active ? (
            <StatusPill variant="success">{shellT(lang, 'alarmsStatusActive')}</StatusPill>
          ) : (
            <StatusPill variant="neutral">{shellT(lang, 'alarmsStatusInactive')}</StatusPill>
          )}
        </div>
        <p className="mt-1 text-sm text-text-secondary">{shellT(lang, descriptionKey)}</p>
        {currentValue && currentValueLabelKey ? (
          <p className="mt-1.5 text-sm text-text-secondary">
            {shellT(lang, currentValueLabelKey)}:{' '}
            <span className="font-semibold text-text-primary">{currentValue}</span>
          </p>
        ) : null}
      </div>

      <Button
        type="button"
        variant="accent"
        size="sm"
        disabled={disabled}
        onClick={onConfigure}
      >
        {shellT(lang, 'alarmsConfigure')}
      </Button>
    </article>
  )
}
