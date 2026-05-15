import { toYmd } from '@/pages/reports/reports-ui-helpers'

export function defaultProductInsightRange(): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  return { start: toYmd(start), end: toYmd(end) }
}

export function formatPlatformSlug(slug: string): string {
  return slug
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
