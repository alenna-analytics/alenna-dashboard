export type FxRateRow = {
  rate_date: string
  base_currency: string
  quote_currency: string
  rate: string | number
  source?: string | null
}

export type FxRateListResponse = {
  rates: FxRateRow[]
}

export function fxPairKey(row: Pick<FxRateRow, 'base_currency' | 'quote_currency'>): string {
  return `${row.base_currency.trim().toUpperCase()}/${row.quote_currency.trim().toUpperCase()}`
}

export function parseFxRate(value: string | number): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}
