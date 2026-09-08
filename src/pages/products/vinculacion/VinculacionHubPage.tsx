import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { useMoney } from '@/hooks/use-money'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkGroupApi } from '@/lib/types/product-links'
import { can } from '@/lib/permissions/can'
import { cn } from '@/lib/utils'
import { ChannelsPnlTable } from '@/pages/channels/channels-pnl-table'
import {
  usePnlAwareT,
  usePnlLabelResolver,
} from '@/pages/configuration/pnl-terms/use-pnl-labels-queries'
import {
  dangerActionCardClassName,
  settingsDescriptionClassName,
  SettingsSectionHeader,
} from '@/pages/configuration/settings-layout'
import { DashboardPage } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { dateRangePickerStrings } from '@/ui/date-range-picker'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'

import {
  buildProductPnlWaterfallSegments,
  productPnlWaterfallSourceFromPeriod,
} from '../product-detail-pnl-waterfall-segments'
import { defaultProductInsightRange } from '../product-detail-range'
import { ProductDetailWaterfallBlock } from '../product-detail-waterfall-block'
import { GroupInventoryByChannel } from '../product-detail-inventory-by-channel'
import { PRODUCTS_LINKING_PATH } from '../products-inner-nav'
import { useGroupInsightDimension } from './group-insight-dimension'
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

type ShellT = (key: ShellStringKey) => string
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
  const labelForRow = usePnlLabelResolver()
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
  const canAddMember = canEditGroups && group.members.length < MAX_GROUP_MEMBERS

  return (
    <DashboardPage className="flex min-h-full flex-1 flex-col gap-6 lg:gap-8">
      <VinculacionGroupHeader
        group={group}
        t={t}
        title={title}
        canEditTitle={canEditGroups}
        canAddMember={canAddMember}
        onTitleChange={setTitleDraft}
        onTitleBlur={() => {
          const cleaned = title.trim()
          if (!cleaned || cleaned === group.title) {
            setTitleDraft(null)
            return
          }
          void patch.mutateAsync(cleaned).then(() => setTitleDraft(null))
        }}
        onAddProduct={() => setPickerOpen(true)}
      />

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
          <TabsTrigger value="platform-payment">{t('productsDetailTabPlatformPayment')}</TabsTrigger>
          <TabsTrigger value="related">{t('productsDetailTabRelated')}</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="analytics">
            <GroupAnalyticsVistaA
              group={group}
              lang={lang}
              t={t}
              labelForRow={labelForRow}
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
            <div className="flex flex-col gap-6">
              <VinculacionGroupMembersTable members={group.members} t={t} isFetching={false} />
              {canEditGroups ? (
                <section className="space-y-6">
                  <SettingsSectionHeader
                    title={t('productsVinculacionDangerTitle')}
                    description={t('productsVinculacionDangerSubtitle')}
                  />
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
                          <p className="text-sm font-semibold text-text-primary">
                            {t('productsVinculacionDangerCardTitle')}
                          </p>
                          <p className={cn('mt-1', settingsDescriptionClassName)}>
                            {t('productsVinculacionDangerDescription')}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="tiny"
                          loading={dissolve.isPending}
                          onClick={() => setDissolveOpen(true)}
                        >
                          {t('productsVinculacionDissolve')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}
            </div>
          </TabsContent>
        </div>
      </Tabs>

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

function GroupAnalyticsVistaA({
  group,
  lang,
  t,
  labelForRow,
  baseCurrency,
  fmtBase,
  fmtCard,
  insightStart,
  insightEnd,
  setInsightStart,
  setInsightEnd,
  pickerStrings,
  insightsFetching,
}: {
  group: ProductLinkGroupApi
  lang: string
  t: ShellT
  labelForRow: ReturnType<typeof usePnlLabelResolver>
  baseCurrency: string
  fmtBase: (value: number) => string
  fmtCard: (value: number) => string
  insightStart: string
  insightEnd: string
  setInsightStart: (value: string) => void
  setInsightEnd: (value: string) => void
  pickerStrings: ReturnType<typeof dateRangePickerStrings>
  insightsFetching: boolean
}) {
  const insight = useGroupInsightDimension(group, t)
  const { period, settlement, pnlPlatforms, pnlMetrics, allSelected } = insight

  const pnlSegments = useMemo(
    () =>
      buildProductPnlWaterfallSegments(
        productPnlWaterfallSourceFromPeriod(
          {
            period_gross_sales: period.period_gross_sales,
            period_net_sales: period.period_net_sales,
            period_cogs: period.period_cogs,
            gross_profit: period.period_gross_profit,
            contribution_margin: period.contribution_margin,
            channel_margin: period.channel_margin,
          },
          allSelected ? group.period_settlement : settlement,
        ),
        t,
      ),
    [allSelected, group.period_settlement, period, settlement, t],
  )

  return (
    <div className="flex flex-col gap-8">
      <VinculacionGroupAnalytics
        group={group}
        insight={insight}
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
        insightsFetching={insightsFetching}
      />
      <ProductDetailWaterfallBlock
        title={t('productsDetailPnlAnalyticsTitle')}
        description={t('productsDetailPnlAnalyticsDescription')}
        segments={pnlSegments}
        currency={baseCurrency}
        grossRevenue={period.period_gross_sales}
        t={t}
        finalBarCaption={t('productsDetailPnlFinalHint')}
        isLoading={insightsFetching}
      />
      {pnlPlatforms.length > 0 ? (
        <ChannelsPnlTable
          metrics={pnlMetrics}
          platforms={pnlPlatforms}
          formatMoney={fmtBase}
          t={t}
          labelForRow={labelForRow}
          cmIncomplete={group.cm_incomplete}
        />
      ) : null}
      <GroupInventoryByChannel group={group} t={t} isFetching={insightsFetching} />
    </div>
  )
}
