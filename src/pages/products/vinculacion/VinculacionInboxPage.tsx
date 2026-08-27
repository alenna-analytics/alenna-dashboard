import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { productsLinkingGroupPath } from '@/pages/products/products-inner-nav'
import { can } from '@/lib/permissions/can'
import type {
  ProductLinkGroupApi,
  ProductLinkGroupMemberApi,
  ProductLinkSuggestionApi,
} from '@/lib/types/product-links'
import { DashboardPage, pageSubtitleClassName, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { AppIcon } from '@/ui/app-icon'
import { Button } from '@/ui/button'
import { Card, CardContent } from '@/ui/card'
import { EmptyState } from '@/ui/empty-state'
import { Skeleton } from '@/ui/skeleton'
import { StatusPill } from '@/ui/status-pill'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'

import { ProductPlatformLogoName } from '../product-platform-logo-name'
import { ProductTableThumb } from '../product-table-thumb'
import { VinculacionPickerSheet } from './VinculacionPickerSheet'
import {
  useAcceptProductLinkSuggestionMutation,
  useDissolveProductLinkGroupMutation,
  useProductLinkGroupsQuery,
  useProductLinkRefreshOnEnter,
  useProductLinkSuggestionsQuery,
  useRejectProductLinkSuggestionMutation,
} from './use-product-link-queries'

type VinculacionTabId = 'matches' | 'linked'
type ShellT = (key: ShellStringKey) => string

type VinculacionProductPeek = {
  product_id: string
  title: string
  platform: string
  image_url: string | null
}

type SuggestionCardProps = {
  item: ProductLinkSuggestionApi
  t: ShellT
  canEdit: boolean
  busy: boolean
  accepting: boolean
  rejecting: boolean
  onAccept: () => void
  onReject: () => void
}

type LinkedGroupsTableProps = {
  groups: ProductLinkGroupApi[]
  t: ShellT
  canEdit: boolean
  unlinkingId: string | null
  onUnlink: (groupId: string) => void
}

function isVinculacionTabId(value: string | number | null): value is VinculacionTabId {
  return value === 'matches' || value === 'linked'
}

function VinculacionInboxSkeleton({ label }: { label: string }) {
  return (
    <ul className="flex flex-col gap-3" role="status" aria-label={label}>
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={index}>
          <Card size="sm" variant="solid">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <SuggestionProductSkeleton />
                <span className="hidden text-text-tertiary sm:inline">↔</span>
                <SuggestionProductSkeleton />
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <Skeleton className="h-5 w-28 rounded-full" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-[26px] w-16 rounded-md" />
                  <Skeleton className="h-[26px] w-16 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}

function LinkedGroupsSkeleton({ label }: { label: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border-subtle" role="status" aria-label={label}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-t border-border-subtle px-3 py-3 first:border-t-0"
        >
          <Skeleton className="size-10 shrink-0 rounded-md" />
          <Skeleton className="h-4 w-40 max-w-full" />
          <Skeleton className="ml-auto h-[26px] w-20 rounded-md" />
        </div>
      ))}
    </div>
  )
}

