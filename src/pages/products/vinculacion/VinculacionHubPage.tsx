import { useMemo, useState } from 'react'
import { AlertTriangle, Pencil, Plus } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { useMoney } from '@/hooks/use-money'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { ProductLinkGroupApi, ProductLinkGroupMemberApi } from '@/lib/types/product-links'
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
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { dateRangePickerStrings } from '@/ui/date-range-picker'
import { EmptyState } from '@/ui/empty-state'
import { Input } from '@/ui/input'
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
import { groupChannelPnlMetrics, groupChannelPlatforms } from './group-channel-pnl-metrics'
import { VinculacionDissolveConfirmDialog } from './vinculacion-dissolve-confirm-dialog'
import { VinculacionGroupAnalytics } from './vinculacion-group-analytics'
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

function GroupMembersStrip({ members, t }: { members: ProductLinkGroupMemberApi[]; t: ShellT }) {
  if (members.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-2 pt-1" aria-label={t('productsColProduct')}>
      {members.map((member) => {
        const label = member.variant_label || member.title
        return (
          <li key={member.product_id}>
            <Link
              to={`/dashboard/products/${member.product_id}`}
              className="inline-flex max-w-[14rem] items-center rounded-md border border-border-subtle bg-muted/40 px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              <span className="min-w-0 truncate font-medium text-text-primary">{label}</span>
            </Link>
          </li>
        )
      })}
    </ul>
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
  const channelCount = uniqueMemberPlatforms(group.members.map((member) => member.platform)).length
  const canAddMember = canEditGroups && group.members.length < MAX_GROUP_MEMBERS
  const channelsMeta = t('productsVinculacionHubChannelsMeta')
    .replace('{channels}', String(channelCount))
    .replace('{listings}', String(group.members.length))

  return (
    <DashboardPage className="flex min-h-full flex-1 flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          {canEditGroups ? (
            <div className="flex min-w-0 items-center gap-2">
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
                className={cn(
                  pageTitleClassName,
                  'h-auto min-w-0 max-w-xl border-transparent px-0 shadow-none',
                )}
                aria-label={group.title}
              />
              <Pencil className="size-4 shrink-0 text-text-tertiary" aria-hidden />
            </div>
          ) : (
            <h1 className={pageTitleClassName}>{group.title}</h1>
          )}
          <p className={settingsDescriptionClassName}>{channelsMeta}</p>
          <GroupMembersStrip members={group.members} t={t} />
        </div>
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
                <section className="flex flex-col gap-3">
                  <SettingsSectionHeader title={t('productsVinculacionDangerTitle')} />
                  <div className={dangerActionCardClassName}>
                    <div className="flex gap-3">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                      <div className="min-w-0 flex-1 space-y-3">
                        <p className="text-sm text-text-secondary">
                          {t('productsVinculacionDangerDescription')}
                        </p>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
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
  const pnlSegments = useMemo(
    () =>
      buildProductPnlWaterfallSegments(
        productPnlWaterfallSourceFromPeriod(
          {
            period_gross_sales: group.period_gross_sales,
            period_net_sales: group.period_net_sales,
            period_cogs: group.period_cogs,
            gross_profit: group.period_gross_profit,
            contribution_margin: group.contribution_margin,
            channel_margin: group.channel_margin,
          },
          group.period_settlement,
        ),
        t,
      ),
    [group, t],
  )

  const platforms = useMemo(() => groupChannelPlatforms(group, t), [group, t])
  const channelMetrics = useMemo(
    () => groupChannelPnlMetrics(group, platforms),
    [group, platforms],
  )

  return (
    <div className="flex flex-col gap-8">
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
        insightsFetching={insightsFetching}
      />
      <ProductDetailWaterfallBlock
        title={t('productsDetailPnlAnalyticsTitle')}
        description={t('productsDetailPnlAnalyticsDescription')}
        segments={pnlSegments}
        currency={baseCurrency}
        grossRevenue={group.period_gross_sales}
        t={t}
        finalBarCaption={t('productsDetailPnlFinalHint')}
        isLoading={insightsFetching}
      />
      {platforms.length > 0 ? (
        <ChannelsPnlTable
          metrics={channelMetrics}
          platforms={platforms}
          formatMoney={fmtBase}
          t={t}
          labelForRow={labelForRow}
          cmIncomplete={group.cm_incomplete}
        />
      ) : null}
      <GroupInventoryByChannel
        group={group}
        t={t}
        isFetching={insightsFetching}
      />
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
