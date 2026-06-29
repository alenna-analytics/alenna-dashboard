import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { Button } from '@/ui/button'

import {
  isCostApplyModeValid,
  ProductCostApplyModeFields,
} from '../product-cost-apply-mode-fields'
import type { BulkCogsApplyUiMode } from './bulk-cogs-types'

type BulkCogsApplyStepProps = {
  applyMode: BulkCogsApplyUiMode
  onApplyModeChange: (mode: BulkCogsApplyUiMode) => void
  effectiveFromDate: string
  onEffectiveFromDateChange: (value: string) => void
  rangeStart: string
  rangeEnd: string
  onRangeStartChange: (value: string) => void
  onRangeEndChange: (value: string) => void
  saving: boolean
  onSave: () => void
  hidePrimaryAction?: boolean
  t: (key: ShellStringKey) => string
}

export function BulkCogsApplyStep({
  applyMode,
  onApplyModeChange,
  effectiveFromDate,
  onEffectiveFromDateChange,
  rangeStart,
  rangeEnd,
  onRangeStartChange,
  onRangeEndChange,
  saving,
  onSave,
  hidePrimaryAction = false,
  t,
}: BulkCogsApplyStepProps) {
  const valid = isCostApplyModeValid(applyMode, effectiveFromDate, rangeStart, rangeEnd)

  return (
    <div className="space-y-4">
      <ProductCostApplyModeFields
        applyMode={applyMode}
        onApplyModeChange={onApplyModeChange}
        effectiveFromDate={effectiveFromDate}
        onEffectiveFromDateChange={onEffectiveFromDateChange}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onRangeStartChange={onRangeStartChange}
        onRangeEndChange={onRangeEndChange}
        disabled={saving}
        t={t}
      />
      {hidePrimaryAction ? null : (
        <div className="flex justify-end">
          <Button type="button" onClick={onSave} loading={saving} disabled={!valid}>
            {t('productsBulkCogsApplySave')}
          </Button>
        </div>
      )}
    </div>
  )
}
