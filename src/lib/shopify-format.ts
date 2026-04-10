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
