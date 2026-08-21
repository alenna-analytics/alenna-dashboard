import type { MeResponse } from '@/lib/types/me-types'
import type { ModuleId } from '@/lib/modules/types'

export type AssignablePermissionKey =
  | 'ads.view'
  | 'alerts.manage'
  | 'alerts.view'
  | 'channels.view'
  | 'expenses.create'
  | 'expenses.delete'
  | 'expenses.edit'
  | 'expenses.view'
  | 'fx.manage'
  | 'fx.view'
  | 'integrations.manage'
  | 'integrations.view'
  | 'pnl_labels.manage'
  | 'pnl_labels.view'
  | 'products.edit'
  | 'products.view'
  | 'reports.view'
  | 'sales.view'
  | 'simulations.view'
  | 'team.manage'
  | 'team.view'
  | 'workspace_config.view'

export const ASSIGNABLE_PERMISSION_KEYS: readonly AssignablePermissionKey[] = [
  'ads.view',
  'alerts.manage',
  'alerts.view',
  'channels.view',
  'expenses.create',
  'expenses.delete',
  'expenses.edit',
  'expenses.view',
  'fx.manage',
  'fx.view',
  'integrations.manage',
  'integrations.view',
  'pnl_labels.manage',
  'pnl_labels.view',
  'products.edit',
  'products.view',
  'reports.view',
  'sales.view',
  'simulations.view',
  'team.manage',
  'team.view',
  'workspace_config.view',
] as const

export function isOwner(me: MeResponse | null | undefined): boolean {
  return Boolean(me?.is_owner)
}

export function can(me: MeResponse | null | undefined, key: string): boolean {
  if (!me) return false
  if (me.is_owner) return true
  return (me.permissions ?? []).includes(key)
}

export const PNL_LABELS_READ_KEYS = [
  'pnl_labels.view',
  'reports.view',
  'sales.view',
  'products.view',
  'channels.view',
  'expenses.view',
  'ads.view',
  'simulations.view',
] as const

export function canReadPnlLabels(me: MeResponse | null | undefined): boolean {
  if (!me) return false
  if (me.is_owner) return true
  return PNL_LABELS_READ_KEYS.some((key) => (me.permissions ?? []).includes(key))
}

export function hasModule(me: MeResponse | null | undefined, moduleId: ModuleId): boolean {
  if (!me) return false
  return (me.modules ?? []).includes(moduleId)
}
