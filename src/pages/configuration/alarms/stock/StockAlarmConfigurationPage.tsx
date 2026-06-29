import { useMemo, useState } from 'react'
import { useAuth } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import { apiFetch } from '@/lib/api'
import { shellT } from '@/lib/i18n/shell-strings'
import type { StockOverrideApi } from '@/lib/types/alert-rules'
import type { PlatformConnection } from '@/lib/types/connectors'
import {
  showAlarmConfigErrorToast,
  showAlarmConfigSuccessToast,
} from '@/pages/configuration/alarms/stock/alarm-config-toast'
import { LowStockRuleSheet } from '@/pages/configuration/alarms/stock/low-stock-rule-sheet'
import { LowStockRulesTable } from '@/pages/configuration/alarms/stock/low-stock-rules-table'
import {
  channelAlertEnabled,
  findChannelOverride,
  globalAlertEnabled,
  lowStockScopedRules,
  resolveStockRuleTargetLabel,
  type StockAlertConfigureKind,
} from '@/pages/configuration/alarms/stock/stock-alert-config-helpers'
import { StockAlertConfigureSheet } from '@/pages/configuration/alarms/stock/stock-alert-configure-sheet'
import { StockAlertTypeCard } from '@/pages/configuration/alarms/stock/stock-alert-type-card'
import {
  useCreateStockOverrideMutation,
  useDeleteStockOverrideMutation,
  usePatchStockOverrideMutation,
  usePatchStockRuleMutation,
  useStockOverridesQuery,
  useStockRuleQuery,
} from '@/pages/configuration/alarms/stock/use-alert-rules-queries'
import { ConfigurationInnerSubmoduleBreadcrumb } from '@/pages/configuration/configuration-inner-submodule-breadcrumb'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { Skeleton } from '@/ui/skeleton'

