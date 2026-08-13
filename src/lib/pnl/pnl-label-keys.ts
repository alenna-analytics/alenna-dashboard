import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { PnlRowId } from '@/pages/reports/reports-pnl-rows'

export const PNL_ROW_IDS: PnlRowId[] = [
  'gross_revenue',
  'discounts',
  'returns',
  'net_revenue',
  'cogs',
  'gross_profit',
  'platform_fees',
  'merchant_shipping',
  'ads_spend',
  'contribution_margin',
  'fixed_opex',
  'ebitda',
]

export const PNL_ROW_LABEL_KEYS: Record<PnlRowId, ShellStringKey> = {
  gross_revenue: 'reportsWfGrossRevenue',
  discounts: 'reportsWfDiscounts',
  returns: 'reportsWfReturns',
  net_revenue: 'reportsWfNetRevenue',
  cogs: 'reportsWfCogs',
  gross_profit: 'reportsWfGrossProfit',
  platform_fees: 'reportsKpiPlatformFees',
  merchant_shipping: 'reportsKpiFulfillmentCost',
  ads_spend: 'reportsWfAdsSpend',
  contribution_margin: 'reportsWfContributionMargin',
  fixed_opex: 'reportsWfOpex',
  ebitda: 'reportsWfEbitda',
}
