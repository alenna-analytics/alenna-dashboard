export const CHART_NARROW_MQ = '(max-width: 639px)'

type LineXAxisLayout = {
  interval: 'preserveStartEnd'
  minTickGap: number
  angle: number
  textAnchor: 'end' | 'middle'
  height: number
  tickMargin: number
}

export function lineChartXAxisLayout(isNarrow: boolean): LineXAxisLayout {
  if (isNarrow) {
    return {
      interval: 'preserveStartEnd',
      minTickGap: 28,
      angle: -40,
      textAnchor: 'end',
      height: 56,
      tickMargin: 8,
    }
  }
  return {
    interval: 'preserveStartEnd',
    minTickGap: 12,
    angle: 0,
    textAnchor: 'middle',
    height: 30,
    tickMargin: 4,
  }
}
