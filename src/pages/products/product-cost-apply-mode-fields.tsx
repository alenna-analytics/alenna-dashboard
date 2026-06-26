/* eslint-disable react-refresh/only-export-components -- apply-mode helpers + fields component */
import { useMemo } from 'react'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { DatePicker } from '@/ui/date-picker'
import { DateRangePicker, type DateRangePickerStrings } from '@/ui/date-range-picker'
import { Label } from '@/ui/label'
import { cn } from '@/lib/utils'

import { defaultBackfillRange, todayYmd } from './product-cost-date-utils'
import type { BulkCogsApplyUiMode } from './bulk-cogs/bulk-cogs-types'

export type ProductCostApplyModeFieldsProps = {
  applyMode: BulkCogsApplyUiMode
  onApplyModeChange: (mode: BulkCogsApplyUiMode) => void
  effectiveFromDate: string
  onEffectiveFromDateChange: (value: string) => void
  rangeStart: string
  rangeEnd: string
  onRangeStartChange: (value: string) => void
  onRangeEndChange: (value: string) => void
  disabled?: boolean
  t: (key: ShellStringKey) => string
}

export function useCostApplyModePickerStrings(
  t: (key: ShellStringKey) => string,
): DateRangePickerStrings {
  return useMemo(
    () => ({
      applyLabel: t('datePickerApply'),
      todayLabel: t('datePickerToday'),
      placeholder: t('datePickerPlaceholder'),
      presetLast7Days: t('datePickerLast7Days'),
      presetLast30Days: t('datePickerLast30Days'),
      presetLast6Months: t('datePickerLast6Months'),
      presetLastYearRolling: t('datePickerLastYearRolling'),
      presetCurrentYear: t('datePickerCurrentYear'),
      presetPreviousYear: t('datePickerPreviousYear'),
    }),
    [t],
  )
}

export function useCostApplyModeDefaults(): {
  effectiveFromDate: string
  rangeStart: string
  rangeEnd: string
} {
  const range = defaultBackfillRange()
  return {
    effectiveFromDate: todayYmd(),
    rangeStart: range.start,
    rangeEnd: range.end,
  }
}

export function ProductCostApplyModeFields({
  applyMode,
  onApplyModeChange,
  effectiveFromDate,
  onEffectiveFromDateChange,
  rangeStart,
  rangeEnd,
  onRangeStartChange,
  onRangeEndChange,
  disabled = false,
  t,
}: ProductCostApplyModeFieldsProps) {
  const today = todayYmd()
  const pickerStrings = useCostApplyModePickerStrings(t)
  const fromDateInvalid =
    applyMode === 'from_date' && effectiveFromDate.trim() !== '' && effectiveFromDate > today

  const selectApplyMode = (mode: BulkCogsApplyUiMode) => {
    onApplyModeChange(mode)
    if (mode === 'from_date' && effectiveFromDate > today) {
      onEffectiveFromDateChange(today)
    }
  }

  return (
    <div className="space-y-2" role="radiogroup" aria-label={t('productsDetailCostModeGroupAria')}>
      <p className="text-xs font-medium text-text-secondary">{t('productsDetailCostModeGroupLabel')}</p>

      <div
        className={cn(
          'rounded-md border p-3 transition-colors',
          applyMode === 'today'
            ? 'border-border-default bg-muted/30'
            : 'border-border-subtle hover:bg-muted/20',
        )}
      >
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="radio"
            name="cost-apply-mode"
            className="mt-0.5"
            checked={applyMode === 'today'}
            onChange={() => selectApplyMode('today')}
            disabled={disabled}
          />
          <span className="min-w-0">
            <span className="font-medium text-text-primary">{t('productsDetailCostModeForward')}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">
              {t('productsDetailCostModeForwardHelp')}
            </span>
          </span>
        </label>
      </div>

      <div
        className={cn(
          'rounded-md border p-3 transition-colors',
          applyMode === 'from_date'
            ? 'border-border-default bg-muted/30'
            : 'border-border-subtle hover:bg-muted/20',
        )}
      >
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="radio"
            name="cost-apply-mode"
            className="mt-0.5"
            checked={applyMode === 'from_date'}
            onChange={() => selectApplyMode('from_date')}
            disabled={disabled}
          />
          <span className="min-w-0 flex-1">
            <span className="font-medium text-text-primary">{t('productsDetailCostModeFromDate')}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">
              {t('productsDetailCostModeFromDateHelp')}
            </span>
          </span>
        </label>
        {applyMode === 'from_date' ? (
          <div className="mt-3 space-y-2 pl-7">
            <Label htmlFor="cost-effective-from">{t('productsCostEditorEffectiveDate')}</Label>
            <DatePicker
              id="cost-effective-from"
              value={effectiveFromDate}
              onChange={onEffectiveFromDateChange}
              maxDate={today}
              disabled={disabled}
              openAriaLabel={t('productsCostEditorDatePickerAria')}
            />
            {fromDateInvalid ? (
              <p className="text-xs text-destructive">{t('productsCostEditorEffectiveDateInvalid')}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          'rounded-md border p-3 transition-colors',
          applyMode === 'range'
            ? 'border-border-default bg-muted/30'
            : 'border-border-subtle hover:bg-muted/20',
        )}
      >
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="radio"
            name="cost-apply-mode"
            className="mt-0.5"
            checked={applyMode === 'range'}
            onChange={() => selectApplyMode('range')}
            disabled={disabled}
          />
          <span className="min-w-0">
            <span className="font-medium text-text-primary">{t('productsDetailCostModeHistory')}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">
              {t('productsDetailCostModeHistoryHelp')}
            </span>
          </span>
        </label>
        {applyMode === 'range' ? (
          <div className="mt-3 pl-7">
            <DateRangePicker
              strings={pickerStrings}
              startValue={rangeStart}
              endValue={rangeEnd}
              onStartChange={(value) => value && onRangeStartChange(value)}
              onEndChange={(value) => value && onRangeEndChange(value)}
              className="max-w-full"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function isCostApplyModeValid(
  applyMode: BulkCogsApplyUiMode,
  effectiveFromDate: string,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  const today = todayYmd()
  if (applyMode === 'today') return true
  if (applyMode === 'from_date') {
    return effectiveFromDate.trim() !== '' && effectiveFromDate <= today
  }
  return rangeStart <= rangeEnd
}
