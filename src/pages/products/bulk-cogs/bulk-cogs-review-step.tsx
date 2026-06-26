import type { ShellStringKey } from '@/lib/i18n/shell-strings'

import { countDraftStates } from './bulk-cogs-draft-store'
import type { BulkCogsDraftStore } from './bulk-cogs-draft-store'

type BulkCogsReviewStepProps = {
  draftStore: BulkCogsDraftStore
  backfillCountEstimate: number
  t: (key: ShellStringKey) => string
}

export function BulkCogsReviewStep({ draftStore, backfillCountEstimate, t }: BulkCogsReviewStepProps) {
  const { changed, invalid, unchanged } = countDraftStates(draftStore)
  const multiChunk = changed > 500

  return (
    <div className="space-y-4 rounded-md border border-border-subtle p-4">
      <p className="text-sm text-text-secondary">{t('productsBulkCogsReviewIntro')}</p>
      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-md bg-muted/30 px-3 py-2">
          <dt className="text-text-tertiary">{t('productsBulkCogsReviewChanged')}</dt>
          <dd className="font-numeric text-lg tabular-nums text-text-primary">{changed}</dd>
        </div>
        <div className="rounded-md bg-muted/30 px-3 py-2">
          <dt className="text-text-tertiary">{t('productsBulkCogsReviewInvalid')}</dt>
          <dd className="font-numeric text-lg tabular-nums text-destructive">{invalid}</dd>
        </div>
        <div className="rounded-md bg-muted/30 px-3 py-2">
          <dt className="text-text-tertiary">{t('productsBulkCogsReviewUnchanged')}</dt>
          <dd className="font-numeric text-lg tabular-nums text-text-primary">{unchanged}</dd>
        </div>
      </dl>
      {multiChunk ? (
        <p className="text-sm text-amber-700 dark:text-amber-400">{t('productsBulkCogsReviewChunkWarning')}</p>
      ) : null}
      {backfillCountEstimate > 0 ? (
        <p className="text-sm text-text-secondary">
          {t('productsBulkCogsReviewBackfillWarning').replace('{count}', String(backfillCountEstimate))}
        </p>
      ) : null}
      {invalid > 0 ? (
        <p className="text-sm text-destructive">{t('productsBulkCogsReviewInvalidBlock')}</p>
      ) : null}
    </div>
  )
}