export function StockAlarmConfigurationPage() {
  const { lang } = useLanguage()
  const { getToken } = useAuth()
  const { tenantId } = useCurrentTenant()
  const { me } = useAppBootstrap()
  const isAdmin = me?.role === 'admin' || me?.role === 'owner'

  const stockRuleQuery = useStockRuleQuery()
  const overridesQuery = useStockOverridesQuery()
  const patchRuleMutation = usePatchStockRuleMutation()
  const createOverrideMutation = useCreateStockOverrideMutation()
  const patchOverrideMutation = usePatchStockOverrideMutation()
  const deleteOverrideMutation = useDeleteStockOverrideMutation()

  const [configureKind, setConfigureKind] = useState<StockAlertConfigureKind | null>(null)
  const [ruleSheetOpen, setRuleSheetOpen] = useState(false)
  const [editingOverride, setEditingOverride] = useState<StockOverrideApi | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const rule = stockRuleQuery.data
  const overrides = useMemo(
    () => overridesQuery.data?.items ?? [],
    [overridesQuery.data?.items],
  )
  const lowStockRules = useMemo(() => lowStockScopedRules(overrides), [overrides])

  const connectionsQuery = useQuery({
    queryKey: ['connectors', tenantId],
    enabled: Boolean(tenantId),
    queryFn: async (): Promise<PlatformConnection[]> => {
      const res = await apiFetch('/connectors', (a) => getToken(a), {}, tenantId)
      if (!res.ok) throw new Error(await res.text())
      return (await res.json()) as PlatformConnection[]
    },
  })

  const connectionsById = useMemo(() => {
    const map = new Map<string, PlatformConnection>()
    for (const connection of connectionsQuery.data ?? []) {
      map.set(connection.id, connection)
    }
    return map
  }, [connectionsQuery.data])

  const resolveTargetLabel = useMemo(
    () => (item: StockOverrideApi) => resolveStockRuleTargetLabel(lang, item, connectionsById),
    [lang, connectionsById],
  )

  const loading = stockRuleQuery.isLoading || overridesQuery.isLoading
  const saving =
    patchRuleMutation.isPending ||
    createOverrideMutation.isPending ||
    patchOverrideMutation.isPending ||
    deleteOverrideMutation.isPending

  const handleDelete = async () => {
    if (!editingOverride) return

    try {
      await deleteOverrideMutation.mutateAsync(editingOverride.id)
      showAlarmConfigSuccessToast(lang, 'alarmsToastRuleDeleted')
      setRuleSheetOpen(false)
      setEditingOverride(null)
    } catch (error) {
      showAlarmConfigErrorToast(lang, error)
      throw error
    }
  }

  const handleToggleEnabled = async (item: StockOverrideApi, enabled: boolean) => {
    if (enabled && rule && !rule.enabled) return
    setTogglingId(item.id)
    try {
      await patchOverrideMutation.mutateAsync({
        overrideId: item.id,
        body: { enabled },
      })
      showAlarmConfigSuccessToast(lang, 'alarmsToastRuleUpdated')
    } catch (error) {
      showAlarmConfigErrorToast(lang, error)
    } finally {
      setTogglingId(null)
    }
  }

  const handleSaveConfigure = async (payload: {
    kind: StockAlertConfigureKind
    globalEnabled: boolean
    globalVelocityPct?: number
    channelStates: { connectionId: string; enabled: boolean }[]
  }) => {
    if (!rule) return

    try {
      if (payload.kind === 'out_of_stock') {
        if (payload.globalEnabled !== rule.out_of_stock_enabled) {
          await patchRuleMutation.mutateAsync({ out_of_stock_enabled: payload.globalEnabled })
        }
      } else {
        const body: { enabled?: boolean; velocity_pct?: number } = {}
        if (payload.globalEnabled !== rule.enabled) body.enabled = payload.globalEnabled
        if (
          payload.globalVelocityPct != null &&
          payload.globalVelocityPct !== rule.velocity_pct
        ) {
          body.velocity_pct = payload.globalVelocityPct
        }
        if (Object.keys(body).length > 0) {
          await patchRuleMutation.mutateAsync(body)
        }
      }

      for (const channelState of payload.channelStates) {
        const existing = findChannelOverride(overrides, channelState.connectionId)
        const currentEnabled = channelAlertEnabled(payload.kind, rule, existing)
        if (channelState.enabled === currentEnabled) continue

        if (existing) {
          await patchOverrideMutation.mutateAsync({
            overrideId: existing.id,
            body:
              payload.kind === 'out_of_stock'
                ? { out_of_stock_enabled: channelState.enabled }
                : { enabled: channelState.enabled },
          })
        } else {
          await createOverrideMutation.mutateAsync({
            alert_type: 'stock',
            scope_type: 'channel',
            platform_connection_id: channelState.connectionId,
            enabled: payload.kind === 'low_stock' ? channelState.enabled : rule.enabled,
            out_of_stock_enabled:
              payload.kind === 'out_of_stock' ? channelState.enabled : rule.out_of_stock_enabled,
            velocity_pct: rule.velocity_pct,
          })
        }
      }

      showAlarmConfigSuccessToast(lang, 'alarmsToastDefaultSaved')
      setConfigureKind(null)
    } catch (error) {
      showAlarmConfigErrorToast(lang, error)
    }
  }

  const handleSaveLowStockRule = async (payload: {
    scope_type: 'channel' | 'product' | 'product_listing'
    scope_id: string | null
    platform_connection_id: string | null
    enabled: boolean
    velocity_pct: number
  }) => {
    if (!rule) return

    const enabled = rule.enabled && payload.enabled

    try {
      if (editingOverride) {
        await patchOverrideMutation.mutateAsync({
          overrideId: editingOverride.id,
          body: {
            enabled,
            velocity_pct: payload.velocity_pct,
          },
        })
        showAlarmConfigSuccessToast(lang, 'alarmsToastRuleUpdated')
      } else {
        await createOverrideMutation.mutateAsync({
          alert_type: 'stock',
          scope_type: payload.scope_type,
          scope_id: payload.scope_id,
          platform_connection_id: payload.platform_connection_id,
          enabled,
          out_of_stock_enabled: rule.out_of_stock_enabled,
          velocity_pct: payload.velocity_pct,
        })
        showAlarmConfigSuccessToast(lang, 'alarmsToastRuleCreated')
      }
      setRuleSheetOpen(false)
      setEditingOverride(null)
    } catch (error) {
      showAlarmConfigErrorToast(lang, error)
    }
  }

  return (
    <DashboardPage className="space-y-8">
      <section className="max-w-2xl">
        <ConfigurationInnerSubmoduleBreadcrumb />
        <h1 className="text-subtitle font-semibold tracking-[-0.02em] text-text-primary">
          {shellT(lang, 'alarmsStockTypeTitle')}
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          {shellT(lang, 'alarmsStockTypeDescription')}
        </p>
      </section>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          <section className="grid w-full gap-3">
            <StockAlertTypeCard
              lang={lang}
              titleKey="alarmsOutOfStockTitle"
              descriptionKey="alarmsOutOfStockDescription"
              active={rule ? globalAlertEnabled('out_of_stock', rule) : false}
              disabled={!isAdmin}
              onConfigure={() => setConfigureKind('out_of_stock')}
            />
            <StockAlertTypeCard
              lang={lang}
              titleKey="alarmsLowStockTitle"
              descriptionKey="alarmsLowStockDescription"
              active={rule ? globalAlertEnabled('low_stock', rule) : false}
              disabled={!isAdmin}
              currentValueLabelKey="alarmsCurrentThresholdLabel"
              currentValue={rule ? `${Math.round(rule.velocity_pct * 100)}%` : undefined}
              onConfigure={() => setConfigureKind('low_stock')}
            />
          </section>

          <LowStockRulesTable
            lang={lang}
            items={lowStockRules}
            globalLowStockEnabled={rule ? rule.enabled : false}
            isAdmin={isAdmin}
            togglingId={togglingId}
            resolveTargetLabel={resolveTargetLabel}
            onAdd={() => {
              setEditingOverride(null)
              setRuleSheetOpen(true)
            }}
            onEdit={(item) => {
              setEditingOverride(item)
              setRuleSheetOpen(true)
            }}
            onToggleEnabled={handleToggleEnabled}
          />
        </>
      )}

      <StockAlertConfigureSheet
        lang={lang}
        kind={configureKind}
        open={configureKind != null}
        rule={rule}
        overrides={overrides}
        saving={saving}
        onOpenChange={(open) => {
          if (!open) setConfigureKind(null)
        }}
        onSave={handleSaveConfigure}
      />

      <LowStockRuleSheet
        lang={lang}
        open={ruleSheetOpen}
        editing={editingOverride}
        rule={rule}
        saving={saving}
        deleting={deleteOverrideMutation.isPending}
        onOpenChange={(open) => {
          setRuleSheetOpen(open)
          if (!open) setEditingOverride(null)
        }}
        onSave={handleSaveLowStockRule}
        onDelete={handleDelete}
      />
    </DashboardPage>
  )
}
