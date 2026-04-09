import type { ConnectorAccent } from '@/features/connectors/connector-definitions'
import { cn } from '@/lib/utils'

import amazonLogo from '@/assets/amazon.svg'
import mercadolibreLogo from '@/assets/mercadolibre.svg'
import shopifyLogo from '@/assets/shopify.svg'
import walmartLogo from '@/assets/walmart.svg'

const LOGO_SRC: Record<ConnectorAccent, string> = {
  shopify: shopifyLogo,
  amazon: amazonLogo,
  mercadolibre: mercadolibreLogo,
  walmart: walmartLogo,
}

export function PlatformLogo({
  accent,
  className,
  title,
}: {
  accent: ConnectorAccent
  className?: string
  /** Optional accessible name (e.g. platform name) */
  title?: string
}) {
  return (
    <img
      src={LOGO_SRC[accent]}
      alt=""
      title={title}
      className={cn('size-8 object-contain', className)}
      decoding="async"
    />
  )
}
