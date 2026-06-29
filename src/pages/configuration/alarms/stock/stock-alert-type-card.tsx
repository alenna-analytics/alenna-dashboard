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
        'flex w-full flex-wrap items-center gap-4 rounded-md border p-4 transition-colors',
        active
          ? 'border-border-default bg-white'
          : 'border-dashed border-[color-mix(in_srgb,var(--text-secondary)_28%,transparent)] bg-muted/45',
        disabled && 'opacity-60',
      )}
    >
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-md border',
          active
            ? 'border-border-subtle bg-muted/20'
            : 'border-border-subtle bg-muted/30 opacity-60 grayscale',
        )}
      >
        <AppIcon name="decrease" className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            className={cn(
              'text-sm font-semibold',
              active ? 'text-text-primary' : 'text-text-secondary',
            )}
          >
            {shellT(lang, titleKey)}
          </h2>
          {active ? (
            <StatusPill variant="success">{shellT(lang, 'alarmsStatusActive')}</StatusPill>
          ) : (
            <StatusPill variant="warning">{shellT(lang, 'alarmsStatusInactive')}</StatusPill>
          )}
        </div>
        <p
          className={cn(
            'mt-1 text-sm',
            active ? 'text-text-secondary' : 'text-text-tertiary',
          )}
        >
          {shellT(lang, descriptionKey)}
        </p>
        {currentValue && currentValueLabelKey ? (
          <p
            className={cn(
              'mt-1.5 text-sm',
              active ? 'text-text-secondary' : 'text-text-tertiary',
            )}
          >
            {shellT(lang, currentValueLabelKey)}:{' '}
            <span
              className={cn(
                'font-semibold',
                active ? 'text-text-primary' : 'text-text-secondary',
              )}
            >
              {currentValue}
            </span>
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
