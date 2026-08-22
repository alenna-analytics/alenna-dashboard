import { describe, expect, it } from 'vitest'

import {
  assignedPermissionSummary,
  permissionHierarchy,
  toggleGroupView,
  PERMISSION_GROUPS,
  visiblePermissionGroups,
} from '@/lib/permissions/permission-groups'
import { shouldShowCustomRolesUpgrade } from '@/pages/team/team-roles-paywall'

describe('permission-groups overlay preview', () => {
  it('has a team group for the Basic paywall preview', () => {
    expect(PERMISSION_GROUPS.some((g) => g.id === 'team')).toBe(true)
    const team = PERMISSION_GROUPS.find((g) => g.id === 'team')!
    expect(toggleGroupView([], team, true)).toEqual(['team.view'])
  })

  it('shows Growth overlay for Owner without custom roles', () => {
    expect(shouldShowCustomRolesUpgrade(true, false)).toBe(true)
    expect(shouldShowCustomRolesUpgrade(true, true)).toBe(false)
    expect(shouldShowCustomRolesUpgrade(false, false)).toBe(false)
  })

  it('hides coming-soon modules and keeps Equipo', () => {
    const groups = visiblePermissionGroups(['products', 'ads', 'simulations', 'alarms'])
    const ids = groups.map((g) => g.id)
    expect(ids).toContain('products')
    expect(ids).toContain('ads')
    expect(ids).toContain('alerts')
    expect(ids).toContain('team')
    expect(ids).toContain('billing')
    expect(ids).not.toContain('simulations')
    expect(ids).not.toContain('expenses')
  })

  it('keeps ads as its own group without FX under settings', () => {
    const ads = PERMISSION_GROUPS.find((g) => g.id === 'ads')!
    const config = PERMISSION_GROUPS.find((g) => g.id === 'workspace_config')!
    const alerts = PERMISSION_GROUPS.find((g) => g.id === 'alerts')!
    expect(ads.viewKey).toBe('ads.view')
    expect(ads.titleKey).toBe('permGroupAds')
    expect(config.actionKeys).toEqual(['pnl_labels.view', 'pnl_labels.manage'])
    expect(alerts.viewKey).toBe('alerts.view')
    expect(alerts.actionKeys).toEqual(['alerts.manage'])
  })

  it('summarizes assigned view and actions for confirmation', () => {
    const products = PERMISSION_GROUPS.find((g) => g.id === 'products')!
    const expenses = PERMISSION_GROUPS.find((g) => g.id === 'expenses')!
    const summary = assignedPermissionSummary(
      ['products.view', 'products.edit', 'expenses.view'],
      [products, expenses],
    )
    expect(summary).toHaveLength(2)
    expect(summary[0]?.titleKey).toBe('permGroupProducts')
    expect(summary[0]?.actionLabels).toEqual(['permProductsEdit'])
    expect(summary[1]?.actionLabels).toEqual(['permExpensesView'])
  })

  it('keeps view as the first node in the permission hierarchy', () => {
    const products = PERMISSION_GROUPS.find((g) => g.id === 'products')!
    const expenses = PERMISSION_GROUPS.find((g) => g.id === 'expenses')!
    const tree = permissionHierarchy(
      ['products.view', 'products.edit', 'expenses.view'],
      [products, expenses],
    )
    expect(tree).toHaveLength(2)
    expect(tree[0]?.granted).toBe(true)
    expect(tree[0]?.actions).toEqual([
      { labelKey: 'permProductsView', granted: true },
      { labelKey: 'permProductsEdit', granted: true },
    ])
    expect(tree[1]?.granted).toBe(true)
    expect(tree[1]?.actions[0]).toEqual({ labelKey: 'permExpensesView', granted: true })
    expect(tree[1]?.actions.filter((action) => action.granted).map((action) => action.labelKey)).toEqual([
      'permExpensesView',
    ])
  })
})
