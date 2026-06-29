import type { AppIconName } from '@/lib/icons/catalog'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { AppIcon } from '@/ui/app-icon'
import { Button } from '@/ui/button'
import { cn } from '@/lib/utils'

type CogsEntryCardProps = {
  lang: string
  icon: AppIconName
  titleKey: ShellStringKey
  descriptionKey: ShellStringKey
  actionKey: ShellStringKey
  onAction: () => void
  disabled?: boolean
  meta?: string
}

export function CogsEntryCard({
  lang,
  icon,
  titleKey,
  descriptionKey,
  actionKey,
  onAction,
  disabled = false,
  meta,
}: CogsEntryCardProps) {
  return (
    <article
      className={cn(
        'flex w-full flex-wrap items-center gap-4 rounded-md border border-border-default bg-white p-4 transition-colors',
        !disabled && 'hover:border-border-strong hover:bg-muted/20',
        disabled && 'border-dashed border-[color-mix(in_srgb,var(--text-secondary)_28%,transparent)] bg-muted/45 opacity-60',
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-muted/20">
        <AppIcon name={icon} className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-text-primary">{shellT(lang, titleKey)}</h2>
        <p className="mt-1 text-sm text-text-secondary">{shellT(lang, descriptionKey)}</p>
        {meta ? <p className="mt-1.5 text-sm text-text-tertiary">{meta}</p> : null}
      </div>

      <Button type="button" variant="accent" size="sm" disabled={disabled} onClick={onAction}>
        {shellT(lang, actionKey)}
      </Button>
    </article>
  )
}
