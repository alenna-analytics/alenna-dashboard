export const PRODUCT_HEADER_MAX_CHARS = 25

/** Fixed width for product P&L/settlement columns (≈25 chars + ellipsis). */
export const productHeaderColumnClassName =
  'w-[13.75rem] min-w-[13.75rem] max-w-[13.75rem]'

export function truncateProductHeaderLabel(label: string): {
  display: string
  full: string
  truncated: boolean
} {
  const full = label.trim()
  if (full.length <= PRODUCT_HEADER_MAX_CHARS) {
    return { display: full, full, truncated: false }
  }
  return {
    display: `${full.slice(0, PRODUCT_HEADER_MAX_CHARS)}…`,
    full,
    truncated: true,
  }
}
