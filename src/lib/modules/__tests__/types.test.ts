import { describe, expect, it } from 'vitest'

import { isModuleId, parseModuleIds } from '@/lib/modules/types'

describe('module ids', () => {
  it('recognizes workspace configuration modules', () => {
    expect(isModuleId('workspace-config')).toBe(true)
    expect(isModuleId('alarms')).toBe(true)
    expect(parseModuleIds(['workspace-config', 'alarms', 'unknown', 'products'])).toEqual([
      'workspace-config',
      'alarms',
      'products',
    ])
  })
})
