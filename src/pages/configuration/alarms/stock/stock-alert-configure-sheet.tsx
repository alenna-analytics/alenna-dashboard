import { useMemo, useState } from 'react'
import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { apiFetch } from '@/lib/api'
import { connectionLabel } from '@/lib/integrations/connection-label'
import { shellT } from '@/lib/i18n/shell-strings'
import type { StockOverrideApi, StockRuleApi } from '@/lib/types/alert-rules'
import type { PlatformConnection } from '@/lib/types/connectors'
import {
  channelAlertEnabled,
  findChannelOverride,
  type StockAlertConfigureKind,
} from '@/pages/configuration/alarms/stock/stock-alert-config-helpers'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'
import { Switch } from '@/ui/switch'

type StockAlertConfigureSheetProps = {
  lang: string
  kind: StockAlertConfigureKind | null
  open: boolean
  rule: StockRuleApi | undefined
  overrides: StockOverrideApi[]
  saving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: {
    kind: StockAlertConfigureKind
    globalEnabled: boolean
    globalVelocityPct?: number
    channelStates: { connectionId: string; enabled: boolean }[]
  }) => Promise<void>
}

function sheetTitleKey(kind: StockAlertConfigureKind): 'alarmsConfigureOutOfStockSheetTitle' | 'alarmsConfigureLowStockSheetTitle' {
  return kind === 'out_of_stock'
    ? 'alarmsConfigureOutOfStockSheetTitle'
    : 'alarmsConfigureLowStockSheetTitle'
}

function buildInitialChannelStates(
  kind: StockAlertConfigureKind,
  rule: StockRuleApi,
  items: StockOverrideApi[],
  connections: PlatformConnection[],
): Record<string, boolean> {
  const globalEnabled = kind === 'out_of_stock' ? rule.out_of_stock_enabled : rule.enabled
  const next: Record<string, boolean> = {}
  for (const connection of connections) {
    if (!globalEnabled) {
      next[connection.id] = false
      continue
    }
    const override = findChannelOverride(items, connection.id)
    next[connection.id] = channelAlertEnabled(kind, rule, override)
  }
  return next
}

