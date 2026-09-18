import { describe, expect, it } from 'vitest'

import { clampColumnSizingToContainer } from '@/ui/data-table/statement-table-column-resize'

describe('clampColumnSizingToContainer', () => {
  const columns = [
    { id: 'concept', minSize: 140, size: 280 },
    { id: 'a', minSize: 72, size: 120 },
    { id: 'b', minSize: 72, size: 120 },
  ]

  it('returns original sizing when total fits', () => {
    const sizing = { concept: 200, a: 100, b: 100 }
    expect(clampColumnSizingToContainer(sizing, columns, 500, null)).toBe(sizing)
  })

  it('shrinks the resized column first when overflowing', () => {
    const sizing = { concept: 280, a: 200, b: 120 }
    const next = clampColumnSizingToContainer(sizing, columns, 400, 'a')
    expect(next.a).toBe(72)
    expect(next.b).toBe(72)
    expect(next.concept).toBe(256)
    expect(Object.values(next).reduce((s, n) => s + n, 0)).toBe(400)
  })

  it('uses column defaults when sizing is empty and clamps to container', () => {
    const next = clampColumnSizingToContainer({}, columns, 300, null)
    expect(Object.values(next).reduce((s, n) => s + n, 0)).toBe(300)
    expect(next.concept).toBeGreaterThanOrEqual(140)
    expect(next.a).toBeGreaterThanOrEqual(72)
    expect(next.b).toBeGreaterThanOrEqual(72)
  })
})
