import { describe, expect, it } from 'vitest'

import type { ShellStringKey } from '@/lib/i18n/shell-strings'
import { shellT } from '@/lib/i18n/shell-strings'

import { inventoryCoverAlertCopy } from './inventory-cover-alert'
import type { ChannelCoverRow } from './vinculacion/group-channel-cover'

function row(overrides: Partial<ChannelCoverRow> = {}): ChannelCoverRow {
  return {
    id: 'amazon',
    platform: 'amazon',
    publicationCount: 1,
    memberStocks: [18],
    stockKnown: true,
    stock: 18,
    velocity: 6.25,
    inventoryDays: 2.9,
    stockoutOn: new Date(2026, 8, 27),
    reorderPoint: null,
    leadTimeMissing: true,
    alert: 'critical',
    isTotal: false,
    ...overrides,
  }
}

const t = (key: ShellStringKey) => shellT('es', key)

describe('inventoryCoverAlertCopy', () => {
  it('describes a critical channel with units, days, and the stockout date', () => {
    expect(inventoryCoverAlertCopy(row(), 'es', t)).toEqual({
      title: 'Inventario crítico en Amazon',
      subtitle: '18 unidades · 2.9 días al ritmo actual · se agota cerca del 27 sep',
      tone: 'critical',
    })
  })

  it('skips a normal channel', () => {
    expect(inventoryCoverAlertCopy(row({ alert: 'normal', inventoryDays: 20 }), 'es', t)).toBeNull()
  })
})
