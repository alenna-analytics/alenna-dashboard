import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { formatPlatformSlug } from '@/pages/products/product-detail-range'
import { cn } from '@/lib/utils'

type ProductPlatformLogoNameProps = {
  platformSlug: string
  t: (key: ShellStringKey) => string
  className?: string
  logoClassName?: string
  textClassName?: string
}

export function ProductPlatformLogoName({
  platformSlug,
  t,
  className,
  logoClassName,
  textClassName,
}: ProductPlatformLogoNameProps) {
  const slug = platformSlug.trim().toLowerCase()
  const ui = slug ? INTEGRATION_UI[slug] : undefined
  const label =
    ui?.nameKey != null ? t(ui.nameKey) : formatPlatformSlug(platformSlug)

  return (
    <span className={cn('flex max-w-full min-w-0 items-center gap-1', className)}>
      {ui?.logoSrc != null ? (
        <img
          src={ui.logoSrc}
          alt=""
          className={cn('size-6 shrink-0 object-contain', logoClassName)}
          draggable={false}
          aria-hidden
        />
      ) : null}
      <span className={cn('min-w-0 truncate', textClassName)} title={label}>
        {label}
      </span>
    </span>
  )
}
