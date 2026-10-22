import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { useMoney } from '@/hooks/use-money'
import { can } from '@/lib/permissions/can'
import { usePnlAwareT } from '@/pages/configuration/pnl-terms/use-pnl-labels-queries'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { dateRangePickerStrings } from '@/ui/date-range-picker'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'

import { defaultProductInsightRange } from '../product-detail-range'
import { ProductDetailUnsavedBar } from '../product-detail-unsaved-bar'
import { PRODUCTS_LINKING_PATH } from '../products-inner-nav'
import { GroupInsightProvider } from './group-insight-context'
import { VinculacionDissolveConfirmDialog } from './vinculacion-dissolve-confirm-dialog'
import { VinculacionGroupAnalytics } from './vinculacion-group-analytics'
import { VinculacionGroupHeader } from './vinculacion-group-header'
import { VinculacionGroupMembersTable } from './vinculacion-group-members-table'
import { VinculacionGroupRentabilidad } from './vinculacion-group-rentabilidad'
import { VinculacionPickerSheet } from './VinculacionPickerSheet'
import {
  useAddProductLinkMembersMutation,
  useDissolveProductLinkGroupMutation,
  usePatchProductLinkGroupMutation,
  useProductLinkGroupQuery,
} from './use-product-link-queries'

type HubTabId = 'analytics' | 'platform-payment' | 'related'

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
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="h-10 w-80 max-w-full" />
      <Skeleton className="h-72 w-full" />
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
  const [tab, setTab] = useState<HubTabId>('analytics')
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
  const titleDirty = title.trim() !== group.title.trim()
  const canAddMember = canEditGroups && group.members.length < MAX_GROUP_MEMBERS

  const handleTitleDiscard = () => {
    setTitleDraft(null)
  }

  const handleTitleSave = async () => {
    const cleaned = title.trim()
    if (!cleaned || cleaned === group.title.trim()) {
      setTitleDraft(null)
      return
    }
    try {
      await patch.mutateAsync(cleaned)
      setTitleDraft(null)
    } catch {
      toast.error(t('productsDetailToastSaveFailed'))
    }
  }

  return (
    <DashboardPage className="flex min-h-full flex-1 flex-col gap-6 lg:gap-8">
      <VinculacionGroupHeader
        group={group}
        lang={lang}
        t={t}
        title={title}
        canEditTitle={canEditGroups}
        canAddMember={canAddMember}
        canDissolve={canEditGroups}
        onTitleChange={setTitleDraft}
        onTitleDiscard={handleTitleDiscard}
        onAddProduct={() => setPickerOpen(true)}
        onDissolve={() => setDissolveOpen(true)}
      />

      <GroupInsightProvider group={group} t={t}>
        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (value === 'analytics' || value === 'platform-payment' || value === 'related') {
              setTab(value)
            }
          }}
        >
          <TabsList variant="line">
            <TabsTrigger value="analytics">{t('productsDetailTabAnalytics')}</TabsTrigger>
            <TabsTrigger value="platform-payment">
              {t('productsDetailTabPlatformPayment')}
            </TabsTrigger>
            <TabsTrigger value="related">{t('productsDetailTabRelated')}</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="analytics">
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
            </TabsContent>
            <TabsContent value="platform-payment">
              <VinculacionGroupRentabilidad
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
            </TabsContent>
            <TabsContent value="related">
              <VinculacionGroupMembersTable members={group.members} t={t} isFetching={false} />
            </TabsContent>
          </div>
        </Tabs>
      </GroupInsightProvider>

      {canEditGroups ? (
        <ProductDetailUnsavedBar
          open={titleDirty}
          t={t}
          onDiscard={handleTitleDiscard}
          onSave={() => void handleTitleSave()}
          savePending={patch.isPending}
        />
      ) : null}

      <VinculacionPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        t={t}
        mode="add"
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
            .catch(() => toast.error(t('productsVinculacionUnlinkFailed')))
        }}
      />
    </DashboardPage>
  )
}
