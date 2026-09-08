import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { shellT } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import {
  MX_TYPICAL_TAX_RATES,
  type TaxSettingsRates,
} from '@/lib/types/tax-settings'
import {
  SettingsCard,
  SettingsRow,
  SettingsSectionHeader,
} from '@/pages/configuration/settings-layout'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Skeleton } from '@/ui/skeleton'

import { usePutTaxRatesMutation, useTaxRatesQuery } from './use-tax-rates-queries'

type DraftRates = {
  withholding_iva_pct: string
  withholding_isr_pct: string
  transferred_iva_pct: string
}

const EMPTY_DRAFT: DraftRates = {
  withholding_iva_pct: '',
  withholding_isr_pct: '',
  transferred_iva_pct: '',
}

function ratesToDraft(rates: TaxSettingsRates | null | undefined): DraftRates {
  if (!rates) return EMPTY_DRAFT
  return {
    withholding_iva_pct: String(rates.withholding_iva_pct),
    withholding_isr_pct: String(rates.withholding_isr_pct),
    transferred_iva_pct: String(rates.transferred_iva_pct),
  }
}

function parsePct(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0 || n > 100) return null
  return n
}

/** Keep draft strings in [0, 100] while typing; empty allowed. */
function sanitizePctInput(raw: string): string {
  if (raw === '') return ''
  const cleaned = raw.replace(/[^\d.]/g, '')
  if (cleaned === '') return ''
  if (cleaned === '.') return '0.'

  const firstDot = cleaned.indexOf('.')
  const normalized =
    firstDot === -1
      ? cleaned
      : `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, '')}`

  const n = Number(normalized)
  if (!Number.isFinite(n) || n < 0) return '0'
  if (n > 100) return '100'
  return normalized
}

function normalizePctOnBlur(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed === '' || trimmed === '.') return ''
  const n = parsePct(trimmed)
  if (n === null) return '0'
  return String(n)
}

function parseDraft(draft: DraftRates): TaxSettingsRates | null {
  const withholding_iva_pct = parsePct(draft.withholding_iva_pct)
  const withholding_isr_pct = parsePct(draft.withholding_isr_pct)
  const transferred_iva_pct = parsePct(draft.transferred_iva_pct)
  if (
    withholding_iva_pct === null ||
    withholding_isr_pct === null ||
    transferred_iva_pct === null
  ) {
    return null
  }
  return { withholding_iva_pct, withholding_isr_pct, transferred_iva_pct }
}

function draftsEqual(a: DraftRates, b: DraftRates): boolean {
  return (
    a.withholding_iva_pct === b.withholding_iva_pct &&
    a.withholding_isr_pct === b.withholding_isr_pct &&
    a.transferred_iva_pct === b.transferred_iva_pct
  )
}

