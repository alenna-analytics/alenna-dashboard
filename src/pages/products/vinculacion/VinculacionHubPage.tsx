import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@clerk/react'

import { useCurrentTenant } from '@/auth/hooks'
import { useMoney } from '@/hooks/use-money'
import { shellT } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import { DashboardPage, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { Button } from '@/ui/button'
import { EmptyState } from '@/ui/empty-state'
import { Input } from '@/ui/input'
import { kpiCardGridClassName, KpiCard } from '@/ui/kpi-card'
import { Skeleton } from '@/ui/skeleton'
import { surfaceKpiClassName } from '@/ui/surface'

import { ProductPlatformLogoName } from '../product-platform-logo-name'
import { ProductTableThumb } from '../product-table-thumb'
import { defaultProductInsightRange } from '../product-detail-range'
import {
  deleteProductLinkGroup,
  deleteProductLinkMember,
  usePatchProductLinkGroupMutation,
  useProductLinkGroupQuery,
} from './use-product-link-queries'

export function VinculacionHubPage() {
  const { groupId } = useParams<{ groupId: string }>()
  if (!groupId) {
    return <div className="p-8 text-sm text-text-secondary">Invalid group.</div>
  }
  return <VinculacionHubBody key={groupId} groupId={groupId} />
}

function VinculacionHubSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-[26px] w-28 rounded-md" />
      </div>
      <div className={kpiCardGridClassName}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={surfaceKpiClassName}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-md border border-border-subtle">
        <div className="space-y-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 border-t border-border-subtle px-3 py-3 first:border-t-0"
            >
              <Skeleton className="size-10 shrink-0 rounded-md" />
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function VinculacionHubBody({ groupId }: { groupId: string }) {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const { tenantId } = useCurrentTenant()
  const { getToken } = useAuth()
  const t = (key: Parameters<typeof shellT>[1]) => shellT(lang, key)
  const canEdit = can(me, 'products.edit')
  const range = defaultProductInsightRange()
  const groupQuery = useProductLinkGroupQuery(groupId, range.start, range.end)
  const patch = usePatchProductLinkGroupMutation(groupId)
  const group = groupQuery.data
  const { format: formatMoney } = useMoney()
  const [titleDraft, setTitleDraft] = useState<string | null>(null)

  if (groupQuery.isLoading) {
    return (
      <DashboardPage className="flex flex-1 flex-col gap-6">
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

  return (
    <DashboardPage className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
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
              className="max-w-xl text-lg font-semibold"
            />
          ) : (
            <h1 className={pageTitleClassName}>{group.title}</h1>
          )}
        </div>
        {canEdit ? (
          <Button
            type="button"
            variant="outline"
            size="tiny"
            onClick={() => {
              void deleteProductLinkGroup(getToken, tenantId, groupId)
                .then(() => {
                  void navigate('/dashboard/products/vinculacion')
                })
                .catch(() => toast.error(t('productsVinculacionLinkFailed')))
            }}
          >
            {t('productsVinculacionDissolve')}
          </Button>
        ) : null}
      </header>

      <section className={kpiCardGridClassName}>
        <KpiCard
          label={t('productsVinculacionKpiUnits')}
          value={String(group.period_net_units_sold)}
          showComparison={false}
        />
        <KpiCard
          label={t('productsVinculacionKpiGross')}
          value={formatMoney(group.period_gross_sales)}
          showComparison={false}
        />
        <KpiCard
          label={t('productsVinculacionKpiNet')}
          value={formatMoney(group.period_net_sales)}
          showComparison={false}
        />
        <KpiCard
          label={t('productsVinculacionKpiOrders')}
          value={String(group.period_orders)}
          showComparison={false}
        />
      </section>

      <section className="overflow-x-auto rounded-md border border-border-subtle">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-text-secondary">
            <tr>
              <th className="px-3 py-2 font-medium">{t('productsColProduct')}</th>
              <th className="px-3 py-2 font-medium">{t('productsColChannels')}</th>
              <th className="px-3 py-2 font-medium">{t('productsColCost')}</th>
              <th className="px-3 py-2 font-medium">{t('productsDetailListingColStock')}</th>
              <th className="px-3 py-2 font-medium">{t('productsVinculacionColPrice')}</th>
              {canEdit ? <th className="px-3 py-2" /> : null}
            </tr>
          </thead>
          <tbody>
            {group.members.map((member) => (
              <tr key={member.product_id} className="border-t border-border-subtle">
                <td className="px-3 py-2">
                  <Link
                    to={`/dashboard/products/${member.product_id}`}
                    className="flex items-center gap-2"
                  >
                    <ProductTableThumb url={member.image_url} alt={member.title} />
                    <span className="truncate">{member.variant_label || member.title}</span>
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <ProductPlatformLogoName platformSlug={member.platform} t={t} />
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {member.cost != null ? formatMoney(member.cost) : '—'}
                </td>
                <td className="px-3 py-2 tabular-nums">{member.stock_quantity ?? '—'}</td>
                <td className="px-3 py-2 tabular-nums">
                  {member.platform_price != null ? formatMoney(Number(member.platform_price)) : '—'}
                </td>
                {canEdit ? (
                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="tiny"
                      onClick={() => {
                        void deleteProductLinkMember(getToken, tenantId, groupId, member.product_id)
                          .then(() => {
                            if (group.members.length <= 2) {
                              void navigate('/dashboard/products/vinculacion')
                              return
                            }
                            void groupQuery.refetch()
                          })
                          .catch(() => toast.error(t('productsVinculacionLinkFailed')))
                      }}
                    >
                      {t('productsVinculacionRemoveMember')}
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardPage>
  )
}
