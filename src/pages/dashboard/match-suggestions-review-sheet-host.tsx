import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useAppBootstrap } from '@/hooks/use-app-bootstrap'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import { can } from '@/lib/permissions/can'
import { useLanguage } from '@/shell/providers/language-provider'
import { VinculacionSuggestionsTable } from '@/pages/products/vinculacion/vinculacion-suggestions-table'
import {
  useAcceptProductLinkSuggestionMutation,
  useProductLinkSuggestionsQuery,
  useRejectProductLinkSuggestionMutation,
} from '@/pages/products/vinculacion/use-product-link-queries'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'

import { useMatchSuggestionsSheet } from './match-suggestions-sheet-context'

export function MatchSuggestionsReviewSheetHost() {
  const { lang } = useLanguage()
  const { me } = useAppBootstrap()
  const { open, setOpen } = useMatchSuggestionsSheet()
  const canEdit = can(me, 'products.groups.edit')
  const suggestionsQuery = useProductLinkSuggestionsQuery({ enabled: open })
  const accept = useAcceptProductLinkSuggestionMutation()
  const reject = useRejectProductLinkSuggestionMutation()
  const [hasEverLoaded, setHasEverLoaded] = useState(false)

  const t = useCallback((key: ShellStringKey) => shellT(lang, key), [lang])

  if (suggestionsQuery.isSuccess && !hasEverLoaded) {
    setHasEverLoaded(true)
  }

  const acceptId = accept.isPending ? (accept.variables ?? null) : null
  const rejectId = reject.isPending ? (reject.variables ?? null) : null
  const busy = acceptId !== null || rejectId !== null
  const items = suggestionsQuery.data?.items ?? []

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="max-w-[min(48rem,100%)]">
        <SheetHeader>
          <SheetTitle>{t('homeMatchSuggestionsSheetTitle')}</SheetTitle>
        </SheetHeader>
        <SheetBody className="min-h-0 flex-1 overflow-y-auto px-0 pb-4">
          <p className="px-4 pb-3 text-sm text-muted-foreground">
            {t('productsVinculacionTabMatchesDescription')}
          </p>
          <VinculacionSuggestionsTable
            items={items}
            t={t}
            canEdit={canEdit}
            isLoading={suggestionsQuery.isLoading}
            isFetching={suggestionsQuery.isFetching}
            hasEverLoaded={hasEverLoaded}
            busy={busy}
            acceptingId={acceptId}
            rejectingId={rejectId}
            onAccept={(suggestionId) => {
              void accept
                .mutateAsync(suggestionId)
                .catch(() => toast.error(t('productsVinculacionLinkFailed')))
            }}
            onReject={(suggestionId) => {
              void reject
                .mutateAsync(suggestionId)
                .catch(() => toast.error(t('productsVinculacionLinkFailed')))
            }}
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
