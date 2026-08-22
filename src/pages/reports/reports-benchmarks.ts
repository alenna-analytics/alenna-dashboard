export type BenchmarkBand = 'green' | 'yellow' | 'red' | 'no_data'

export type BenchmarkMetricId =
  | 'gross_margin_pct'
  | 'contribution_margin_pct'
  | 'ads_to_net_pct'
  | 'ebitda_margin_pct'
  | 'tacos'
  | 'roas'
  | 'ltv_cac'

export type BenchmarkRow = {
  id: BenchmarkMetricId
  value: number | null
  band: BenchmarkBand
  /** Human thresholds for display columns */
  greenLabel: string
  yellowLabel: string
  redLabel: string
}

export type BenchmarkBandContext = {
  breakEvenRoas: number | null
  cogsIncomplete: boolean
}

/** Higher is better: green above high, yellow between low and high, red below low. */
function bandHigherIsBetter(value: number, greenAbove: number, yellowAbove: number): BenchmarkBand {
  if (value > greenAbove) return 'green'
  if (value >= yellowAbove) return 'yellow'
  return 'red'
}

/** Lower is better: green below low, yellow between low and high, red above high. */
function bandLowerIsBetter(value: number, greenBelow: number, yellowBelow: number): BenchmarkBand {
  if (value < greenBelow) return 'green'
  if (value <= yellowBelow) return 'yellow'
  return 'red'
}

function bandRoas(roas: number, minRoas: number): BenchmarkBand {
  if (roas > minRoas) return 'green'
  if (roas >= minRoas * 0.8) return 'yellow'
  return 'red'
}

function bandLtvCac(value: number): BenchmarkBand {
  if (value > 3) return 'green'
  if (value >= 2) return 'yellow'
  return 'red'
}

export function breakEvenRoas(
  grossMarginPct: number,
  cogsIncomplete: boolean,
): number | null {
  if (cogsIncomplete || grossMarginPct <= 0) return null
  return 100 / grossMarginPct
}

export function tacosPct(adsSpend: number, netRevenue: number): number | null {
  if (netRevenue <= 0) return null
  return (adsSpend / netRevenue) * 100
}

export function globalRoas(adsSpend: number, netRevenue: number): number | null {
  if (adsSpend <= 0) return null
  return netRevenue / adsSpend
}

export function ltvCacRatio(
  contributionMargin: number,
  adsSpend: number,
  cogsIncomplete: boolean,
): number | null {
  if (cogsIncomplete || adsSpend <= 0) return null
  return contributionMargin / adsSpend
}

export function benchmarkStatus(
  id: BenchmarkMetricId,
  value: number | null,
  ctx: BenchmarkBandContext = { breakEvenRoas: null, cogsIncomplete: false },
): BenchmarkBand {
  if (value === null || Number.isNaN(value)) return 'no_data'

  switch (id) {
    case 'gross_margin_pct':
      return bandHigherIsBetter(value, 40, 25)
    case 'contribution_margin_pct':
      return bandHigherIsBetter(value, 20, 10)
    case 'ebitda_margin_pct':
      return bandHigherIsBetter(value, 10, 5)
    case 'ads_to_net_pct':
      return bandLowerIsBetter(value, 20, 30)
    case 'tacos':
      return bandLowerIsBetter(value, 15, 25)
    case 'roas': {
      if (ctx.cogsIncomplete || ctx.breakEvenRoas == null || ctx.breakEvenRoas <= 0) {
        return 'no_data'
      }
      return bandRoas(value, ctx.breakEvenRoas)
    }
    case 'ltv_cac':
      return bandLtvCac(value)
  }
}

export function adsToNetPct(adsSpend: number, netRevenue: number): number {
  if (netRevenue <= 0) return 0
  return (adsSpend / netRevenue) * 100
}

export function formatBenchmarkValue(row: BenchmarkRow): string | null {
  if (row.value === null) return null
  if (row.id === 'roas' || row.id === 'ltv_cac') return `${row.value.toFixed(1)}x`
  return `${row.value.toFixed(1)}%`
}

export function buildBenchmarkRows(input: {
  grossMarginPct: number
  contributionMarginPct: number
  contributionMargin: number
  adsSpend: number
  netRevenue: number
  ebitdaMarginPct: number
  cogsIncomplete: boolean
}): BenchmarkRow[] {
  const adsPct = adsToNetPct(input.adsSpend, input.netRevenue)
  const beRoas = breakEvenRoas(input.grossMarginPct, input.cogsIncomplete)
  const ctx: BenchmarkBandContext = {
    breakEvenRoas: beRoas,
    cogsIncomplete: input.cogsIncomplete,
  }
  const defs: Array<{
    id: BenchmarkMetricId
    value: number | null
    greenLabel: string
    yellowLabel: string
    redLabel: string
  }> = [
    {
      id: 'gross_margin_pct',
      value: input.grossMarginPct,
      greenLabel: '>40%',
      yellowLabel: '25–40%',
      redLabel: '<25%',
    },
    {
      id: 'contribution_margin_pct',
      value: input.contributionMarginPct,
      greenLabel: '>20%',
      yellowLabel: '10–20%',
      redLabel: '<10%',
    },
    {
      id: 'ads_to_net_pct',
      value: adsPct,
      greenLabel: '<20%',
      yellowLabel: '20–30%',
      redLabel: '>30%',
    },
    {
      id: 'ebitda_margin_pct',
      value: input.ebitdaMarginPct,
      greenLabel: '>10%',
      yellowLabel: '5–10%',
      redLabel: '<5%',
    },
    {
      id: 'tacos',
      value: tacosPct(input.adsSpend, input.netRevenue),
      greenLabel: '<15%',
      yellowLabel: '15–25%',
      redLabel: '>25%',
    },
    {
      id: 'roas',
      value: globalRoas(input.adsSpend, input.netRevenue),
      greenLabel: '>ROAS mín.',
      yellowLabel: 'ROAS mín. −20%',
      redLabel: '<ROAS mín. −20%',
    },
    {
      id: 'ltv_cac',
      value: ltvCacRatio(input.contributionMargin, input.adsSpend, input.cogsIncomplete),
      greenLabel: '>3x',
      yellowLabel: '2–3x',
      redLabel: '<2x',
    },
  ]

  return defs.map((d) => ({
    id: d.id,
    value: d.value,
    band: benchmarkStatus(d.id, d.value, ctx),
    greenLabel: d.greenLabel,
    yellowLabel: d.yellowLabel,
    redLabel: d.redLabel,
  }))
}
