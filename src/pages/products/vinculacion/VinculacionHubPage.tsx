import { useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { useMoney } from '@/hooks/use-money'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import { cn } from '@/lib/utils'
import { usePnlAwareT } from '@/pages/configuration/pnl-terms/use-pnl-labels-queries'
import { settingsDescriptionClassName, SettingsSectionHeader, dangerActionCardClassName } from '@/pages/configuration/settings-layout'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { dateRangePickerStrings } from '@/ui/date-range-picker'
import { EmptyState } from '@/ui/empty-state'
import { Input } from '@/ui/input'
import { kpiCardGridClassName } from '@/ui/kpi-card'
import { Skeleton } from '@/ui/skeleton'
import { surfaceKpiClassName } from '@/ui/surface'

import { PRODUCTS_LINKING_PATH } from '../products-inner-nav'
import { defaultProductInsightRange } from '../product-detail-range'
import { VinculacionDissolveConfirmDialog } from './vinculacion-dissolve-confirm-dialog'
import { VinculacionGroupAnalytics } from './vinculacion-group-analytics'
import { VinculacionGroupMembersTable } from './vinculacion-group-members-table'
import { VinculacionPickerSheet } from './VinculacionPickerSheet'
import {
  useAddProductLinkMembersMutation,
  useDissolveProductLinkGroupMutation,
  usePatchProductLinkGroupMutation,
  useProductLinkGroupQuery,
} from './use-product-link-queries'

type ShellT = (key: ShellStringKey) => string

const MAX_GROUP_MEMBERS = 8

export function VinculacionHubPage() {
  const { groupId } = useParams<{ groupId: string }>()
  if (!groupId) {
    return <div className="p-8 text-sm text-text-secondary">Invalid group.</div>
  }
  return <VinculacionHubBody key={groupId} groupId={groupId} />
}

function VinculacionHubSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8" role="status">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-7 w-36 shrink-0 rounded-md" />
      </div>
      <div className={kpiCardGridClassName}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={surfaceKpiClassName}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}

