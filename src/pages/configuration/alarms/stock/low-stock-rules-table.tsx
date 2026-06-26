import { Plus } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import type { StockOverrideApi } from '@/lib/types/alert-rules'
import { Button } from '@/ui/button'
import { Switch } from '@/ui/switch'
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
              return (
              <TableRow
                key={item.id}
                className={isAdmin ? 'cursor-pointer' : undefined}
                onClick={isAdmin ? () => onEdit(item) : undefined}
              >
                <TableCell>{scopeTypeLabel(lang, item.scope_type)}</TableCell>
                <TableCell className="max-w-[240px] truncate" title={targetLabel}>
                  {targetLabel}
                </TableCell>
                <TableCell>{Math.round(item.velocity_pct * 100)}%</TableCell>
                {isAdmin ? (
                  <TableCell>
                    <div
                      className="flex justify-end"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <Switch
                        checked={item.enabled}
                        disabled={togglingId === item.id}
                        aria-label={
                          item.enabled
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
