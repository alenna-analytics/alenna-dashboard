/** Row height for stacked label + bar + value rows (see HomeTopProductsChart). */
export const TOP_PRODUCTS_BAR_ROW_PX = 48
/** How many rows stay visible before vertical scroll. */
export const TOP_PRODUCTS_SCROLL_VISIBLE_ROWS = 6
/** Pairing height with channel donut / skeleton (matches scroll viewport). */
export const TOP_PRODUCTS_DEFAULT_VISIBLE_ROWS = TOP_PRODUCTS_SCROLL_VISIBLE_ROWS

export function getTopProductsChartHeightPx(): number {
  return TOP_PRODUCTS_SCROLL_VISIBLE_ROWS * TOP_PRODUCTS_BAR_ROW_PX
}