function VinculacionHubBody({ groupId }: { groupId: string }) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const t = usePnlAwareT()
  const canEditGroups = can(me, 'products.groups.edit')
  const defaultInsight = useMemo(() => defaultProductInsightRange(), [])
  const [insightStart, setInsightStart] = useState(defaultInsight.start)
  const [insightEnd, setInsightEnd] = useState(defaultInsight.end)
  const groupQuery = useProductLinkGroupQuery(groupId, insightStart, insightEnd)
  const patch = usePatchProductLinkGroupMutation(groupId)
  const addMembers = useAddProductLinkMembersMutation(groupId)
  const dissolve = useDissolveProductLinkGroupMutation()
  const group = groupQuery.data
  const baseCurrency = group?.base_currency ?? 'MXN'
  const { format: formatMoney, formatKpi } = useMoney()
  const fmtBase = (value: number) => formatMoney(value, { nativeCurrency: baseCurrency })
  const fmtCard = (value: number) => formatKpi(value, { nativeCurrency: baseCurrency })
  const [titleDraft, setTitleDraft] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dissolveOpen, setDissolveOpen] = useState(false)
  const pickerStrings = useMemo(() => dateRangePickerStrings(t), [t])

  if (!group && groupQuery.isPending) {
    return (
      <DashboardPage className="flex min-h-full flex-1 flex-col gap-6 lg:gap-8">
        <VinculacionHubSkeleton />
      </DashboardPage>
    )
  }
  if (!group) {
    return (
      <DashboardPage>
        <EmptyState icon="products" title={t('productsVinculacionGroupMissing')} />
      </DashboardPage>
    )
  }

  const title = titleDraft ?? group.title
  const platforms = uniqueMemberPlatforms(group.members.map((member) => member.platform))
  const canAddMember = canEditGroups && group.members.length < MAX_GROUP_MEMBERS

  return (
    <DashboardPage className="flex min-h-full flex-1 flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {canEditGroups ? (
          <Input
            value={title}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={() => {
              const cleaned = title.trim()
              if (!cleaned || cleaned === group.title) {
                setTitleDraft(null)
                return
              }
              void patch.mutateAsync(cleaned).then(() => setTitleDraft(null))
            }}
            className={cn(pageTitleClassName, 'h-auto min-w-0 max-w-xl border-transparent px-0 shadow-none')}
          />
        ) : (
          <h1 className={pageTitleClassName}>{group.title}</h1>
        )}
        {canAddMember ? (
          <Button
            type="button"
            variant="accent"
            size="tiny"
            className="shrink-0"
            onClick={() => setPickerOpen(true)}
          >
            <Plus aria-hidden />
            {t('productsVinculacionAddProduct')}
          </Button>
        ) : null}
      </div>

      <HubSection
        title={t('productsVinculacionSectionProducts')}
        description={t('productsVinculacionMembersDescription')}
      >
        <VinculacionGroupMembersTable
          members={group.members}
          t={t}
          isFetching={false}
        />
      </HubSection>

      <HubSection
        title={t('productsDetailTabAnalytics')}
        description={t('productsDetailSectionInsightsDescription')}
      >
        <VinculacionGroupAnalytics
          group={group}
          lang={lang}
          t={t}
          baseCurrency={baseCurrency}
          fmtBase={fmtBase}
          fmtCard={fmtCard}
          insightStart={insightStart}
          insightEnd={insightEnd}
          setInsightStart={setInsightStart}
          setInsightEnd={setInsightEnd}
          pickerStrings={pickerStrings}
          insightsFetching={groupQuery.isFetching}
        />
      </HubSection>

      {canEditGroups ? (
        <HubSection title={t('productsVinculacionDangerTitle')}>
          <VinculacionDangerZone t={t} loading={dissolve.isPending} onDissolve={() => setDissolveOpen(true)} />
        </HubSection>
      ) : null}

      <VinculacionPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        t={t}
        mode="add"
        occupiedPlatforms={platforms}
        adding={addMembers.isPending}
        onAdd={(productIds) => addMembers.mutateAsync(productIds)}
      />
      <VinculacionDissolveConfirmDialog
        open={dissolveOpen}
        onOpenChange={setDissolveOpen}
        pending={dissolve.isPending}
        t={t}
        onConfirm={() => {
          void dissolve
            .mutateAsync(groupId)
            .then(() => {
              setDissolveOpen(false)
              void navigate(PRODUCTS_LINKING_PATH)
            })
            .catch(() => toast.error(t('productsVinculacionLinkFailed')))
        }}
      />
    </DashboardPage>
  )
}

type HubSectionProps = {
  title: string
  description?: string
  children: ReactNode
}

function HubSection({ title, description, children }: HubSectionProps) {
  return (
    <section className="space-y-4">
      <SettingsSectionHeader title={title} description={description} />
      {children}
    </section>
  )
}

type VinculacionDangerZoneProps = {
  t: ShellT
  loading: boolean
  onDissolve: () => void
}

function VinculacionDangerZone({ t, loading, onDissolve }: VinculacionDangerZoneProps) {
  return (
    <div className={dangerActionCardClassName}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className="flex size-[23px] shrink-0 items-center justify-center rounded-md bg-[var(--status-red-500)] text-white"
          aria-hidden
        >
          <AlertTriangle className="size-3.5" strokeWidth={2.25} />
        </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">{t('productsVinculacionDissolve')}</p>
              <p className={cn('mt-1', settingsDescriptionClassName)}>
                {t('productsVinculacionDangerDescription')}
              </p>
            </div>
          <Button type="button" variant="destructive" size="tiny" loading={loading} onClick={onDissolve}>
            {t('productsVinculacionDissolve')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function uniqueMemberPlatforms(platforms: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const platform of platforms) {
    const slug = platform.trim().toLowerCase()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push(platform)
  }
  return out
}
