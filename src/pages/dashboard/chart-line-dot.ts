/** Default radii for Recharts line markers (keep small; large dots feel noisy). */
export const CHART_DOT_RADIUS = 2
export const CHART_ACTIVE_DOT_RADIUS = 3

export function chartLineDot(fill: string): { r: number; fill: string; strokeWidth: number } {
  return { r: CHART_DOT_RADIUS, fill, strokeWidth: 0 }
}

export function chartLineActiveDot(fill: string): { r: number; fill: string; strokeWidth: number } {
  return { r: CHART_ACTIVE_DOT_RADIUS, fill, strokeWidth: 0 }
}
