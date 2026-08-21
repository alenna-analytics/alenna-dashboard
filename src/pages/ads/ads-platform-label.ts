import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'

export function adsPlatformLabel(platform: string, lang: string): string {
  const key = platform.trim().toLowerCase()
  const map: Record<string, ShellStringKey> = {
    mercadolibre_ads: 'adsPlatformMercadoAds',
    amazon_ads: 'adsPlatformAmazonAds',
    google_ads: 'adsPlatformGoogleAds',
  }
  const stringKey = map[key]
  if (stringKey) return shellT(lang, stringKey)
  if (!key) return ''
  return key
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}
