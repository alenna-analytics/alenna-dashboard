/** Platforms that withhold ISR/IVA as marketplace intermediaries (MX). */
export function platformWithholdsMarketplaceTax(platform: string): boolean {
  const p = platform.trim().toLowerCase().replace(/_/g, '')
  if (!p || p === 'total') return false
  if (p === 'shopify') return false
  if (p === 'amazon' || p === 'mercadolibre' || p === 'meli') return true
  return false
}
