export type TaxSettingsRates = {
  withholding_iva_pct: number
  withholding_isr_pct: number
  transferred_iva_pct: number
}

export type TaxSettingsResponse = {
  settings: TaxSettingsRates | null
}

export type PutTaxSettingsBody = {
  settings: TaxSettingsRates
}

/** Explicit user action only — never auto-applied on GET. */
export const MX_TYPICAL_TAX_RATES: TaxSettingsRates = {
  withholding_iva_pct: 8,
  withholding_isr_pct: 2.5,
  transferred_iva_pct: 16,
}