export function TaxRatesConfigurationPage() {
  const { lang } = useLanguage()
  const t = useCallback(
    (key: Parameters<typeof shellT>[1]) => shellT(lang, key),
    [lang],
  )
  const { me } = useWorkspace()
  const canManage = can(me, 'tax_rates.manage')

  const { data, isPending, isError } = useTaxRatesQuery()
  const loading = isPending && !isError
  const putMutation = usePutTaxRatesMutation()

  const [draft, setDraft] = useState<DraftRates | null>(null)
  const saved = useMemo(() => ratesToDraft(data?.settings ?? null), [data?.settings])
  const working = draft ?? saved
  const isDirty = !draftsEqual(working, saved)
  const parsed = parseDraft(working)
  const isUnset = data?.settings == null && draft === null

  const save = async (settings: TaxSettingsRates) => {
    try {
      await putMutation.mutateAsync({ settings })
      setDraft(null)
      toast.success(t('workspaceConfigTaxRatesSaveSuccess'))
    } catch {
      toast.error(t('workspaceConfigTaxRatesSaveFailed'))
    }
  }

  const onSave = async () => {
    if (!parsed) {
      toast.error(t('workspaceConfigTaxRatesInvalid'))
      return
    }
    await save(parsed)
  }

  const applyTypicalMx = async () => {
    if (!canManage) return
    setDraft(ratesToDraft(MX_TYPICAL_TAX_RATES))
    await save(MX_TYPICAL_TAX_RATES)
  }

  const setField = (key: keyof DraftRates, value: string) => {
    setDraft((prev) => ({ ...(prev ?? saved), [key]: sanitizePctInput(value) }))
  }

  const blurField = (key: keyof DraftRates) => {
    setDraft((prev) => {
      const base = prev ?? saved
      return { ...base, [key]: normalizePctOnBlur(base[key]) }
    })
  }

  return (
    <DashboardPage className="mx-auto w-full max-w-4xl space-y-10">
      <section>
        <div className="w-full">
          <h1 className={pageTitleClassName}>{t('workspaceConfigTaxRatesTitle')}</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
            {t('workspaceConfigTaxRatesSubtitle')}
          </p>
        </div>
      </section>

      {loading ? (
        <Skeleton className="h-64 w-full rounded-md" />
      ) : (
        <section className="space-y-6">
          <SettingsSectionHeader
            title={t('workspaceConfigTaxRatesDescription')}
            description={isUnset ? t('workspaceConfigTaxRatesUnsetHint') : undefined}
          />
          <SettingsCard>
            <SettingsRow
              label={t('workspaceConfigTaxRatesWithholdingIsr')}
              description={t('workspaceConfigTaxRatesWithholdingIsrDesc')}
            >
              <Input
                type="number"
                min={0}
                max={100}
                step="0.1"
                inputMode="decimal"
                disabled={!canManage || putMutation.isPending}
                value={working.withholding_isr_pct}
                onChange={(e) => setField('withholding_isr_pct', e.target.value)}
                onBlur={() => blurField('withholding_isr_pct')}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault()
                  }
                }}
                aria-label={t('workspaceConfigTaxRatesWithholdingIsr')}
              />
            </SettingsRow>
            <SettingsRow
              label={t('workspaceConfigTaxRatesWithholdingIva')}
              description={t('workspaceConfigTaxRatesWithholdingIvaDesc')}
            >
              <Input
                type="number"
                min={0}
                max={100}
                step="0.1"
                inputMode="decimal"
                disabled={!canManage || putMutation.isPending}
                value={working.withholding_iva_pct}
                onChange={(e) => setField('withholding_iva_pct', e.target.value)}
                onBlur={() => blurField('withholding_iva_pct')}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault()
                  }
                }}
                aria-label={t('workspaceConfigTaxRatesWithholdingIva')}
              />
            </SettingsRow>
            <SettingsRow
              label={t('workspaceConfigTaxRatesTransferredIva')}
              description={t('workspaceConfigTaxRatesTransferredIvaDesc')}
            >
              <Input
                type="number"
                min={0}
                max={100}
                step="0.1"
                inputMode="decimal"
                disabled={!canManage || putMutation.isPending}
                value={working.transferred_iva_pct}
                onChange={(e) => setField('transferred_iva_pct', e.target.value)}
                onBlur={() => blurField('transferred_iva_pct')}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault()
                  }
                }}
                aria-label={t('workspaceConfigTaxRatesTransferredIva')}
              />
            </SettingsRow>
            {canManage ? (
              <div className="flex flex-wrap justify-end gap-2 px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="tiny"
                  loading={putMutation.isPending}
                  disabled={putMutation.isPending}
                  onClick={() => void applyTypicalMx()}
                >
                  {t('workspaceConfigTaxRatesApplyTypicalMx')}
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  size="tiny"
                  loading={putMutation.isPending}
                  disabled={!isDirty || putMutation.isPending || parsed === null}
                  onClick={() => void onSave()}
                >
                  {t('workspaceConfigTaxRatesSave')}
                </Button>
              </div>
            ) : null}
          </SettingsCard>
          {!canManage ? (
            <p className="text-sm text-text-secondary">{t('workspaceConfigTaxRatesReadOnlyHint')}</p>
          ) : null}
        </section>
      )}
    </DashboardPage>
  )
}
