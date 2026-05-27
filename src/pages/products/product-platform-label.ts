import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'

export function productPlatformLabel(
  platform: string,
  t: (key: ShellStringKey) => string,
): string {
  const slug = platform.trim().toLowerCase()
  const ui = slug ? INTEGRATION_UI[slug] : undefined
  return ui?.nameKey != null ? t(ui.nameKey) : platform
}

/** Chart/listing series label: "Shopify" or "Shopify: 120 cápsulas" when variant_label is set. */
export function productChannelSeriesLabel(
  platform: string,
  variantLabel: string | null | undefined,
  t: (key: ShellStringKey) => string,
): string {
  const plat = productPlatformLabel(platform, t)
  const suffix = variantLabel?.trim()
  return suffix ? `${plat}: ${suffix}` : plat
}
