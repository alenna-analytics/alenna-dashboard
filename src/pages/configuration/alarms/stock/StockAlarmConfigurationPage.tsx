import { useState } from 'react'

import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import { shellT } from '@/lib/i18n/shell-strings'
import type { StockOverrideApi } from '@/lib/types/alert-rules'
import {
  showAlarmConfigErrorToast,
  showAlarmConfigSuccessToast,
} from '@/pages/configuration/alarms/stock/alarm-config-toast'
import type { AlertScopeType } from '@/lib/types/alert-rules'
import { OutOfStockInfoCard } from '@/pages/configuration/alarms/stock/out-of-stock-info-card'
import { OverrideSheet } from '@/pages/configuration/alarms/stock/override-sheet'
import { ScopedRulesTable } from '@/pages/configuration/alarms/stock/scoped-rules-table'
import { TenantDefaultForm } from '@/pages/configuration/alarms/stock/tenant-default-form'
import {
  useCreateStockOverrideMutation,
  useDeleteStockOverrideMutation,
  usePatchStockOverrideMutation,
  usePatchStockRuleMutation,
  useStockOverridesQuery,
  useStockRuleQuery,
} from '@/pages/configuration/alarms/stock/use-alert-rules-queries'
import { useAlertsSheet } from '@/shell/alerts/alerts-sheet-context'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { Button } from '@/ui/button'
import { Skeleton } from '@/ui/skeleton'

export function StockAlarmConfigurationPage() {
  const { lang } = useLanguage()
  const { me } = useAppBootstrap()
  const { openSheet } = useAlertsSheet()
  const isAdmin = me?.role === 'admin' || me?.role === 'owner'

  const stockRuleQuery = useStockRuleQuery()
  const overridesQuery = useStockOverridesQuery()
  const patchRuleMutation = usePatchStockRuleMutation()
  const createOverrideMutation = useCreateStockOverrideMutation()
  const patchOverrideMutation = usePatchStockOverrideMutation()
  const deleteOverrideMutation = useDeleteStockOverrideMutation()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingOverride, setEditingOverride] = useState<StockOverrideApi | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loading = stockRuleQuery.isLoading || overridesQuery.isLoading
  const saving =
    patchRuleMutation.isPending ||
    createOverrideMutation.isPending ||
    patchOverrideMutation.isPending ||
    deleteOverrideMutation.isPending

  const handleDelete = async (item: StockOverrideApi) => {
    setDeletingId(item.id)
    try {
      await deleteOverrideMutation.mutateAsync(item.id)
      showAlarmConfigSuccessToast(lang, 'alarmsToastRuleDeleted')
    } catch (error) {
      showAlarmConfigErrorToast(lang, error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaveDefault = async (payload: { enabled: boolean; velocity_pct: number }) => {
    try {
      await patchRuleMutation.mutateAsync(payload)
      showAlarmConfigSuccessToast(lang, 'alarmsToastDefaultSaved')
    } catch (error) {
      showAlarmConfigErrorToast(lang, error)
    }
  }

  const handleSaveOverride = async (payload: {
    scope_type: AlertScopeType
    scope_id: string | null
    platform_connection_id: string | null
    enabled: boolean
    velocity_pct: number
  }) => {
    try {
      if (editingOverride) {
        await patchOverrideMutation.mutateAsync({
          overrideId: editingOverride.id,
          body: {
            enabled: payload.enabled,
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
          enabled: payload.enabled,
          velocity_pct: payload.velocity_pct,
        })
        showAlarmConfigSuccessToast(lang, 'alarmsToastRuleCreated')
      }
      setSheetOpen(false)
      setEditingOverride(null)
    } catch (error) {
      showAlarmConfigErrorToast(lang, error)
    }
  }

  return (
    <DashboardPage className="space-y-8">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
            {shellT(lang, 'alarmsStockTypeTitle')}
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            {shellT(lang, 'alarmsStockTypeDescription')}
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={openSheet}>
          {shellT(lang, 'alarmsOpenActiveAlerts')}
        </Button>
      </section>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <section className="space-y-4">
          <OutOfStockInfoCard lang={lang} />
          <TenantDefaultForm
            key={stockRuleQuery.data?.id ?? 'pending'}
            lang={lang}
            rule={stockRuleQuery.data}
            isAdmin={isAdmin}
            saving={patchRuleMutation.isPending}
            onSave={handleSaveDefault}
          />
          <ScopedRulesTable
            lang={lang}
            items={overridesQuery.data?.items ?? []}
            isAdmin={isAdmin}
            deletingId={deletingId}
            onAdd={() => {
              setEditingOverride(null)
              setSheetOpen(true)
            }}
            onEdit={(item) => {
              setEditingOverride(item)
              setSheetOpen(true)
            }}
            onDelete={handleDelete}
          />
        </section>
      )}

      <OverrideSheet
        lang={lang}
        open={sheetOpen}
        editing={editingOverride}
        saving={saving}
        onOpenChange={setSheetOpen}
        onSave={handleSaveOverride}
      />
    </DashboardPage>
  )
}
