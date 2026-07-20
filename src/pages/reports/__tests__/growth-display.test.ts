import { describe, expect, it } from 'vitest'

import {
  classifyGrowthDisplay,
  formatGrowthPctDisplay,
  formatGrowthSegmentDisplay,
} from '@/pages/reports/reports-ui-helpers'

describe('classifyGrowthDisplay', () => {
  it('returns loading when not ready', () => {
    expect(classifyGrowthDisplay(false, null)).toBe('loading')
    expect(classifyGrowthDisplay(false, 12.5)).toBe('loading')
  })

  it('returns value when ready with a pct', () => {
    expect(classifyGrowthDisplay(true, 0)).toBe('value')
    expect(classifyGrowthDisplay(true, -3.2)).toBe('value')
  })

  it('returns no_baseline when ready and pct is null', () => {
    expect(classifyGrowthDisplay(true, null)).toBe('no_baseline')
  })
})

describe('formatGrowthPctDisplay', () => {
  it('formats loading, value, and no baseline', () => {
    expect(formatGrowthPctDisplay(false, null, 'Sin base')).toBe('—')
    expect(formatGrowthPctDisplay(true, 12.34, 'Sin base')).toBe('12.3%')
    expect(formatGrowthPctDisplay(true, null, 'Sin base')).toBe('Sin base')
  })
})

describe('formatGrowthSegmentDisplay', () => {
  it('formats MoM/YoY segments', () => {
    expect(formatGrowthSegmentDisplay('MoM', false, null, 'Sin base')).toBe('MoM —')
    expect(formatGrowthSegmentDisplay('MoM', true, 5.1, 'Sin base')).toBe('MoM 5.1%')
    expect(formatGrowthSegmentDisplay('YoY', true, null, 'Sin base')).toBe('YoY Sin base')
  })
})
