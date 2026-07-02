import { shellT } from '@/lib/i18n/shell-strings'
import type { Language } from '@/shell/providers/language-provider'

export type MercadoLibreSyncSummaryInput = {
  recordsSynced: number
  recordsTouched: number | null
  catalogListingsUpserted: number
}

export function mercadoLibreSyncSummaryParts(
  input: MercadoLibreSyncSummaryInput,
  lang: Language,
): string[] {
  const touched = input.recordsTouched ?? input.recordsSynced
  const parts: string[] = []

  if (touched > 0) {
    const newCount = input.recordsSynced
    if (newCount > 0 && newCount < touched) {
      parts.push(
        shellT(lang, 'meliSyncSummaryOrdersWithNew', {
          count: touched.toLocaleString(),
          newCount: newCount.toLocaleString(),
        }),
      )
    } else if (newCount === 0) {
      parts.push(
        shellT(lang, 'meliSyncSummaryOrdersProcessed', {
          count: touched.toLocaleString(),
        }),
      )
    } else {
      parts.push(`${touched.toLocaleString()} ${shellT(lang, 'reportsOrders')}`)
    }
  } else {
    parts.push(shellT(lang, 'syncNoNewOrdersHelper'))
  }

  if (input.catalogListingsUpserted > 0) {
    parts.push(
      shellT(lang, 'meliSyncSummaryListingsUpdated', {
        count: input.catalogListingsUpserted.toLocaleString(),
      }),
    )
  }

  return parts
}

export function mercadoLibreSyncSummaryLine(
  input: MercadoLibreSyncSummaryInput,
  lang: Language,
): string {
  return mercadoLibreSyncSummaryParts(input, lang).join(' · ')
}
