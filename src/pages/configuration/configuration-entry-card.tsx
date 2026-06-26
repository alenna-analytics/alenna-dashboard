import { Link } from 'react-router-dom'

import { shellT } from '@/lib/i18n/shell-strings'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { AppIcon } from '@/ui/app-icon'
import type { AppIconName } from '@/lib/icons/catalog'
import { cn } from '@/lib/utils'

type ConfigurationEntryCardProps = {
  lang: string
  to: string
  titleKey: ShellStringKey
  descriptionKey: ShellStringKey
  icon: AppIconName
}

export function ConfigurationEntryCard({
  lang,
  to,
  titleKey,
  descriptionKey,
  icon,
}: ConfigurationEntryCardProps) {
  return (
    <li>
      <Link
        to={to}
        className={cn(
          'group flex h-full flex-col rounded-md border border-border-default bg-white p-5',
          'transition-colors hover:border-border-strong',
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex size-10 items-center justify-center rounded-md border border-border-subtle bg-muted/30">
            <AppIcon name={icon} colorize className="size-5" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-text-primary">{shellT(lang, titleKey)}</h2>
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-text-secondary">
            {shellT(lang, descriptionKey)}
          </p>
        </div>
      </Link>
    </li>
  )
}
