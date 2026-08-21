import { describe, expect, it } from 'vitest'

import { isModuleId, parseModuleIds } from '@/lib/modules/types'
import {
  shouldShowWorkspaceConfigNav,
  visibleWorkspaceConfigSubmodules,
} from '@/lib/modules/workspace-config-submodules'

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

  it('shows alarm config without workspace settings', () => {
    expect(visibleWorkspaceConfigSubmodules(['alarms']).map((s) => s.id)).toEqual(['alarms'])
    expect(shouldShowWorkspaceConfigNav(['alarms'])).toBe(true)
    expect(visibleWorkspaceConfigSubmodules(['workspace-config']).map((s) => s.id)).toEqual([
      'general',
      'pnl-terms',
    ])
  })
})
