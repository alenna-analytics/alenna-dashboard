import type { CSSProperties } from 'react'

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
] as const

export const chartMargins = { top: 20, right: 14, left: 6, bottom: 12 }

/** Plot area surface — same token as KPI cards (`--card`, #151a21 in dark). */
export const chartPlotSurfaceClassName = 'rounded-lg bg-card'

export const cartesianGridProps = {
  strokeDasharray: '3 6' as const,
  stroke: 'var(--chart-grid)',
  strokeOpacity: 0.9,
  vertical: true,
}

export const xAxisProps = {
  tick: {
    fill: 'var(--text-tertiary)',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
  },
  axisLine: false,
  tickLine: false,
}

export const yAxisProps = {
  tick: {
    fill: 'var(--text-tertiary)',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
  },
  axisLine: false,
  tickLine: false,
}

export const tooltipContentStyle: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid rgba(91,140,255,0.28)',
  borderRadius: '10px',
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  color: 'var(--text-primary)',
  boxShadow: '0 10px 28px rgba(0,0,0,0.42)',
}
