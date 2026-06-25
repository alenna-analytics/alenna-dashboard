import { useState } from 'react'

import { shellT } from '@/lib/i18n/shell-strings'
import type { StockRuleApi } from '@/lib/types/alert-rules'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Label } from '@/ui/label'
import { Switch } from '@/ui/switch'

type OutOfStockDefaultFormProps = {
  lang: string
  rule: StockRuleApi | undefined
  isAdmin: boolean
  saving: boolean
  onSave: (payload: { out_of_stock_enabled: boolean }) => void
}

export function OutOfStockDefaultForm({
  lang,
  rule,
  isAdmin,
  saving,
  onSave,
}: OutOfStockDefaultFormProps) {
  const [enabled, setEnabled] = useState(() => rule?.out_of_stock_enabled ?? true)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{shellT(lang, 'alarmsOutOfStockDefaultTitle')}</CardTitle>
        <CardDescription>{shellT(lang, 'alarmsOutOfStockDefaultDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="tenant-out-of-stock-enabled">
              {shellT(lang, 'alarmsOutOfStockEnabledLabel')}
            </Label>
            <p className="text-sm text-text-secondary">{shellT(lang, 'alarmsOutOfStockEnabledHelp')}</p>
          </div>
          <Switch
            id="tenant-out-of-stock-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={!isAdmin || saving}
          />
        </div>
        {isAdmin ? (
          <Button
            type="button"
            onClick={() => onSave({ out_of_stock_enabled: enabled })}
            disabled={saving || !rule}
          >
            {saving ? shellT(lang, 'alarmsSaving') : shellT(lang, 'alarmsSaveDefault')}
          </Button>
        ) : (
          <p className="text-sm text-text-secondary">{shellT(lang, 'alarmsAdminOnly')}</p>
        )}
      </CardContent>
    </Card>
  )
}
