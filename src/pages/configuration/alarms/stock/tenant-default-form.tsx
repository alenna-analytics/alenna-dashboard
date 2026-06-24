import { useState } from 'react'

import { shellT } from '@/lib/i18n/shell-strings'
import type { StockRuleApi } from '@/lib/types/alert-rules'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Switch } from '@/ui/switch'

type TenantDefaultFormProps = {
  lang: string
  rule: StockRuleApi | undefined
  isAdmin: boolean
  saving: boolean
  onSave: (payload: { enabled: boolean; velocity_pct: number }) => void
}

export function TenantDefaultForm({
  lang,
  rule,
  isAdmin,
  saving,
  onSave,
}: TenantDefaultFormProps) {
  const [enabled, setEnabled] = useState(() => rule?.enabled ?? true)
  const [velocityPct, setVelocityPct] = useState(() =>
    rule ? String(Math.round(rule.velocity_pct * 100)) : '20',
  )

  const handleSave = () => {
    const parsed = Number(velocityPct)
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) return
    onSave({ enabled, velocity_pct: parsed / 100 })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{shellT(lang, 'alarmsLowStockDefaultTitle')}</CardTitle>
        <CardDescription>{shellT(lang, 'alarmsLowStockDefaultDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="tenant-low-stock-enabled">{shellT(lang, 'alarmsLowStockEnabledLabel')}</Label>
            <p className="text-sm text-text-secondary">{shellT(lang, 'alarmsLowStockEnabledHelp')}</p>
          </div>
          <Switch
            id="tenant-low-stock-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={!isAdmin || saving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenant-velocity-pct">{shellT(lang, 'alarmsThresholdLabel')}</Label>
          <div className="flex max-w-xs items-center gap-2">
            <Input
              id="tenant-velocity-pct"
              type="number"
              min={1}
              max={100}
              value={velocityPct}
              onChange={(e) => setVelocityPct(e.target.value)}
              disabled={!isAdmin || saving || !enabled}
            />
            <span className="text-sm text-text-secondary">%</span>
          </div>
          <p className="text-sm text-text-secondary">{shellT(lang, 'alarmsThresholdHelp')}</p>
        </div>
        {isAdmin ? (
          <Button type="button" onClick={handleSave} disabled={saving || !rule}>
            {saving ? shellT(lang, 'alarmsSaving') : shellT(lang, 'alarmsSaveDefault')}
          </Button>
        ) : (
          <p className="text-sm text-text-secondary">{shellT(lang, 'alarmsAdminOnly')}</p>
        )}
      </CardContent>
    </Card>
  )
}
