import { describe, expect, it } from 'vitest'

import {
  adsToNetPct,
  benchmarkStatus,
  buildBenchmarkRows,
} from '@/pages/reports/reports-benchmarks'

describe('benchmarkStatus', () => {
  it('bands gross margin correctly', () => {
    expect(benchmarkStatus('gross_margin_pct', 45)).toBe('green')
    expect(benchmarkStatus('gross_margin_pct', 30)).toBe('yellow')
    expect(benchmarkStatus('gross_margin_pct', 20)).toBe('red')
  })

  it('treats zero ads/vn as green (real zero, not missing)', () => {
    expect(benchmarkStatus('ads_to_net_pct', 0)).toBe('green')
    expect(benchmarkStatus('ads_to_net_pct', 25)).toBe('yellow')
    expect(benchmarkStatus('ads_to_net_pct', 35)).toBe('red')
  })

  it('marks ads-dependent metrics as no_data', () => {
    expect(benchmarkStatus('roas', 5)).toBe('no_data')
    expect(benchmarkStatus('tacos', 10)).toBe('no_data')
    expect(benchmarkStatus('ltv_cac', 3)).toBe('no_data')
  })
})

describe('buildBenchmarkRows', () => {
  it('computes ads pct and includes no_data rows', () => {
    const rows = buildBenchmarkRows({
      grossMarginPct: 50,
      contributionMarginPct: 25,
      adsSpend: 0,
      netRevenue: 1000,
      ebitdaMarginPct: 12,
    })
    expect(adsToNetPct(0, 1000)).toBe(0)
    const ads = rows.find((r) => r.id === 'ads_to_net_pct')
    expect(ads?.band).toBe('green')
    expect(ads?.value).toBe(0)
    expect(rows.find((r) => r.id === 'roas')?.band).toBe('no_data')
  })
})
