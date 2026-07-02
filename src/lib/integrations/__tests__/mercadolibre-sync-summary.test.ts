import { describe, expect, it } from 'vitest'

import { mercadoLibreSyncSummaryLine } from '@/lib/integrations/mercadolibre-sync-summary'

describe('mercadoLibreSyncSummaryLine', () => {
  it('shows processed orders when re-sync updates existing rows', () => {
    expect(
      mercadoLibreSyncSummaryLine(
        { recordsSynced: 0, recordsTouched: 95, catalogListingsUpserted: 11 },
        'es',
      ),
    ).toBe('95 pedidos procesados · 11 publicaciones actualizadas')
  })

  it('shows new and total counts on first import', () => {
    expect(
      mercadoLibreSyncSummaryLine(
        { recordsSynced: 80, recordsTouched: 95, catalogListingsUpserted: 0 },
        'es',
      ),
    ).toBe('95 pedidos (80 nuevos)')
  })
})
