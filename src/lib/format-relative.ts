import { formatDistanceToNow, parseISO } from 'date-fns'
import { enUS, es } from 'date-fns/locale'

export function formatRelativeFromIso(
  iso: string | null | undefined,
  lang: string,
): string | null {
  if (!iso) return null
  try {
    const d = parseISO(iso)
    if (Number.isNaN(d.getTime())) return null
    return formatDistanceToNow(d, {
      addSuffix: true,
      locale: lang === 'en' ? enUS : es,
    })
  } catch {
    return null
  }
}