function SuggestionProductSkeleton() {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Skeleton className="size-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40 max-w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function VinculacionInboxPage() {
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const t: ShellT = (key) => shellT(lang, key)
  const canEdit = can(me, 'products.edit')
  const suggestionsQuery = useProductLinkSuggestionsQuery()
  const groupsQuery = useProductLinkGroupsQuery()
  const page = suggestionsQuery.data
  const { searching, refresh } = useProductLinkRefreshOnEnter(
    page?.stale,
    page?.current_job_id ?? null,
    t,
  )
  const accept = useAcceptProductLinkSuggestionMutation()
  const reject = useRejectProductLinkSuggestionMutation()
  const dissolve = useDissolveProductLinkGroupMutation()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [tab, setTab] = useState<VinculacionTabId>('matches')

  const items = page?.items ?? []
  const groups = groupsQuery.data?.items ?? []
  const acceptId = accept.isPending ? (accept.variables ?? null) : null
  const rejectId = reject.isPending ? (reject.variables ?? null) : null
  const busy = acceptId !== null || rejectId !== null
  const matchesCount = suggestionsQuery.isSuccess ? items.length : null
  const linkedCount = groupsQuery.isSuccess ? groups.length : null

  return (
    <DashboardPage className="flex flex-1 flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className={pageTitleClassName}>{t('productsNavVinculacion')}</h1>
          <p className={pageSubtitleClassName}>{t('productsVinculacionSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="tiny"
            loading={searching}
            icon={<AppIcon name="ai" colorize />}
            onClick={() => {
              void refresh.mutateAsync('button').catch(() => {
                toast.error(t('productsVinculacionSearchFailed'))
              })
            }}
          >
            {searching
              ? t('productsVinculacionSearching')
              : t('productsVinculacionSearchButton')}
          </Button>
          {canEdit ? (
            <Button
              type="button"
              variant="accent"
              size="tiny"
              icon={<AppIcon name="channels" colorize />}
              onClick={() => setPickerOpen(true)}
            >
              {t('productsVinculacionLinkManual')}
            </Button>
          ) : null}
        </div>
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (isVinculacionTabId(value)) setTab(value)
        }}
      >
        <TabsList variant="line">
          <TabsTrigger value="matches">
            {t('productsVinculacionTabMatches')}
            {matchesCount != null ? ` (${matchesCount})` : ''}
          </TabsTrigger>
          <TabsTrigger value="linked">
            {t('productsVinculacionTabLinked')}
            {linkedCount != null ? ` (${linkedCount})` : ''}
          </TabsTrigger>
        </TabsList>

        <div className="relative mt-6 grid w-full grid-cols-1 overflow-hidden">
          <TabsContent value="matches">
            {suggestionsQuery.isLoading && page === undefined ? (
              <VinculacionInboxSkeleton label={t('productsVinculacionLoading')} />
            ) : items.length === 0 ? (
              <EmptyState
                icon="products"
                title={t('productsVinculacionEmptyTitle')}
                description={t('productsVinculacionEmptyDescription')}
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li key={item.id}>
                    <SuggestionCard
                      item={item}
                      t={t}
                      canEdit={canEdit}
                      busy={busy}
                      accepting={acceptId === item.id}
                      rejecting={rejectId === item.id}
                      onAccept={() => {
                        void accept
                          .mutateAsync(item.id)
                          .then(() => setTab('linked'))
                          .catch(() => toast.error(t('productsVinculacionLinkFailed')))
                      }}
                      onReject={() => {
                        void reject
                          .mutateAsync(item.id)
                          .catch(() => toast.error(t('productsVinculacionLinkFailed')))
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="linked">
            {groupsQuery.isLoading && groupsQuery.data === undefined ? (
              <LinkedGroupsSkeleton label={t('productsVinculacionLoading')} />
            ) : groups.length === 0 ? (
              <EmptyState
                icon="products"
                title={t('productsVinculacionLinkedEmptyTitle')}
                description={t('productsVinculacionLinkedEmptyDescription')}
              />
            ) : (
              <LinkedGroupsTable
                groups={groups}
                t={t}
                canEdit={canEdit}
                unlinkingId={dissolve.isPending ? (dissolve.variables ?? null) : null}
                onUnlink={(groupId) => {
                  void dissolve
                    .mutateAsync(groupId)
                    .catch(() => toast.error(t('productsVinculacionUnlinkFailed')))
                }}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>

      <VinculacionPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        t={t}
        onCreated={() => {
          setPickerOpen(false)
          setTab('linked')
        }}
      />
    </DashboardPage>
  )
}

function SuggestionCard({
  item,
  t,
  canEdit,
  busy,
  accepting,
  rejecting,
  onAccept,
  onReject,
}: SuggestionCardProps) {
  const kindLabel =
    item.kind === 'sku' ? t('productsVinculacionKindSku') : t('productsVinculacionKindName')
  return (
    <Card size="sm" variant="solid">
      <CardContent className="flex flex-col gap-3 py-4">
        <StatusPill variant="neutral">{kindLabel}</StatusPill>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <SuggestionProduct product={item.product_a} t={t} />
            <span className="hidden text-text-tertiary sm:inline">↔</span>
            <SuggestionProduct product={item.product_b} t={t} />
          </div>
          {canEdit ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="tiny"
                loading={rejecting}
                disabled={busy && !rejecting}
                onClick={onReject}
              >
                {t('productsVinculacionReject')}
              </Button>
              <Button
                type="button"
                variant="default"
                size="tiny"
                loading={accepting}
                disabled={busy && !accepting}
                onClick={onAccept}
              >
                {t('productsVinculacionAccept')}
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function LinkedGroupsTable({
  groups,
  t,
  canEdit,
  unlinkingId,
  onUnlink,
}: LinkedGroupsTableProps) {
  return (
    <div className="rounded-md border border-border-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('productsColProduct')}</TableHead>
            {canEdit ? <TableHead className="w-[1%] text-right" /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => {
            const unlinking = unlinkingId === group.id
            return (
              <TableRow key={group.id}>
                <TableCell className="whitespace-normal">
                  <div className="flex min-w-0 flex-col gap-3 py-1 sm:flex-row sm:items-center">
                    {group.members.map((member, index) => (
                      <div key={member.product_id} className="flex min-w-0 items-center gap-3">
                        {index > 0 ? (
                          <span className="hidden text-text-tertiary sm:inline">↔</span>
                        ) : null}
                        <LinkedMember product={member} t={t} />
                      </div>
                    ))}
                  </div>
                </TableCell>
                {canEdit ? (
                  <TableCell className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="tiny"
                        render={<Link to={productsLinkingGroupPath(group.id)} />}
                      >
                        {t('productsVinculacionViewGroup')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="tiny"
                        loading={unlinking}
                        disabled={unlinkingId !== null && !unlinking}
                        onClick={() => onUnlink(group.id)}
                      >
                        {t('productsVinculacionUnlink')}
                      </Button>
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function SuggestionProduct({
  product,
  t,
}: {
  product: VinculacionProductPeek
  t: ShellT
}) {
  const slug = product.platform.trim().toLowerCase()
  return (
    <Link
      to={`/dashboard/products/${product.product_id}`}
      className="flex min-w-0 flex-1 items-center gap-2"
    >
      <ProductTableThumb url={product.image_url} alt={product.title} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{product.title}</p>
        <ProductPlatformLogoName platformSlug={slug} t={t} className="mt-1" />
      </div>
    </Link>
  )
}

function LinkedMember({
  product,
  t,
}: {
  product: ProductLinkGroupMemberApi
  t: ShellT
}) {
  const slug = product.platform.trim().toLowerCase()
  const label = product.variant_label || product.title
  return (
    <Link
      to={`/dashboard/products/${product.product_id}`}
      className="flex min-w-0 items-center gap-2"
    >
      <ProductTableThumb url={product.image_url} alt={label} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-primary">{label}</p>
        <ProductPlatformLogoName platformSlug={slug} t={t} className="mt-1" />
      </div>
    </Link>
  )
}
