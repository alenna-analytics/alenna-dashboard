import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import type { BulkCogsDraftStore } from '@/pages/products/bulk-cogs/bulk-cogs-draft-store'

import { countLoadReviewStates } from './cogs-load-review-utils'

type CogsLoadReviewStepProps = {
  draftStore: BulkCogsDraftStore
  backfillCountEstimate: number
  t: (key: ShellStringKey) => string
}

export function CogsLoadReviewStep({ draftStore, backfillCountEstimate, t }: CogsLoadReviewStepProps) {
  const { total, ready, invalid, empty } = countLoadReviewStates(draftStore)

  return (
    <div className="space-y-4 rounded-md border border-border-subtle p-4">
      <p className="text-sm text-text-secondary">{t('productsCogsLoadReviewIntro')}</p>
      <dl className="grid gap-2 text-sm sm:grid-cols-4">
        <div className="rounded-md bg-muted/30 px-3 py-2">
          <dt className="text-text-tertiary">{t('productsCogsLoadReviewTotal')}</dt>
          <dd className="font-numeric text-lg tabular-nums text-text-primary">{total}</dd>
        </div>
        <div className="rounded-md bg-muted/30 px-3 py-2">
          <dt className="text-text-tertiary">{t('productsCogsLoadReviewReady')}</dt>
          <dd className="font-numeric text-lg tabular-nums text-text-primary">{ready}</dd>
        </div>
        <div className="rounded-md bg-muted/30 px-3 py-2">
          <dt className="text-text-tertiary">{t('productsBulkCogsReviewInvalid')}</dt>
          <dd className="font-numeric text-lg tabular-nums text-destructive">{invalid}</dd>
        </div>
        <div className="rounded-md bg-muted/30 px-3 py-2">
          <dt className="text-text-tertiary">{t('productsCogsLoadReviewEmpty')}</dt>
          <dd className="font-numeric text-lg tabular-nums text-text-secondary">{empty}</dd>
        </div>
      </dl>
      {backfillCountEstimate > 0 ? (
        <p className="text-sm text-text-secondary">
          {t('productsBulkCogsReviewBackfillWarning').replace('{count}', String(backfillCountEstimate))}
        </p>
      ) : null}
      {invalid > 0 ? (
        <p className="text-sm text-destructive">{t('productsBulkCogsReviewInvalidBlock')}</p>
      ) : null}
      {ready === 0 ? (
        <p className="text-sm text-destructive">{t('productsCogsLoadReviewNoReady')}</p>
      ) : null}
    </div>
  )
}
