import { useState } from 'react'
import { toast } from 'sonner'

import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import { DashboardPage, pageSubtitleClassName, pageTitleClassName } from '@/shell/layout/dashboard-page'
import { useLanguage } from '@/shell/providers/language-provider'
import { useWorkspace } from '@/shell/providers/workspace-context'
import { AppIcon } from '@/ui/app-icon'
import { Button } from '@/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'

import { VinculacionDissolveConfirmDialog } from './vinculacion-dissolve-confirm-dialog'
import { VinculacionLinkedGroupsTable } from './vinculacion-linked-groups-table'
import { VinculacionPickerSheet } from './VinculacionPickerSheet'
import { VinculacionSuggestionsTable } from './vinculacion-suggestions-table'
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

function isVinculacionTabId(value: string | number | null): value is VinculacionTabId {
  return value === 'matches' || value === 'linked'
}

export function VinculacionInboxPage() {
  const { lang } = useLanguage()
  const { me } = useWorkspace()
  const t: ShellT = (key) => shellT(lang, key)
  const canEdit = can(me, 'products.groups.edit')
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
  const [unlinkGroupId, setUnlinkGroupId] = useState<string | null>(null)
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
            <VinculacionSuggestionsTable
              items={items}
              t={t}
              canEdit={canEdit}
              isLoading={suggestionsQuery.isLoading && page === undefined}
              isFetching={suggestionsQuery.isFetching}
              hasEverLoaded={page !== undefined}
              busy={busy}
              acceptingId={acceptId}
              rejectingId={rejectId}
              onAccept={(suggestionId) => {
                void accept
                  .mutateAsync(suggestionId)
                  .then(() => setTab('linked'))
                  .catch(() => toast.error(t('productsVinculacionLinkFailed')))
              }}
              onReject={(suggestionId) => {
                void reject
                  .mutateAsync(suggestionId)
                  .catch(() => toast.error(t('productsVinculacionLinkFailed')))
              }}
            />
          </TabsContent>

          <TabsContent value="linked">
            <VinculacionLinkedGroupsTable
              groups={groups}
              t={t}
              canEdit={canEdit}
              isLoading={groupsQuery.isLoading}
              isFetching={groupsQuery.isFetching}
              hasEverLoaded={groupsQuery.data !== undefined}
              unlinkingId={dissolve.isPending ? (dissolve.variables ?? unlinkGroupId) : unlinkGroupId}
              onUnlink={(groupId) => {
                setUnlinkGroupId(groupId)
              }}
            />
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
      <VinculacionDissolveConfirmDialog
        open={unlinkGroupId !== null}
        onOpenChange={(open) => {
          if (!open) setUnlinkGroupId(null)
        }}
        pending={dissolve.isPending}
        t={t}
        onConfirm={() => {
          if (!unlinkGroupId) return
          void dissolve
            .mutateAsync(unlinkGroupId)
            .then(() => setUnlinkGroupId(null))
            .catch(() => toast.error(t('productsVinculacionUnlinkFailed')))
        }}
      />
    </DashboardPage>
  )
}

