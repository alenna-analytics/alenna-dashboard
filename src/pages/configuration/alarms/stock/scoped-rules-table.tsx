import { Pencil, Trash2 } from 'lucide-react'

import { shellT } from '@/lib/i18n/shell-strings'
import type { StockOverrideApi } from '@/lib/types/alert-rules'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'

type ScopedRulesTableProps = {
  lang: string
  items: StockOverrideApi[]
  isAdmin: boolean
  deletingId: string | null
  onAdd: () => void
  onEdit: (item: StockOverrideApi) => void
  onDelete: (item: StockOverrideApi) => void
}

function scopeTypeLabel(lang: string, scopeType: StockOverrideApi['scope_type']): string {
  if (scopeType === 'channel') return shellT(lang, 'alarmsScopeChannel')
  if (scopeType === 'product') return shellT(lang, 'alarmsScopeProduct')
  return shellT(lang, 'alarmsScopeListing')
}

function statusBadge(lang: string, enabled: boolean) {
  return (
    <Badge variant={enabled ? 'secondary' : 'outline'}>
      {enabled ? shellT(lang, 'alarmsStatusEnabled') : shellT(lang, 'alarmsStatusDisabled')}
    </Badge>
  )
}

export function ScopedRulesTable({
  lang,
  items,
  isAdmin,
  deletingId,
  onAdd,
  onEdit,
  onDelete,
}: ScopedRulesTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{shellT(lang, 'alarmsScopedRulesTitle')}</CardTitle>
          <CardDescription>{shellT(lang, 'alarmsScopedRulesDescription')}</CardDescription>
        </div>
        {isAdmin ? (
          <Button type="button" variant="secondary" onClick={onAdd}>
            {shellT(lang, 'alarmsAddRule')}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-text-secondary">{shellT(lang, 'alarmsScopedRulesEmpty')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{shellT(lang, 'alarmsColScope')}</TableHead>
                <TableHead>{shellT(lang, 'alarmsColTarget')}</TableHead>
                <TableHead>{shellT(lang, 'alarmsColOutOfStockStatus')}</TableHead>
                <TableHead>{shellT(lang, 'alarmsColLowStockStatus')}</TableHead>
                <TableHead>{shellT(lang, 'alarmsColThreshold')}</TableHead>
                {isAdmin ? <TableHead className="w-[120px]" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{scopeTypeLabel(lang, item.scope_type)}</TableCell>
                  <TableCell className="max-w-[240px] truncate" title={item.scope_label}>
                    {item.scope_label}
                  </TableCell>
                  <TableCell>{statusBadge(lang, item.out_of_stock_enabled)}</TableCell>
                  <TableCell>{statusBadge(lang, item.enabled)}</TableCell>
                  <TableCell>{Math.round(item.velocity_pct * 100)}%</TableCell>
                  {isAdmin ? (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={shellT(lang, 'alarmsEditRule')}
                          onClick={() => onEdit(item)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={shellT(lang, 'alarmsDeleteRule')}
                          disabled={deletingId === item.id}
                          onClick={() => onDelete(item)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
