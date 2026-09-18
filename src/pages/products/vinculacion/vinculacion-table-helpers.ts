/** Prefer the first non-empty image URL (callers can put preferred platforms first). */
export function primaryProductImageUrl(urls: ReadonlyArray<string | null | undefined>): string | null {
  for (const url of urls) {
    const trimmed = url?.trim()
    if (trimmed) return trimmed
  }
  return null
}

export function uniquePlatformSlugs(platforms: ReadonlyArray<string>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const platform of platforms) {
    const slug = platform.trim().toLowerCase()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push(slug)
  }
  return out
}

/**
 * Mirrors parent table columns: image | name (2fr) | type | count | channels (1fr each).
 * Used by expanded member rows so Canales lines up with the parent cell.
 */
export const VINCULACION_DETAIL_ROW_GRID =
  'grid w-full min-w-0 grid-cols-[4.5rem_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center'
