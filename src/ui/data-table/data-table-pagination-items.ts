/** 0-based page indices with ellipsis around the active page (e.g. `1 … 4 5 6 … 8`). */
export function getPaginationPageItems(
  pageIndex: number,
  pageCount: number,
): (number | 'ellipsis')[] {
  if (pageCount <= 1) return [0]
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, i) => i)
  }

  const current = pageIndex + 1
  const total = pageCount
  const sibling = 1
  const included = new Set<number>([1, total])

  for (let i = 1; i <= total; i++) {
    if (i >= current - sibling && i <= current + sibling) included.add(i)
    if (current <= 3 && i <= 3) included.add(i)
    if (current >= total - 2 && i >= total - 2) included.add(i)
  }

  const pages = [...included].sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  let last: number | undefined

  for (const p of pages) {
    if (last !== undefined) {
      if (p - last === 2) {
        result.push(last)
      } else if (p - last !== 1) {
        result.push('ellipsis')
      }
    }
    result.push(p - 1)
    last = p
  }

  return result
}
