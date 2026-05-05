import { describe, expect, it } from 'vitest'
import { convertAmount, formatMoney } from '../money'

const fxMxnToUsd = {
  rate: '0.05',
  rate_date: '2026-05-01',
  from: 'MXN',
  to: 'USD',
}

describe('convertAmount', () => {
  it('returns native amount when display currency is null', () => {
    const out = convertAmount(100, {
      nativeCurrency: 'MXN',
      displayCurrency: null,
      latestFx: null,
      baseCurrency: 'MXN',
    })
    expect(out).toEqual({ amount: 100, currency: 'MXN', converted: false })
  })

  it('returns native amount when display equals native', () => {
    const out = convertAmount('100', {
      nativeCurrency: 'mxn',
      displayCurrency: 'MXN',
      latestFx: null,
      baseCurrency: 'MXN',
    })
    expect(out.converted).toBe(false)
    expect(out.amount).toBe(100)
  })

  it('does not convert when native differs from base (per-channel native shown)', () => {
    const out = convertAmount(100, {
      nativeCurrency: 'USD',
      displayCurrency: 'MXN',
      latestFx: { rate: '17.5', rate_date: '2026-05-01', from: 'MXN', to: 'USD' },
      baseCurrency: 'MXN',
    })
    expect(out.converted).toBe(false)
    expect(out.currency).toBe('USD')
    expect(out.amount).toBe(100)
  })

  it('converts base->display using latestFx when pair matches', () => {
    const out = convertAmount(1000, {
      nativeCurrency: 'MXN',
      displayCurrency: 'USD',
      latestFx: fxMxnToUsd,
      baseCurrency: 'MXN',
    })
    expect(out.converted).toBe(true)
    expect(out.currency).toBe('USD')
    expect(out.amount).toBeCloseTo(50)
  })

  it('falls back to native when latestFx is missing', () => {
    const out = convertAmount(1000, {
      nativeCurrency: 'MXN',
      displayCurrency: 'USD',
      latestFx: null,
      baseCurrency: 'MXN',
    })
    expect(out.converted).toBe(false)
    expect(out.currency).toBe('MXN')
  })

  it('ignores asOfDate in v1 (forward-compatible parameter)', () => {
    const out = convertAmount(1000, {
      nativeCurrency: 'MXN',
      displayCurrency: 'USD',
      latestFx: fxMxnToUsd,
      baseCurrency: 'MXN',
      asOfDate: '2024-01-15',
    })
    expect(out.converted).toBe(true)
    expect(out.amount).toBeCloseTo(50)
  })

  it('falls back when latestFx pair does not match base/display', () => {
    const wrongPair = { ...fxMxnToUsd, from: 'EUR', to: 'USD' }
    const out = convertAmount(1000, {
      nativeCurrency: 'MXN',
      displayCurrency: 'USD',
      latestFx: wrongPair,
      baseCurrency: 'MXN',
    })
    expect(out.converted).toBe(false)
  })

  it('treats null/undefined amounts as 0', () => {
    expect(convertAmount(null, {
      nativeCurrency: 'MXN',
      displayCurrency: null,
      latestFx: null,
      baseCurrency: 'MXN',
    }).amount).toBe(0)
    expect(convertAmount(undefined, {
      nativeCurrency: 'MXN',
      displayCurrency: null,
      latestFx: null,
      baseCurrency: 'MXN',
    }).amount).toBe(0)
  })
})

describe('formatMoney', () => {
  it('formats native MXN with default fraction digits', () => {
    const out = formatMoney(1234.5, {
      nativeCurrency: 'MXN',
      displayCurrency: null,
      latestFx: null,
      baseCurrency: 'MXN',
      locale: 'en-US',
    })
    expect(out).toContain('1,234.50')
  })

  it('formats converted USD when display picker is set', () => {
    const out = formatMoney(1000, {
      nativeCurrency: 'MXN',
      displayCurrency: 'USD',
      latestFx: fxMxnToUsd,
      baseCurrency: 'MXN',
      locale: 'en-US',
    })
    expect(out).toContain('$')
    expect(out).toContain('50.00')
  })
})
