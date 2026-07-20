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

  it('recognizes expenses module', () => {
    expect(isModuleId('expenses')).toBe(true)
    expect(parseModuleIds(['expenses', 'channels', 'nope'])).toEqual(['expenses', 'channels'])
  })
})
