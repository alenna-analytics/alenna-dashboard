import { describe, expect, it } from 'vitest'

import { isTableEmptyText, TABLE_EMPTY_CELL, tableTextOrEmpty } from '../table-empty-cell'

describe('tableTextOrEmpty', () => {
  it('normalizes blank and dash-only values to the shared empty mark', () => {
    expect(tableTextOrEmpty(null)).toBe(TABLE_EMPTY_CELL)
    expect(tableTextOrEmpty('')).toBe(TABLE_EMPTY_CELL)
    expect(tableTextOrEmpty('  -  ')).toBe(TABLE_EMPTY_CELL)
    expect(tableTextOrEmpty('—')).toBe(TABLE_EMPTY_CELL)
    expect(isTableEmptyText('SKU-1')).toBe(false)
    expect(tableTextOrEmpty('  SKU-1  ')).toBe('SKU-1')
  })
})
