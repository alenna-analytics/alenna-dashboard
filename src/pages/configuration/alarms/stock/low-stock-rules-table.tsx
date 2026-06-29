import { Plus } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import type { StockOverrideApi } from '@/lib/types/alert-rules'
import { lowStockRuleEffectiveEnabled } from '@/pages/configuration/alarms/stock/stock-alert-config-helpers'
import { Button } from '@/ui/button'
import { StatusPill } from '@/ui/status-pill'
import { Switch } from '@/ui/switch'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'

type LowStockRulesTableProps = {
  lang: string
  items: StockOverrideApi[]
  globalLowStockEnabled: boolean
  isAdmin: boolean
  togglingId: string | null
  resolveTargetLabel: (item: StockOverrideApi) => string
  onAdd: () => void
  onEdit: (item: StockOverrideApi) => void
  onToggleEnabled: (item: StockOverrideApi, enabled: boolean) => void
}

function scopeTypeLabel(lang: string, scopeType: StockOverrideApi['scope_type']): string {
  if (scopeType === 'channel') return shellT(lang, 'alarmsScopeChannel')
  if (scopeType === 'product') return shellT(lang, 'alarmsScopeProduct')
  return shellT(lang, 'alarmsScopeListing')
}

export function LowStockRulesTable({
  lang,
  items,
  globalLowStockEnabled,
  isAdmin,
  togglingId,
  resolveTargetLabel,
  onAdd,
  onEdit,
  onToggleEnabled,
}: LowStockRulesTableProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-sm font-semibold text-text-primary">
            {shellT(lang, 'alarmsCustomRulesTitle')}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {shellT(lang, 'alarmsCustomRulesDescription')}
          </p>
          {!globalLowStockEnabled ? (
            <p className="mt-2 text-sm text-[var(--status-amber-900)]">
              {shellT(lang, 'alarmsCustomRulesGlobalDisabledHint')}
            </p>
          ) : null}
        </div>
        {isAdmin ? (
          <Button type="button" variant="success" size="sm" onClick={onAdd}>
            <Plus className="size-4" />
            {shellT(lang, 'alarmsAddRule')}
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-text-secondary">{shellT(lang, 'alarmsScopedRulesEmpty')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{shellT(lang, 'alarmsColScope')}</TableHead>
              <TableHead>{shellT(lang, 'alarmsColTarget')}</TableHead>
              <TableHead>{shellT(lang, 'alarmsColThreshold')}</TableHead>
              {isAdmin ? <TableHead className="w-[72px]" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const targetLabel = resolveTargetLabel(item)
              const effectiveEnabled = lowStockRuleEffectiveEnabled(globalLowStockEnabled, item)
              const inactive = !effectiveEnabled
              const toggleDisabled = togglingId === item.id || !globalLowStockEnabled
              return (
              <TableRow
                key={item.id}
                className={cn(
                  isAdmin && 'cursor-pointer',
                  inactive && 'bg-muted/40',
                )}
                onClick={isAdmin ? () => onEdit(item) : undefined}
              >
                <TableCell className={cn(inactive && 'text-text-tertiary')}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{scopeTypeLabel(lang, item.scope_type)}</span>
                    {inactive ? (
                      <StatusPill variant="warning">
                        {shellT(lang, 'alarmsStatusInactive')}
                      </StatusPill>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    'max-w-[240px] truncate',
                    inactive && 'text-text-tertiary',
                  )}
                  title={targetLabel}
                >
                  {targetLabel}
                </TableCell>
                <TableCell className={cn(inactive && 'text-text-tertiary')}>
                  {Math.round(item.velocity_pct * 100)}%
                </TableCell>
                {isAdmin ? (
                  <TableCell>
                    <div
                      className="flex justify-end"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <Switch
                        checked={effectiveEnabled}
                        disabled={toggleDisabled}
                        title={
                          !globalLowStockEnabled
                            ? shellT(lang, 'alarmsLowStockRuleToggleDisabledHelp')
                            : undefined
                        }
                        aria-label={
                          effectiveEnabled
                            ? shellT(lang, 'alarmsStatusEnabled')
                            : shellT(lang, 'alarmsStatusDisabled')
                        }
                        onCheckedChange={(checked) => onToggleEnabled(item, checked)}
                      />
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
