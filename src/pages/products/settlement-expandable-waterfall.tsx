import { useCallback, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductPlatformSettlementApi, ProductSettlementApi } from '@/lib/types/catalog'
import type { SettlementBreakdown } from '@/lib/types/reports'
import {
  settlementWaterfallLines,
  type SettlementWaterfallLine,
} from '@/lib/settlement-utils'
import { cn } from '@/lib/utils'

import { ProductPlatformLogoName } from './product-platform-logo-name'

type SettlementExpandableWaterfallProps = {
  settlement: SettlementBreakdown | ProductSettlementApi
  byPlatform?: ProductPlatformSettlementApi[]
  fmtBase: (value: number) => string
  t: (key: ShellStringKey) => string
  periodLabel?: string | null
}

type PlatformFieldKey =
  | 'gross_revenue'
  | 'discounts'
  | 'returns'
  | 'net_revenue'
  | 'marketplace_fees'
  | 'shipping_charges'
  | 'tax_withholdings'
  | 'estimated_payout'

const LINE_PLATFORM_FIELD: Record<string, PlatformFieldKey> = {
  gross: 'gross_revenue',
  discounts: 'discounts',
  returns: 'returns',
  net: 'net_revenue',
  fees: 'marketplace_fees',
  shipping: 'shipping_charges',
  tax: 'tax_withholdings',
  payout: 'estimated_payout',
}

function lineLabel(line: SettlementWaterfallLine, t: (key: ShellStringKey) => string): string {
  if (line.isDeduction) return `(−) ${t(line.labelKey as ShellStringKey)}`
  if (line.kind === 'subtotal' || line.kind === 'total') {
    return `= ${t(line.labelKey as ShellStringKey)}`
  }
  return t(line.labelKey as ShellStringKey)
}

function lineDisplayValue(line: SettlementWaterfallLine): number {
  return line.isDeduction ? -Math.abs(line.value) : line.value
}

function SettlementExpandableRow({
  line,
  byPlatform,
  fmtBase,
  t,
  expanded,
  onToggle,
}: {
  line: SettlementWaterfallLine
  byPlatform: ProductPlatformSettlementApi[]
  fmtBase: (value: number) => string
  t: (key: ShellStringKey) => string
  expanded: boolean
  onToggle: () => void
}) {
  const field = LINE_PLATFORM_FIELD[line.key]
  const platformRows = useMemo(() => {
    if (!field || byPlatform.length === 0) return []
    return byPlatform
      .map((row) => ({
        platform: row.platform,
        value: row[field],
      }))
      .filter((row) => row.value !== 0)
  }, [byPlatform, field])

  const expandable =
    line.kind !== 'total' && platformRows.length > 0
  const display = lineDisplayValue(line)
  const isTotal = line.kind === 'total'

  const rowBody = (
    <>
      <span
        className={cn(
          'min-w-0 text-left',
          isTotal && 'font-semibold text-text-primary',
          line.kind === 'subtotal' && 'font-medium text-text-primary',
          line.isDeduction && 'text-text-secondary',
        )}
      >
        {isTotal ? t('settlementWfTotal') : lineLabel(line, t)}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            'font-numeric tabular-nums',
            isTotal && 'font-semibold text-text-primary',
            line.kind === 'subtotal' && 'font-medium text-text-primary',
          )}
        >
          {fmtBase(display)}
        </span>
        {expandable ? (
          expanded ? (
            <ChevronDown className="size-4 text-text-tertiary" aria-hidden />
          ) : (
            <ChevronRight className="size-4 text-text-tertiary" aria-hidden />
          )
        ) : (
          <span className="size-4 shrink-0" aria-hidden />
        )}
      </span>
    </>
  )

  return (
    <div className="border-b border-border-subtle/80 last:border-b-0">
      {expandable ? (
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/25"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          {rowBody}
        </button>
      ) : (
        <div
          className={cn(
            'flex items-center justify-between gap-3 px-4 py-3 text-sm',
            isTotal && 'bg-muted/15',
          )}
        >
          {rowBody}
        </div>
      )}
      {expandable && expanded ? (
        <ul className="space-y-2 border-t border-border-subtle/60 bg-muted/10 px-4 py-3">
          {platformRows.map((row) => (
            <li
              key={row.platform}
              className="flex items-center justify-between gap-3 text-xs text-text-secondary"
            >
              <ProductPlatformLogoName
                platformSlug={row.platform}
                t={t}
                logoClassName="size-4"
                textClassName="text-xs text-text-secondary"
              />
              <span className="font-numeric tabular-nums text-text-primary">
                {fmtBase(line.isDeduction ? -Math.abs(row.value) : row.value)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function SettlementExpandableWaterfall({
  settlement,
  byPlatform = [],
  fmtBase,
  t,
  periodLabel,
}: SettlementExpandableWaterfallProps) {
  const lines = useMemo(() => settlementWaterfallLines(settlement), [settlement])
  const detailLines = lines.filter((line) => line.kind !== 'total')
  const totalLine = lines.find((line) => line.kind === 'total')
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set())

  const allExpandableKeys = useMemo(
    () =>
      detailLines
        .filter((line) => {
          const field = LINE_PLATFORM_FIELD[line.key]
          if (!field || line.kind === 'total') return false
          return byPlatform.some((row) => row[field] !== 0)
        })
        .map((line) => line.key),
    [detailLines, byPlatform],
  )

  const allExpanded =
    allExpandableKeys.length > 0 && allExpandableKeys.every((key) => expandedKeys.has(key))

  const toggleExpandAll = useCallback(() => {
    setExpandedKeys(() => (allExpanded ? new Set() : new Set(allExpandableKeys)))
  }, [allExpandableKeys, allExpanded])

  const toggleRow = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  return (
    <div className="overflow-hidden rounded-md border border-border-subtle bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle/80 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            {t('settlementWfEstimatedPayout')}
          </p>
          {periodLabel ? (
            <p className="mt-0.5 text-xs text-text-secondary">{periodLabel}</p>
          ) : null}
        </div>
        {allExpandableKeys.length > 0 ? (
          <button
            type="button"
            className="shrink-0 text-xs font-medium text-[var(--country-green-base)] hover:underline"
            onClick={toggleExpandAll}
          >
            {allExpanded ? t('settlementCollapseAll') : t('settlementExpandAll')}
          </button>
        ) : null}
      </div>
      {detailLines.map((line) => (
        <SettlementExpandableRow
          key={line.key}
          line={line}
          byPlatform={byPlatform}
          fmtBase={fmtBase}
          t={t}
          expanded={expandedKeys.has(line.key)}
          onToggle={() => toggleRow(line.key)}
        />
      ))}
      {totalLine ? (
        <SettlementExpandableRow
          line={totalLine}
          byPlatform={byPlatform}
          fmtBase={fmtBase}
          t={t}
          expanded={false}
          onToggle={() => undefined}
        />
      ) : null}
    </div>
  )
}
