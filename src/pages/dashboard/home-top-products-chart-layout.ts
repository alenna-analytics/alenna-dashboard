export const TOP_PRODUCTS_BAR_ROW_PX = 32
export const TOP_PRODUCTS_AXIS_PX = 28
export const TOP_PRODUCTS_DEFAULT_VISIBLE_ROWS = 10

export function getTopProductsChartHeightPx(rowCount: number): number {
  const n = Math.max(1, rowCount)
  return n * TOP_PRODUCTS_BAR_ROW_PX + TOP_PRODUCTS_AXIS_PX
}
