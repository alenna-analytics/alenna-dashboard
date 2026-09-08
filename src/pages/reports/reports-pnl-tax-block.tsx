import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { TaxesEstimated } from '@/lib/types/reports'
import { pctVersusPrevious } from '@/pages/reports/reports-ui-helpers'
import { ReportsPnlTable } from '@/pages/reports/reports-pnl-table'
import {
  pctOfNetRevenue,
  type ReportsStatementRow,
} from '@/pages/reports/reports-pnl-rows'
import { SectionSplit } from '@/pages/reports/report-ui'

type ReportsPnlTaxBlockProps = {
  taxesEstimated: TaxesEstimated | null | undefined
  taxesEstimatedPrev?: TaxesEstimated | null
  taxesEstimatedYoy?: TaxesEstimated | null
  formatMoney: (value: number) => string
  t: (key: ShellStringKey) => string
}

type TaxEstimateRowId =
  | 'withholding_isr'
  | 'withholding_iva'
  | 'withholding_total'
  | 'expected_net_cash'

const TAX_ROW_LABEL_KEYS: Record<TaxEstimateRowId, ShellStringKey> = {
  withholding_isr: 'reportsTaxBlockWithholdingIsr',
  withholding_iva: 'reportsTaxBlockWithholdingIva',
  withholding_total: 'reportsTaxBlockWithholdingTotal',
  expected_net_cash: 'reportsTaxBlockExpectedNetCash',
}

function moneyDelta(
  current: number,
  previous: number | null,
): { deltaAbs: number | null; deltaPct: number | null } {
  if (previous === null) return { deltaAbs: null, deltaPct: null }
  const trend = pctVersusPrevious(current, previous)
  return {
    deltaAbs: current - previous,
    deltaPct: trend?.pct ?? null,
  }
}

function taxRow(
  id: TaxEstimateRowId,
  kind: ReportsStatementRow['kind'],
  isDeduction: boolean,
  current: number,
  previous: number | null,
  yoy: number | null,
  baseAmount: number,
  rowHintKey: ShellStringKey | null = null,
): ReportsStatementRow {
  const { deltaAbs, deltaPct } = moneyDelta(current, previous)
  const yoyTrend = yoy === null ? null : pctVersusPrevious(current, yoy)
  return {
    id,
    kind,
    isDeduction,
    current,
    previous,
    deltaAbs,
    deltaPct,
    yoyDeltaPct: yoyTrend?.pct ?? null,
    marginPct: null,
    rowHintKey,
    pctOfNetRevenue: pctOfNetRevenue(current, baseAmount),
  }
}

function buildTaxEstimateRows(
  current: TaxesEstimated,
  previous: TaxesEstimated | null = null,
  yoy: TaxesEstimated | null = null,
): ReportsStatementRow[] {
  const base = current.base_amount
  const p = (fn: (t: TaxesEstimated) => number): number | null =>
    previous ? fn(previous) : null
  const y = (fn: (t: TaxesEstimated) => number): number | null => (yoy ? fn(yoy) : null)

  return [
    taxRow(
      'withholding_isr',
      'line',
      true,
      current.withholding_isr,
      p((t) => t.withholding_isr),
      y((t) => t.withholding_isr),
      base,
    ),
    taxRow(
      'withholding_iva',
      'line',
      true,
      current.withholding_iva,
      p((t) => t.withholding_iva),
      y((t) => t.withholding_iva),
      base,
    ),
    taxRow(
      'withholding_total',
      'subtotal',
      true,
      current.withholding_total,
      p((t) => t.withholding_total),
      y((t) => t.withholding_total),
      base,
      'reportsTaxBlockInformationalNote',
    ),
    taxRow(
      'expected_net_cash',
      'total',
      false,
      current.expected_net_cash,
      p((t) => t.expected_net_cash),
      y((t) => t.expected_net_cash),
      base,
    ),
  ]
}

export function ReportsPnlTaxBlock({
  taxesEstimated,
  taxesEstimatedPrev = null,
  taxesEstimatedYoy = null,
  formatMoney,
  t,
}: ReportsPnlTaxBlockProps) {
  const rows = useMemo(() => {
    if (!taxesEstimated) return []
    return buildTaxEstimateRows(taxesEstimated, taxesEstimatedPrev, taxesEstimatedYoy)
  }, [taxesEstimated, taxesEstimatedPrev, taxesEstimatedYoy])

  if (taxesEstimated == null) {
    return (
      <SectionSplit
        title={t('reportsTaxBlockTitle')}
        description={t('reportsTaxBlockSubtitle')}
      >
        <div className="rounded-md border border-border-subtle px-4 py-3">
          <div className="space-y-2 text-sm text-text-secondary">
            <p>{t('reportsTaxBlockUnset')}</p>
            <Link
              to="/dashboard/configuration/tax-rates"
              className="font-medium text-text-primary underline-offset-2 hover:underline"
            >
              {t('reportsTaxBlockConfigLink')}
            </Link>
          </div>
        </div>
      </SectionSplit>
    )
  }

  return (
    <ReportsPnlTable
      rows={rows}
      formatMoney={formatMoney}
      t={t}
      labelForRow={(id) => {
        const key = TAX_ROW_LABEL_KEYS[id as TaxEstimateRowId]
        return key ? t(key) : id
      }}
      title={t('reportsTaxBlockTitle')}
      description={t('reportsTaxBlockSubtitle')}
    />
  )
}
