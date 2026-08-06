import { useCallback, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductPlatformSettlementApi, ProductSettlementApi } from '@/lib/types/catalog'
import type { SettlementBreakdown } from '@/lib/types/reports'
import { settlementWaterfallLines, type SettlementWaterfallLine } from '@/lib/settlement-utils'
import { cn } from '@/lib/utils'

import { ProductPlatformLogoName } from './product-platform-logo-name'
import { settlementLineDisplayValue, settlementLineLabel } from './settlement-line-label'

type SettlementWaterfallListProps = {
  settlement: SettlementBreakdown | ProductSettlementApi
  byPlatform?: ProductPlatformSettlementApi[]
  fmtBase: (value: number) => string
  t: (key: ShellStringKey) => string
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

function SettlementWaterfallRow({
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

  const expandable = line.kind !== 'total' && platformRows.length > 0
  const display = settlementLineDisplayValue(line)
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
        {settlementLineLabel(line, t)}
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
          className="flex w-full items-center justify-between gap-3 px-0 py-3 text-sm transition-colors hover:bg-muted/20"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          {rowBody}
        </button>
      ) : (
        <div
          className={cn(
            'flex items-center justify-between gap-3 py-3 text-sm',
            isTotal && 'border-t border-border-subtle/80 pt-3 font-semibold',
          )}
        >
          {rowBody}
        </div>
      )}
      {expandable && expanded ? (
        <ul className="mb-2 space-y-2 rounded-md bg-muted/10 px-3 py-2">
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

export function SettlementWaterfallList({
  settlement,
  byPlatform = [],
  fmtBase,
  t,
}: SettlementWaterfallListProps) {
  const lines = useMemo(() => settlementWaterfallLines(settlement), [settlement])
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set())

  const toggleRow = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const allExpandableKeys = useMemo(
    () =>
      lines
        .filter((line) => {
          const field = LINE_PLATFORM_FIELD[line.key]
          if (!field || line.kind === 'total') return false
          return byPlatform.some((row) => row[field] !== 0)
        })
        .map((line) => line.key),
    [lines, byPlatform],
  )

  const allExpanded =
    allExpandableKeys.length > 0 && allExpandableKeys.every((key) => expandedKeys.has(key))

  const toggleExpandAll = useCallback(() => {
    setExpandedKeys(() => (allExpanded ? new Set() : new Set(allExpandableKeys)))
  }, [allExpandableKeys, allExpanded])

  return (
    <div>
      {allExpandableKeys.length > 0 ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            className="text-xs font-medium text-[var(--country-green-base)] hover:underline"
            onClick={toggleExpandAll}
          >
            {allExpanded ? t('settlementCollapseAll') : t('settlementExpandAll')}
          </button>
        </div>
      ) : null}
      {lines.map((line) => (
        <SettlementWaterfallRow
          key={line.key}
          line={line}
          byPlatform={byPlatform}
          fmtBase={fmtBase}
          t={t}
          expanded={expandedKeys.has(line.key)}
          onToggle={() => toggleRow(line.key)}
        />
      ))}
    </div>
  )
}
