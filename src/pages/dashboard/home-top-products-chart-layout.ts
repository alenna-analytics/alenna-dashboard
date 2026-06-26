/** Row height for stacked label + bar + value rows (see HomeTopProductsChart). */
export const TOP_PRODUCTS_BAR_ROW_PX = 48
/** How many rows stay visible before vertical scroll (lg+). */
export const TOP_PRODUCTS_SCROLL_VISIBLE_ROWS = 6
/** Pairing height with channel donut / skeleton (matches scroll viewport). */
export const TOP_PRODUCTS_DEFAULT_VISIBLE_ROWS = TOP_PRODUCTS_SCROLL_VISIBLE_ROWS

/** Scroll viewport: fewer visible rows + viewport cap on small screens. */
export const TOP_PRODUCTS_SCROLL_MAX_HEIGHT_CLASS =
  'max-h-[min(12rem,45vh)] sm:max-h-[min(15rem,50vh)] lg:max-h-72'

/** Min body height when paired with channel donut (side-by-side at lg+ only). */
export const TOP_PRODUCTS_PAIRED_MIN_HEIGHT_CLASS = 'min-h-0 lg:min-h-72'

export function getTopProductsChartHeightPx(): number {
  return TOP_PRODUCTS_SCROLL_VISIBLE_ROWS * TOP_PRODUCTS_BAR_ROW_PX
}
