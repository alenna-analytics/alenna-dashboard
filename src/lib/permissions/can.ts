import type { MeResponse } from '@/lib/types/me-types'

export type AssignablePermissionKey =
  | 'team.manage'
  | 'integrations.manage'
  | 'alerts.manage'
  | 'fx.manage'
  | 'pnl_labels.manage'
  | 'account.deletion'

export const ASSIGNABLE_PERMISSION_KEYS: readonly AssignablePermissionKey[] = [
  'team.manage',
  'integrations.manage',
  'alerts.manage',
  'fx.manage',
  'pnl_labels.manage',
  'account.deletion',
]

export function isOwner(me: MeResponse | null | undefined): boolean {
  return Boolean(me?.is_owner)
}

export function can(me: MeResponse | null | undefined, key: string): boolean {
  if (!me) return false
  if (me.is_owner) return true
  return (me.permissions ?? []).includes(key)
}
