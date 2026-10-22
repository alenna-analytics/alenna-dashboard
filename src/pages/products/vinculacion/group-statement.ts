import type { TaxSettingsRates } from '@/lib/types/tax-settings'
import type {
  ProductLinkGroupApi,
  ProductLinkGroupMemberApi,
} from '@/lib/types/product-links'
import { platformWithholdsMarketplaceTax } from '@/pages/products/platform-withholds-tax'

import { ivaDivisor } from './group-rentabilidad'

export type GroupStatementMember = {
  productId: string
  platform: string
  label: string
  grossSales: number
  netSales: number
  grossUnits: number
  netUnits: number
  cost: number | null
  /** Present when the API sends per-publication settlement. */
  hasSettlement: boolean
  cogs: number | null
  settlementGross: number
  settlementNet: number
  discounts: number
  returns: number
  fees: number
  shipping: number
  taxReal: number
  cancelCost: number
}

export type GroupStatementPlatform = {
  platform: string
  gross: number
  discounts: number
  returns: number
  net: number
  fees: number
  shipping: number
  taxReal: number
  cancelCost: number
}

export type GroupStatementColumn = {
  id: string
  platform: string
  label: string
  publicationCount: number
  gross: number
  discounts: number
  returns: number
  net: number
  cogs: number
  grossProfit: number
  fees: number
  shipping: number
  channelMargin: number
  ads: number
  contribution: number
  grossUnits: number
  netUnits: number
  taxReal: number
  tax: number
  cancelCost: number
  payout: number
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Sin IVA applies to sales, discounts, returns, fees, and shipping.
 * COGS and ads stay as captured. Derived lines are rebuilt from those parts.
 * `factor` is 1 with IVA, or 1 / (1 + rate) when the platform does not report tax.
 */
export function presentStatementColumn(
  column: GroupStatementColumn,
  factor: number,
): GroupStatementColumn {
  if (factor === 1) return column
  const gross = roundMoney(column.gross * factor)
  const discounts = roundMoney(column.discounts * factor)
  const returns = roundMoney(column.returns * factor)
  const fees = roundMoney(column.fees * factor)
  const shipping = roundMoney(column.shipping * factor)
  const net = roundMoney(gross - discounts - returns)
  const grossProfit = roundMoney(net - column.cogs)
  const channelMargin = roundMoney(grossProfit - fees - shipping)
  const contribution = roundMoney(channelMargin - column.ads)
  return {
    ...column,
    gross,
    discounts,
    returns,
    fees,
    shipping,
    net,
    grossProfit,
    channelMargin,
    contribution,
  }
}

function cogsOf(member: GroupStatementMember): number {
  if (member.cogs != null && Number.isFinite(member.cogs)) return member.cogs
  if (member.cost != null && Number.isFinite(member.cost)) return member.netUnits * member.cost
  return 0
}

function emptyColumn(id: string, platform: string, label: string): GroupStatementColumn {
  return {
    id,
    platform,
    label,
    publicationCount: 0,
    gross: 0,
    discounts: 0,
    returns: 0,
    net: 0,
    cogs: 0,
    grossProfit: 0,
    fees: 0,
    shipping: 0,
    channelMargin: 0,
    ads: 0,
    contribution: 0,
    grossUnits: 0,
    netUnits: 0,
    taxReal: 0,
    tax: 0,
    cancelCost: 0,
    payout: 0,
  }
}

function finish(column: GroupStatementColumn): GroupStatementColumn {
  const grossProfit = roundMoney(column.net - column.cogs)
  const channelMargin = roundMoney(grossProfit - column.fees - column.shipping)
  const ads = 0
  const contribution = roundMoney(channelMargin - ads)
  const tax = column.tax
  const payout = roundMoney(column.net - column.fees - column.shipping - tax)
  return {
    ...column,
    gross: roundMoney(column.gross),
    discounts: roundMoney(column.discounts),
    returns: roundMoney(column.returns),
    net: roundMoney(column.net),
    cogs: roundMoney(column.cogs),
    fees: roundMoney(column.fees),
    shipping: roundMoney(column.shipping),
    grossProfit,
    channelMargin,
    ads,
    contribution,
    taxReal: roundMoney(column.taxReal),
    tax: roundMoney(tax),
    cancelCost: roundMoney(column.cancelCost),
    payout,
  }
}

function addMember(column: GroupStatementColumn, member: GroupStatementMember): void {
  const gross = member.hasSettlement
    ? member.settlementGross || member.grossSales
    : member.grossSales
  const discounts = member.hasSettlement ? member.discounts : 0
  const returns = member.hasSettlement
    ? member.returns
    : Math.max(0, gross - member.netSales)
  const net = member.hasSettlement ? member.settlementNet : member.netSales
  column.publicationCount += 1
  column.gross += gross
  column.discounts += discounts
  column.returns += returns
  column.net += net
  column.cogs += cogsOf(member)
  column.fees += member.hasSettlement ? member.fees : 0
  column.shipping += member.hasSettlement ? member.shipping : 0
  column.grossUnits += member.grossUnits
  column.netUnits += member.netUnits
  column.taxReal += member.hasSettlement ? member.taxReal : 0
  column.tax += member.hasSettlement ? member.taxReal : 0
  column.cancelCost += member.hasSettlement ? member.cancelCost : 0
}

function applyPlatform(
  column: GroupStatementColumn,
  platform: GroupStatementPlatform,
  members: GroupStatementMember[],
): void {
  column.publicationCount = members.length
  column.gross = platform.gross
  column.discounts = platform.discounts
  column.returns = platform.returns
  column.net = platform.net
  column.fees = platform.fees
  column.shipping = platform.shipping
  column.taxReal = platform.taxReal
  column.tax = platform.taxReal
  column.cancelCost = platform.cancelCost
  column.cogs = members.reduce((sum, member) => sum + cogsOf(member), 0)
  column.grossUnits = members.reduce((sum, member) => sum + member.grossUnits, 0)
  column.netUnits = members.reduce((sum, member) => sum + member.netUnits, 0)
}

function scalePlatform(
  platform: GroupStatementPlatform,
  share: number,
): GroupStatementPlatform {
  return {
    platform: platform.platform,
    gross: platform.gross * share,
    discounts: platform.discounts * share,
    returns: platform.returns * share,
    net: platform.net * share,
    fees: platform.fees * share,
    shipping: platform.shipping * share,
    taxReal: platform.taxReal * share,
    cancelCost: platform.cancelCost * share,
  }
}

function sumColumns(columns: GroupStatementColumn[]): GroupStatementColumn {
  const total = emptyColumn('total', 'total', '')
  for (const column of columns) {
    total.publicationCount += column.publicationCount
    total.gross += column.gross
    total.discounts += column.discounts
    total.returns += column.returns
    total.net += column.net
    total.cogs += column.cogs
    total.fees += column.fees
    total.shipping += column.shipping
    total.grossUnits += column.grossUnits
    total.netUnits += column.netUnits
    total.taxReal += column.taxReal
    total.tax += column.tax
    total.cancelCost += column.cancelCost
  }
  return finish(total)
}

export function membersToStatement(
  members: ProductLinkGroupMemberApi[],
): GroupStatementMember[] {
  return members.map((member) => {
    const hasSettlement = member.period_marketplace_fees != null
    return {
      productId: member.product_id,
      platform: member.platform,
      label: member.variant_label?.trim() || member.title,
      grossSales: member.period_gross_sales,
      netSales: member.period_net_sales,
      grossUnits: member.period_gross_units_sold,
      netUnits: member.period_net_units_sold,
      cost: member.cost,
      hasSettlement,
      cogs: member.period_cogs ?? null,
      settlementGross: member.period_settlement_gross ?? member.period_gross_sales,
      settlementNet: member.period_settlement_net ?? member.period_net_sales,
      discounts: member.period_discounts ?? 0,
      returns: member.period_returns ?? 0,
      fees: member.period_marketplace_fees ?? 0,
      shipping: member.period_shipping_charges ?? 0,
      taxReal: member.period_tax_withholdings ?? 0,
      cancelCost: member.period_cancel_costs ?? 0,
    }
  })
}

export function platformsToStatement(group: ProductLinkGroupApi): GroupStatementPlatform[] {
  return (group.period_settlement_by_platform ?? []).map((row) => ({
    platform: row.platform,
    gross: row.gross_revenue,
    discounts: row.discounts,
    returns: row.returns,
    net: row.net_revenue,
    fees: row.marketplace_fees,
    shipping: row.shipping_charges,
    taxReal: row.tax_withholdings,
    cancelCost: row.platform_cancel_costs?.total ?? 0,
  }))
}

export function withholdingOnNetExIva(
  netSales: number,
  platform: string,
  rates: Pick<TaxSettingsRates, 'withholding_isr_pct' | 'withholding_iva_pct' | 'transferred_iva_pct'>,
): number {
  if (!platformWithholdsMarketplaceTax(platform) || !(netSales > 0)) return 0
  const base = netSales * ivaDivisor(false, rates.transferred_iva_pct)
  const pct = rates.withholding_isr_pct + rates.withholding_iva_pct
  return roundMoney((base * pct) / 100)
}

/** Real withholding wins. Otherwise estimate ISR + IVA on net sales without IVA. */
export function applyWithholdings(
  columns: GroupStatementColumn[],
  rates: TaxSettingsRates | null,
): GroupStatementColumn[] {
  const next = columns.map((column) => {
    const estimated =
      column.taxReal > 0 || rates == null
        ? 0
        : withholdingOnNetExIva(column.net, column.platform, rates)
    const tax = column.taxReal > 0 ? column.taxReal : estimated
    return finish({ ...column, tax })
  })
  return next
}

export function buildGroupStatement(input: {
  members: GroupStatementMember[]
  platforms: GroupStatementPlatform[]
  mode: 'channel' | 'publication'
  labelForPlatform: (platform: string) => string
}): { columns: GroupStatementColumn[]; total: GroupStatementColumn } {
  const byPlatform = new Map<string, GroupStatementMember[]>()
  for (const member of input.members) {
    const key = member.platform.trim().toLowerCase()
    const list = byPlatform.get(key) ?? []
    list.push(member)
    byPlatform.set(key, list)
  }
  const platformRows = new Map(
    input.platforms.map((row) => [row.platform.trim().toLowerCase(), row] as const),
  )
  const order = input.platforms.map((row) => row.platform.trim().toLowerCase())
  for (const key of byPlatform.keys()) {
    if (!order.includes(key)) order.push(key)
  }

  const columns: GroupStatementColumn[] = []
  if (input.mode === 'publication') {
    for (const member of input.members) {
      const column = emptyColumn(member.productId, member.platform, member.label)
      if (member.hasSettlement) {
        addMember(column, member)
      } else {
        const platform = platformRows.get(member.platform.trim().toLowerCase())
        const peers = byPlatform.get(member.platform.trim().toLowerCase()) ?? [member]
        const peerNet = peers.reduce((sum, item) => sum + item.netSales, 0)
        const share = platform && peerNet > 0 ? member.netSales / peerNet : 0
        if (platform && share > 0) {
          applyPlatform(column, scalePlatform(platform, share), [member])
        } else {
          addMember(column, member)
        }
      }
      columns.push(finish(column))
    }
  } else {
    for (const key of order) {
      const members = byPlatform.get(key) ?? []
      if (members.length === 0) continue
      const column = emptyColumn(key, key, input.labelForPlatform(key))
      const detailed = members.every((member) => member.hasSettlement)
      const platform = platformRows.get(key)
      if (detailed) {
        for (const member of members) addMember(column, member)
      } else if (platform) {
        applyPlatform(column, platform, members)
      } else {
        for (const member of members) addMember(column, member)
      }
      columns.push(finish(column))
    }
  }

  return { columns, total: sumColumns(columns) }
}

export function finalizeGroupStatement(
  columns: GroupStatementColumn[],
  rates: TaxSettingsRates | null,
): { columns: GroupStatementColumn[]; total: GroupStatementColumn } {
  const next = applyWithholdings(columns, rates)
  return { columns: next, total: sumColumns(next) }
}

export function feePct(column: GroupStatementColumn): number | null {
  if (!(column.net > 0) || !(Math.abs(column.fees) >= 0.5)) return null
  return (column.fees / column.net) * 100
}

export function shippingPct(column: GroupStatementColumn): number | null {
  if (!(column.net > 0) || !(Math.abs(column.shipping) >= 0.5)) return null
  return (column.shipping / column.net) * 100
}

export function payoutPct(column: GroupStatementColumn): number | null {
  if (!(column.net > 0)) return null
  return (column.payout / column.net) * 100
}

export function marginPct(part: number, net: number): number | null {
  if (!(net > 0)) return null
  return (part / net) * 100
}

export function effectiveTaxRate(column: GroupStatementColumn, transferredIvaPct: number): number | null {
  if (!(column.tax > 0) || !(column.net > 0)) return null
  const base = column.net * ivaDivisor(false, transferredIvaPct)
  if (!(base > 0)) return null
  return (column.tax / base) * 100
}
