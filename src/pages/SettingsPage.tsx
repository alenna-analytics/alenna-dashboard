import { useAuth } from '@clerk/react'
import { useCallback, useEffect, useState } from 'react'

import { useLanguage } from '@/components/providers/language-provider'
import { usePageChrome } from '@/components/providers/page-chrome-context'
import { useWorkspace } from '@/components/providers/workspace-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrentTenant } from '@/auth/hooks'
import { apiPatchJson } from '@/lib/api'
import type { AccountCurrency } from '@/lib/currency-core'

type TenantSettingsResponse = {
  base_currency: string
  fx_mxn_per_usd: string
}

export function SettingsPage() {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { lang } = useLanguage()
  const { me, refetchMe } = useWorkspace()
  const { setPageMeta } = usePageChrome()

  const t = useCallback(
    (key: keyof typeof STRINGS.en) => STRINGS[lang][key],
    [lang],
  )

  useEffect(() => {
    setPageMeta({ title: t('settingsTitle') })
    return () => setPageMeta({ title: '' })
  }, [t, setPageMeta])

  const [baseCurrency, setBaseCurrency] = useState<AccountCurrency>('MXN')
  const [fxStr, setFxStr] = useState('18.5')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!me) return
    setBaseCurrency(me.base_currency === 'USD' ? 'USD' : 'MXN')
    setFxStr(String(me.fx_mxn_per_usd))
  }, [me])

  const canEdit = me?.role === 'admin' || me?.role === 'owner'

  const onSave = async () => {
    if (!me || !canEdit) return
    const fx = Number(fxStr.replace(',', '.'))
    if (!Number.isFinite(fx) || fx <= 0) {
      setMessage(t('settingsFxInvalid'))
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await apiPatchJson(
        '/me/tenant/settings',
        (a) => getToken(a),
        {
          base_currency: baseCurrency,
          fx_mxn_per_usd: fx,
        },
        {},
        tenantId,
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || res.statusText)
      }
      const data = (await res.json()) as TenantSettingsResponse
      setBaseCurrency(data.base_currency === 'USD' ? 'USD' : 'MXN')
      setFxStr(String(data.fx_mxn_per_usd))
      await refetchMe()
      setMessage(t('settingsSaved'))
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : t('settingsSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-lg border-border-default bg-bg-surface">
        <CardHeader>
          <CardTitle className="text-base text-text-primary">
            {t('settingsCurrencyTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs leading-relaxed text-text-secondary">{t('settingsCurrencyHelp')}</p>

          {!me ? (
            <p className="text-sm text-text-tertiary">{t('settingsLoading')}</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="base-currency">{t('settingsBaseCurrency')}</Label>
                <Select
                  value={baseCurrency}
                  onValueChange={(v) => {
                    setBaseCurrency(v as AccountCurrency)
                  }}
                  disabled={!canEdit}
                >
                  <SelectTrigger id="base-currency" className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fx-mxn-usd">{t('settingsFxLabel')}</Label>
                <Input
                  id="fx-mxn-usd"
                  className="max-w-xs font-mono"
                  value={fxStr}
                  onChange={(e) => {
                    setFxStr(e.target.value)
                  }}
                  disabled={!canEdit}
                  inputMode="decimal"
                />
                <p className="text-[11px] text-text-tertiary">{t('settingsFxHelp')}</p>
              </div>

              {!canEdit ? (
                <p className="text-xs text-text-tertiary">{t('settingsAdminOnly')}</p>
              ) : (
                <Button type="button" size="sm" disabled={saving} onClick={() => void onSave()}>
                  {saving ? '…' : t('settingsSave')}
                </Button>
              )}

              {message ? (
                <p className="text-xs text-text-secondary" role="status">
                  {message}
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const STRINGS = {
  en: {
    settingsTitle: 'Settings',
    settingsDesc: 'Workspace preferences.',
    settingsCurrencyTitle: 'Data currency (account)',
    settingsCurrencyHelp:
      'Amounts in analytics are stored in this currency. Use the header (MXN / USD) only to change how numbers are displayed; conversion uses the rate below.',
    settingsBaseCurrency: 'Default currency for stored data',
    settingsFxLabel: 'MXN per 1 USD',
    settingsFxHelp:
      'Used when converting between Mexican pesos and US dollars for display. Update when you need a different approximate rate.',
    settingsSave: 'Save',
    settingsSaved: 'Saved.',
    settingsSaveFailed: 'Could not save settings.',
    settingsFxInvalid: 'Enter a positive number for MXN per USD.',
    settingsAdminOnly: 'Only workspace admins can change these values.',
    settingsLoading: 'Loading…',
  },
  es: {
    settingsTitle: 'Configuración',
    settingsDesc: 'Preferencias del espacio de trabajo.',
    settingsCurrencyTitle: 'Moneda de datos (cuenta)',
    settingsCurrencyHelp:
      'Las cifras analíticas se guardan en esta moneda. El selector del encabezado (MXN / USD) solo cambia cómo se muestran; la conversión usa la tasa de abajo.',
    settingsBaseCurrency: 'Moneda por defecto de los datos almacenados',
    settingsFxLabel: 'MXN por 1 USD',
    settingsFxHelp:
      'Se usa al convertir entre pesos y dólares para visualización. Actualízala si necesitas otra tasa aproximada.',
    settingsSave: 'Guardar',
    settingsSaved: 'Guardado.',
    settingsSaveFailed: 'No se pudieron guardar los ajustes.',
    settingsFxInvalid: 'Indica un número positivo de MXN por USD.',
    settingsAdminOnly: 'Solo los administradores del espacio pueden cambiar estos valores.',
    settingsLoading: 'Cargando…',
  },
} as const
