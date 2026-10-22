import type { ShellStringKey } from '@/lib/i18n/shell-strings'

import {
  effectiveTaxRate,
  feePct,
  marginPct,
  payoutPct,
  shippingPct,
  type GroupStatementColumn,
} from './group-statement'
import type { GroupStatementRow } from './group-statement-table'

type ShellT = (key: ShellStringKey) => string

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value == null ? match : String(value)
  })
}

function isAmazon(platform: string): boolean {
  return platform.trim().toLowerCase().replace(/_/g, '') === 'amazon'
}

function moneyValues(
  columns: GroupStatementColumn[],
  total: GroupStatementColumn,
  pick: (column: GroupStatementColumn) => number,
  factor: number,
): Record<string, number> {
  const values: Record<string, number> = { total: pick(total) * factor }
  for (const column of columns) values[column.id] = pick(column) * factor
  return values
}

function pctValues(
  columns: GroupStatementColumn[],
  total: GroupStatementColumn,
  pick: (column: GroupStatementColumn) => number | null,
): Record<string, number | null> {
  const values: Record<string, number | null> = { total: pick(total) }
  for (const column of columns) values[column.id] = pick(column)
  return values
}

export function buildPnlStatementRows(input: {
  columns: GroupStatementColumn[]
  total: GroupStatementColumn
  factor: number
  cogsHint: string
  t: ShellT
}): GroupStatementRow[] {
  const { columns, total, factor, cogsHint, t } = input
  const money = (pick: (column: GroupStatementColumn) => number) =>
    moneyValues(columns, total, pick, factor)
  const pct = (pick: (column: GroupStatementColumn) => number | null) =>
    pctValues(columns, total, pick)
  return [
    {
      id: 'gross',
      label: t('reportsWfGrossRevenue'),
      kind: 'line',
      format: 'money',
      values: money((column) => column.gross),
    },
    {
      id: 'discounts',
      label: t('reportsWfDiscounts'),
      kind: 'line',
      format: 'money',
      deduction: true,
      values: money((column) => column.discounts),
    },
    {
      id: 'returns',
      label: t('reportsWfReturns'),
      kind: 'line',
      format: 'money',
      deduction: true,
      values: money((column) => column.returns),
    },
    {
      id: 'net',
      label: t('reportsWfNetRevenue'),
      kind: 'subtotal',
      format: 'money',
      values: money((column) => column.net),
    },
    {
      id: 'cogs',
      label: t('reportsWfCogs'),
      hint: cogsHint,
      kind: 'line',
      format: 'money',
      deduction: true,
      values: money((column) => column.cogs),
    },
    {
      id: 'gross-profit',
      label: t('reportsWfGrossProfit'),
      kind: 'subtotal',
      format: 'money',
      values: money((column) => column.grossProfit),
    },
    {
      id: 'gross-margin',
      label: t('reportsKpiMargenBrutoPct'),
      kind: 'line',
      format: 'pct',
      values: pct((column) => marginPct(column.grossProfit, column.net)),
    },
    {
      id: 'fees',
      label: t('reportsKpiPlatformFees'),
      hint: t('productsGroupPnlFeesHint'),
      kind: 'line',
      format: 'money',
      deduction: true,
      values: money((column) => column.fees),
    },
    {
      id: 'shipping',
      label: t('reportsKpiFulfillmentCost'),
      hint: t('productsGroupPnlShippingHint'),
      kind: 'line',
      format: 'money',
      deduction: true,
      values: money((column) => column.shipping),
    },
    {
      id: 'channel-margin',
      label: t('productsDetailChannelMargin'),
      kind: 'subtotal',
      format: 'money',
      values: money((column) => column.channelMargin),
    },
    {
      id: 'channel-margin-pct',
      label: t('productsGroupPnlChannelMarginPct'),
      kind: 'line',
      format: 'pct',
      values: pct((column) => marginPct(column.channelMargin, column.net)),
    },
    {
      id: 'ads',
      label: t('productsDetailAdsAssigned'),
      kind: 'line',
      format: 'money',
      deduction: true,
      values: money((column) => column.ads),
    },
    {
      id: 'contribution',
      label: t('productsGroupWfContribution'),
      kind: 'total',
      format: 'money',
      emphasize: true,
      values: money((column) => column.contribution),
    },
    {
      id: 'cm-pct',
      label: t('productsGroupPnlCmPct'),
      kind: 'line',
      format: 'pct',
      values: pct((column) => marginPct(column.contribution, column.net)),
    },
    {
      id: 'units',
      label: t('productsDetailKpiNetUnitsSold'),
      hint: t('productsGroupPnlUnitsHint'),
      kind: 'line',
      format: 'count',
      values: moneyValues(columns, total, (column) => column.netUnits, 1),
    },
    {
      id: 'avg-price',
      label: t('productsDetailAvgPrice'),
      hint: t('productsGroupCardAvgPriceHint'),
      kind: 'line',
      format: 'price',
      values: pct((column) =>
        column.netUnits > 0 ? (column.net * factor) / column.netUnits : null,
      ),
    },
  ]
}

