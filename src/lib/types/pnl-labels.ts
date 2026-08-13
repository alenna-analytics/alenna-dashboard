export type PnlLabelLocale = 'es' | 'en'

export type PnlLabelOverridesApi = Partial<
  Record<string, Partial<Record<PnlLabelLocale, string>>>
>

export type PnlLabelOverridesResponse = {
  overrides: PnlLabelOverridesApi
}

export type PutPnlLabelOverridesBody = {
  overrides: PnlLabelOverridesApi
}
