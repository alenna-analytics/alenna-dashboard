import { describe, expect, it } from 'vitest'

import {
  adsToNetPct,
  benchmarkStatus,
  buildBenchmarkRows,
  formatBenchmarkValue,
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

  it('bands TACoS as lower-is-better', () => {
    expect(benchmarkStatus('tacos', 10)).toBe('green')
    expect(benchmarkStatus('tacos', 15)).toBe('yellow')
    expect(benchmarkStatus('tacos', 25)).toBe('yellow')
    expect(benchmarkStatus('tacos', 26)).toBe('red')
  })

  it('bands ROAS against break-even', () => {
    const ctx = { breakEvenRoas: 2, cogsIncomplete: false }
    expect(benchmarkStatus('roas', 3, ctx)).toBe('green')
    expect(benchmarkStatus('roas', 1.8, ctx)).toBe('yellow')
    expect(benchmarkStatus('roas', 1.5, ctx)).toBe('red')
    expect(benchmarkStatus('roas', 3, { breakEvenRoas: null, cogsIncomplete: false })).toBe(
      'no_data',
    )
    expect(benchmarkStatus('roas', 3, { breakEvenRoas: 2, cogsIncomplete: true })).toBe('no_data')
  })

  it('bands LTV:CAC', () => {
    expect(benchmarkStatus('ltv_cac', 4)).toBe('green')
    expect(benchmarkStatus('ltv_cac', 2.5)).toBe('yellow')
    expect(benchmarkStatus('ltv_cac', 1.5)).toBe('red')
  })
})

describe('buildBenchmarkRows', () => {
  it('computes ads pct and includes no_data rows when ads spend is 0', () => {
    const rows = buildBenchmarkRows({
      grossMarginPct: 50,
      contributionMarginPct: 25,
      contributionMargin: 250,
      adsSpend: 0,
      netRevenue: 1000,
      ebitdaMarginPct: 12,
      cogsIncomplete: false,
    })
    expect(adsToNetPct(0, 1000)).toBe(0)
    const ads = rows.find((r) => r.id === 'ads_to_net_pct')
    expect(ads?.band).toBe('green')
    expect(ads?.value).toBe(0)
    expect(rows.find((r) => r.id === 'tacos')?.value).toBe(0)
    expect(rows.find((r) => r.id === 'tacos')?.band).toBe('green')
    expect(rows.find((r) => r.id === 'roas')?.band).toBe('no_data')
    expect(rows.find((r) => r.id === 'ltv_cac')?.band).toBe('no_data')
  })

  it('computes TACoS, ROAS, and LTV:CAC from P&L', () => {
    const rows = buildBenchmarkRows({
      grossMarginPct: 50,
      contributionMarginPct: 30,
      contributionMargin: 400,
      adsSpend: 100,
      netRevenue: 1000,
      ebitdaMarginPct: 12,
      cogsIncomplete: false,
    })
    const tacos = rows.find((r) => r.id === 'tacos')
    const roas = rows.find((r) => r.id === 'roas')
    const ltv = rows.find((r) => r.id === 'ltv_cac')
    expect(tacos?.value).toBe(10)
    expect(tacos?.band).toBe('green')
    expect(roas?.value).toBe(10)
    expect(roas?.band).toBe('green')
    expect(ltv?.value).toBe(4)
    expect(ltv?.band).toBe('green')
    expect(formatBenchmarkValue(roas!)).toBe('10.0x')
    expect(formatBenchmarkValue(tacos!)).toBe('10.0%')
  })
})
