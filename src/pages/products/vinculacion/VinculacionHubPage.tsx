import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle, ImageIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'

import { useCurrentTenant } from '@/auth/hooks'
import { useMoney } from '@/hooks/use-money'
import { INTEGRATION_UI } from '@/lib/integrations/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import { usePnlAwareT } from '@/pages/configuration/pnl-terms/use-pnl-labels-queries'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/card'
import { ChannelBadge } from '@/ui/channel-badge'
import { dateRangePickerStrings } from '@/ui/date-range-picker'
import { EmptyState } from '@/ui/empty-state'
import { Input } from '@/ui/input'
import { kpiCardGridClassName } from '@/ui/kpi-card'
import { Skeleton } from '@/ui/skeleton'
import { surfaceKpiClassName } from '@/ui/surface'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import { cn } from '@/lib/utils'

import { PRODUCTS_LINKING_PATH } from '../products-inner-nav'
import { productPlatformLabel } from '../product-platform-label'
import { defaultProductInsightRange } from '../product-detail-range'
import { VinculacionGroupAnalytics } from './vinculacion-group-analytics'
import { VinculacionGroupMembersTable } from './vinculacion-group-members-table'
import {
  deleteProductLinkMember,
  productLinkGroupsQueryKey,
  useDissolveProductLinkGroupMutation,
  usePatchProductLinkGroupMutation,
  useProductLinkGroupQuery,
} from './use-product-link-queries'

type ShellT = (key: ShellStringKey) => string

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
      <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:gap-6">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-8 w-64 max-w-full" />
            <div className="flex gap-1.5">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="size-20 shrink-0 rounded-md sm:size-[150px]" />
        </div>
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

function GroupHeaderThumb({ url, title }: { url: string | null; title: string }) {
  const [broken, setBroken] = useState(!url)
  const thumbClass =
    'size-20 shrink-0 rounded-md border border-border-subtle object-cover sm:size-[150px]'
  if (!url || broken) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted/50 text-text-tertiary',
          thumbClass,
        )}
        aria-hidden
      >
        <ImageIcon className="size-8 opacity-70 sm:size-10" />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={title}
      className={thumbClass}
      width={150}
      height={150}
      sizes="(max-width: 640px) 80px, 150px"
      loading="eager"
      onError={() => setBroken(true)}
    />
  )
}

function VinculacionHubBody({ groupId }: { groupId: string }) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const { tenantId } = useCurrentTenant()
  const { getToken } = useAuth()
  const qc = useQueryClient()
  const t = usePnlAwareT()
  const canEdit = can(me, 'products.edit')
  const defaultInsight = useMemo(() => defaultProductInsightRange(), [])
  const [insightStart, setInsightStart] = useState(defaultInsight.start)
  const [insightEnd, setInsightEnd] = useState(defaultInsight.end)
  const groupQuery = useProductLinkGroupQuery(groupId, insightStart, insightEnd)
  const patch = usePatchProductLinkGroupMutation(groupId)
  const dissolve = useDissolveProductLinkGroupMutation()
  const group = groupQuery.data
  const baseCurrency = group?.base_currency ?? 'MXN'
  const { format: formatMoney, formatKpi } = useMoney()
  const fmtBase = (value: number) => formatMoney(value, { nativeCurrency: baseCurrency })
  const fmtCard = (value: number) => formatKpi(value, { nativeCurrency: baseCurrency })
  const [titleDraft, setTitleDraft] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const pickerStrings = useMemo(() => dateRangePickerStrings(t), [t])

  const handleRemoveMember = useCallback(
    (productId: string) => {
      if (!group) return
      setRemovingId(productId)
      void deleteProductLinkMember(getToken, tenantId, groupId, productId)
        .then(() => {
          void qc.invalidateQueries({ queryKey: productLinkGroupsQueryKey(tenantId) })
          if (group.members.length <= 2) {
            void navigate(PRODUCTS_LINKING_PATH)
            return
          }
          void groupQuery.refetch()
        })
        .catch(() => toast.error(t('productsVinculacionLinkFailed')))
        .finally(() => setRemovingId(null))
    },
    [getToken, group, groupId, groupQuery, navigate, qc, t, tenantId],
  )

  if (groupQuery.isLoading) {
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
  const thumbMember = group.members[0]
  const platforms = uniqueMemberPlatforms(group.members.map((member) => member.platform))

  return (
    <DashboardPage className="flex min-h-full flex-1 flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:gap-6">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-1 sm:gap-0 sm:space-y-3">
            <div className="shrink-0 sm:hidden">
              <GroupHeaderThumb url={thumbMember?.image_url ?? null} title={group.title} />
            </div>
            <div className="min-w-0 space-y-3">
              {canEdit ? (
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
                  className={cn(pageTitleClassName, 'h-auto max-w-xl border-transparent px-0 shadow-none')}
                />
              ) : (
                <h1 className={pageTitleClassName}>{group.title}</h1>
              )}
              {platforms.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {platforms.map((platform) => {
                    const slug = platform.trim().toLowerCase()
                    const ui = slug ? INTEGRATION_UI[slug] : undefined
                    return (
                      <ChannelBadge key={platform} logoSrc={ui?.logoSrc}>
                        {productPlatformLabel(platform, t)}
                      </ChannelBadge>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </div>
          <div className="hidden shrink-0 sm:block">
            <GroupHeaderThumb url={thumbMember?.image_url ?? null} title={group.title} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList variant="line">
          <TabsTrigger value="analytics">{t('productsDetailTabAnalytics')}</TabsTrigger>
          <TabsTrigger value="channels">{t('productsDetailTabChannels')}</TabsTrigger>
        </TabsList>
        <div className="relative mt-6 grid w-full grid-cols-1 overflow-hidden">
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
          <TabsContent value="channels">
            <Card className="rounded-none border-none p-0 shadow-none hover:shadow-none">
              <CardHeader className="p-0">
                <CardDescription className="text-xs">
                  {t('productsVinculacionMembersDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <VinculacionGroupMembersTable
                  members={group.members}
                  t={t}
                  canEdit={canEdit}
                  fmtMoney={fmtBase}
                  isFetching={groupQuery.isFetching}
                  removingId={removingId}
                  onRemove={handleRemoveMember}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {canEdit ? (
        <VinculacionDangerZone
          t={t}
          loading={dissolve.isPending}
          onDissolve={() => {
            void dissolve
              .mutateAsync(groupId)
              .then(() => {
                void navigate(PRODUCTS_LINKING_PATH)
              })
              .catch(() => toast.error(t('productsVinculacionLinkFailed')))
          }}
        />
      ) : null}
    </DashboardPage>
  )
}

function VinculacionDangerZone({
  t,
  loading,
  onDissolve,
}: {
  t: ShellT
  loading: boolean
  onDissolve: () => void
}) {
  return (
    <section className="mt-4 space-y-6 border-t border-border-subtle pt-8">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.01em] text-text-primary">
          {t('productsVinculacionDangerTitle')}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">{t('productsVinculacionDangerDescription')}</p>
      </div>
      <div className="rounded-lg border border-border-card bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--status-red-500)] text-white"
            aria-hidden
          >
            <AlertTriangle className="size-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm font-semibold text-text-primary">{t('productsVinculacionDissolve')}</p>
            <Button type="button" variant="destructive" size="tiny" loading={loading} onClick={onDissolve}>
              {t('productsVinculacionDissolve')}
            </Button>
          </div>
        </div>
      </div>
    </section>
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