export function buildCobroStatementRows(input: {
  columns: GroupStatementColumn[]
  total: GroupStatementColumn
  transferredIvaPct: number
  t: ShellT
}): GroupStatementRow[] {
  const { columns, total, transferredIvaPct, t } = input
  const money = (pick: (column: GroupStatementColumn) => number) =>
    moneyValues(columns, total, pick, 1)
  const hasAmazon = columns.some((column) => isAmazon(column.platform))
  const otherText: Record<string, string | null> = { total: hasAmazon ? t('productsGroupCobroToCapture') : '—' }
  for (const column of columns) {
    otherText[column.id] = isAmazon(column.platform) ? t('productsGroupCobroToCapture') : '—'
  }
  return [
    {
      id: 'gross',
      label: t('reportsWfGrossRevenue'),
      kind: 'line',
      format: 'money',
      values: money((column) => column.gross),
    },
    {
      id: 'discounts',
      label: t('reportsWfDiscounts'),
      kind: 'line',
      format: 'money',
      deduction: true,
      values: money((column) => column.discounts),
    },
    {
      id: 'returns',
      label: t('reportsWfReturns'),
      kind: 'line',
      format: 'money',
      deduction: true,
      values: money((column) => column.returns),
    },
    {
      id: 'net',
      label: t('reportsWfNetRevenue'),
      kind: 'subtotal',
      format: 'money',
      values: money((column) => column.net),
    },
    {
      id: 'fees',
      label: t('reportsKpiPlatformFees'),
      kind: 'line',
      format: 'money',
      deduction: true,
      values: money((column) => column.fees),
    },
    {
      id: 'fee-pct',
      label: t('productsGroupCobroFeePct'),
      kind: 'line',
      format: 'pct',
      values: pctValues(columns, total, feePct),
    },
    {
      id: 'other-amazon',
      label: t('productsGroupCobroOtherAmazon'),
      hint: t('productsGroupCobroOtherAmazonHint'),
      kind: 'line',
      format: 'text',
      deduction: true,
      values: {},
      textValues: otherText,
    },
    {
      id: 'shipping',
      label: t('productsGroupCobroShipping'),
      hint: t('productsGroupPnlShippingHint'),
      kind: 'line',
      format: 'money',
      deduction: true,
      values: money((column) => column.shipping),
    },
    {
      id: 'shipping-pct',
      label: t('productsGroupCobroFeePct'),
      kind: 'line',
      format: 'pct',
      values: pctValues(columns, total, shippingPct),
    },
    {
      id: 'tax',
      label: t('productsGroupCobroWithholding'),
      hint: t('productsGroupCobroWithholdingHint'),
      kind: 'line',
      format: 'money',
      deduction: true,
      values: money((column) => column.tax),
    },
    {
      id: 'effective-rate',
      label: t('productsGroupCobroEffectiveRate'),
      kind: 'line',
      format: 'pct',
      values: pctValues(columns, total, (column) => effectiveTaxRate(column, transferredIvaPct)),
    },
    {
      id: 'payout',
      label: t('productsGroupCobroNeto'),
      kind: 'total',
      format: 'money',
      emphasize: true,
      values: money((column) => column.payout),
    },
    {
      id: 'payout-pct',
      label: t('productsGroupCobroPayoutPct'),
      kind: 'line',
      format: 'pct',
      values: pctValues(columns, total, payoutPct),
    },
    {
      id: 'cancel',
      label: t('productsGroupCobroCancel'),
      hint: t('productsGroupCobroCancelHint'),
      kind: 'line',
      format: 'money',
      deduction: true,
      values: money((column) => column.cancelCost),
    },
  ]
}

export function countLabel(count: number, one: string, many: string): string {
  return fill(count === 1 ? one : many, { count })
}