function ConfigureSheetForm({
  lang,
  kind,
  rule,
  overrides,
  connections,
  saving,
  onOpenChange,
  onSave,
}: Omit<StockAlertConfigureSheetProps, 'open' | 'kind' | 'rule'> & {
  kind: StockAlertConfigureKind
  rule: StockRuleApi
  connections: PlatformConnection[]
}) {
  const [globalEnabled, setGlobalEnabled] = useState(() =>
    kind === 'out_of_stock' ? rule.out_of_stock_enabled : rule.enabled,
  )
  const [velocityPct, setVelocityPct] = useState(() => String(Math.round(rule.velocity_pct * 100)))
  const [channelStates, setChannelStates] = useState(() =>
    buildInitialChannelStates(kind, rule, overrides, connections),
  )

  const handleGlobalChange = (next: boolean) => {
    setGlobalEnabled(next)
    setChannelStates((current) => {
      const updated = { ...current }
      for (const connection of connections) {
        updated[connection.id] = next
      }
      return updated
    })
  }

  const handleChannelToggle = (connectionId: string, enabled: boolean) => {
    setChannelStates((current) => ({ ...current, [connectionId]: enabled }))
  }

  const handleSave = async () => {
    const parsed = Number(velocityPct)
    if (kind === 'low_stock' && (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100)) return

    await onSave({
      kind,
      globalEnabled,
      globalVelocityPct: kind === 'low_stock' ? parsed / 100 : undefined,
      channelStates: connections.map((connection) => ({
        connectionId: connection.id,
        enabled: globalEnabled
          ? (channelStates[connection.id] ??
            channelAlertEnabled(kind, rule, findChannelOverride(overrides, connection.id)))
          : false,
      })),
    })
  }

  const globalLabelKey =
    kind === 'out_of_stock' ? 'alarmsOutOfStockEnabledLabel' : 'alarmsLowStockEnabledLabel'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SheetHeader>
        <SheetTitle>{shellT(lang, sheetTitleKey(kind))}</SheetTitle>
      </SheetHeader>

      <SheetBody className="space-y-6">
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {shellT(lang, 'alarmsConfigureGlobalTitle')}
            </h3>
            <p className="mt-0.5 text-sm text-text-secondary">
              {shellT(lang, 'alarmsConfigureGlobalHelp')}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-md border border-border-default px-4 py-3">
            <Label htmlFor="stock-alert-global" className="text-sm font-medium">
              {shellT(lang, globalLabelKey)}
            </Label>
            <Switch
              id="stock-alert-global"
              checked={globalEnabled}
              onCheckedChange={handleGlobalChange}
              disabled={saving || !rule}
            />
          </div>

          {kind === 'low_stock' ? (
            <div className="space-y-2">
              <Label htmlFor="stock-alert-global-threshold">{shellT(lang, 'alarmsThresholdLabel')}</Label>
              <div className="flex max-w-xs items-center gap-2">
                <Input
                  id="stock-alert-global-threshold"
                  type="number"
                  min={1}
                  max={100}
                  value={velocityPct}
                  onChange={(event) => setVelocityPct(event.target.value)}
                  disabled={saving || !globalEnabled}
                />
                <span className="text-sm text-text-secondary">%</span>
              </div>
              <p className="text-sm text-text-secondary">{shellT(lang, 'alarmsThresholdHelp')}</p>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              {shellT(lang, 'alarmsConfigureChannelsTitle')}
            </h3>
            <p className="mt-0.5 text-sm text-text-secondary">
              {shellT(lang, 'alarmsConfigureChannelsHelp')}
            </p>
          </div>

          {connections.length === 0 ? (
            <p className="text-sm text-text-secondary">{shellT(lang, 'alarmsChannelPlaceholder')}</p>
          ) : (
            <ul className="space-y-2">
              {connections.map((connection) => (
                <li
                  key={connection.id}
                  className="flex items-center justify-between gap-4 rounded-md border border-border-default px-4 py-3"
                >
                  <span className="text-sm font-medium text-text-primary">
                    {connectionLabel(lang, connection)}
                  </span>
                  <Switch
                    checked={globalEnabled ? (channelStates[connection.id] ?? false) : false}
                    onCheckedChange={(next) => handleChannelToggle(connection.id, next)}
                    disabled={saving || !globalEnabled}
                    aria-label={connectionLabel(lang, connection)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </SheetBody>

      <SheetFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          {shellT(lang, 'alarmsCancel')}
        </Button>
        <Button type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? shellT(lang, 'alarmsSaving') : shellT(lang, 'alarmsSaveConfiguration')}
        </Button>
      </SheetFooter>
    </div>
  )
}

export function StockAlertConfigureSheet({
  lang,
  kind,
  open,
  rule,
  overrides,
  saving,
  onOpenChange,
  onSave,
}: StockAlertConfigureSheetProps) {
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()

  const connectionsQuery = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId) && open,
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as PlatformConnection[]
    },
  })

  const connections = useMemo(() => connectionsQuery.data ?? [], [connectionsQuery.data])
  const formKey = rule
    ? `${kind}-${rule.id}-${overrides.map((item) => item.id).join(',')}-${connections.map((item) => item.id).join(',')}`
    : 'pending'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        {open && kind && rule ? (
          connectionsQuery.isLoading ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <SheetHeader>
                <SheetTitle>{shellT(lang, sheetTitleKey(kind))}</SheetTitle>
              </SheetHeader>
              <SheetBody>
                <p className="text-sm text-text-secondary">{shellT(lang, 'filterComingSoon')}</p>
              </SheetBody>
            </div>
          ) : (
            <ConfigureSheetForm
              key={formKey}
              lang={lang}
              kind={kind}
              rule={rule}
              overrides={overrides}
              connections={connections}
              saving={saving}
              onOpenChange={onOpenChange}
              onSave={onSave}
            />
          )
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
