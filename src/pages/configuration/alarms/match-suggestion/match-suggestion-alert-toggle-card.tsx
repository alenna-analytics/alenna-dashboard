import { shellT } from '@/lib/i18n/shell-strings'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { settingsDescriptionClassName } from '@/pages/configuration/settings-layout'
import { AppIcon } from '@/ui/app-icon'
import { StatusPill } from '@/ui/status-pill'
import { Switch } from '@/ui/switch'
import { cn } from '@/lib/utils'

type MatchSuggestionAlertToggleCardProps = {
  lang: string
  titleKey: ShellStringKey
  descriptionKey: ShellStringKey
  helpKey: ShellStringKey
  active: boolean
  disabled?: boolean
  saving?: boolean
  onEnabledChange: (enabled: boolean) => void
}

export function MatchSuggestionAlertToggleCard({
  lang,
  titleKey,
  descriptionKey,
  helpKey,
  active,
  disabled = false,
  saving = false,
  onEnabledChange,
}: MatchSuggestionAlertToggleCardProps) {
  return (
    <article
      className={cn(
        'flex w-full flex-wrap items-center gap-4 rounded-md border p-4 transition-colors',
        active
          ? 'border-border-default bg-white'
          : 'border-dashed border-[color-mix(in_srgb,var(--text-secondary)_28%,transparent)] bg-muted/45',
        !disabled && 'hover:border-border-strong hover:bg-muted/20',
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
        <AppIcon name="products" colorize className="size-5" />
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
        <p className={cn('mt-1', settingsDescriptionClassName)}>
          {shellT(lang, descriptionKey)}
        </p>
        <p className="mt-1.5 text-xs text-text-tertiary">{shellT(lang, helpKey)}</p>
      </div>

      <Switch
        checked={active}
        disabled={disabled || saving}
        onCheckedChange={onEnabledChange}
        aria-label={shellT(lang, titleKey)}
      />
    </article>
  )
}
