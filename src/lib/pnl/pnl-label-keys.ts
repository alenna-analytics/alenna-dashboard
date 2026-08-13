import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { PnlRowId } from '@/pages/reports/reports-pnl-rows'

export const MAX_PNL_LABEL_LENGTH = 30

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

const PNL_SHELL_KEY_ALIASES: Record<PnlRowId, ShellStringKey[]> = {
  gross_revenue: [
    'reportsGrossRevenue',
    'settlementWfGross',
    'salesDeductionsGross',
    'productsDetailPlatformPaymentGrossSales',
  ],
  discounts: ['settlementWfDiscounts'],
  returns: ['settlementWfReturns'],
  net_revenue: [
    'reportsNetRevenue',
    'settlementWfNetSales',
    'salesDeductionsNet',
    'productsDetailKpiNetSales',
  ],
  cogs: ['reportsKpiCogsLabel', 'productsDetailKpiCogsTotal'],
  gross_profit: ['reportsGrossProfit', 'productsDetailKpiGrossProfit'],
  platform_fees: ['reportsWfCommissions'],
  merchant_shipping: ['reportsWfShipping'],
  ads_spend: [],
  contribution_margin: ['reportsContributionMargin'],
  fixed_opex: ['reportsKpiFixedOpex'],
  ebitda: ['reportsEbitda'],
}

export const PNL_SHELL_KEY_TO_ROW: Partial<Record<ShellStringKey, PnlRowId>> = Object.fromEntries(
  PNL_ROW_IDS.flatMap((rowId) => {
    const keys = new Set<ShellStringKey>([
      PNL_ROW_LABEL_KEYS[rowId],
      ...PNL_SHELL_KEY_ALIASES[rowId],
    ])
    return [...keys].map((key) => [key, rowId] as const)
  }),
)
