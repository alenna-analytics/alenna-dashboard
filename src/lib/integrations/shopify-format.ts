export const SHOPIFY_MYSHOPIFY_SUFFIX = '.myshopify.com'

/** Strips URL / full domain so the editable value is only the shop handle (e.g. mitienda). */
export function normalizeShopifySubdomainInput(raw: string): string {
  let s = raw.trim().toLowerCase().replace(/^https?:\/\//, '')
  const slash = s.indexOf('/')
  if (slash >= 0) s = s.slice(0, slash)
  if (s.endsWith(SHOPIFY_MYSHOPIFY_SUFFIX)) {
    s = s.slice(0, -SHOPIFY_MYSHOPIFY_SUFFIX.length)
  }
  s = s.replace(/[^a-z0-9-]/g, '')
  return s.replace(/^-+|-+$/g, '')
}

export function toYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatShopifyLastSync(
  raw: string | null | undefined,
  lang: string,
  neverLabel: string,
): string {
  if (!raw) return neverLabel
  try {
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return raw
    return new Intl.DateTimeFormat(lang === 'en' ? 'en' : 'es', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return raw
  }
}
