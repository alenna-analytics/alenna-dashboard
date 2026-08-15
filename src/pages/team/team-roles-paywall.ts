export function shouldShowCustomRolesUpgrade(
  isOwner: boolean,
  canManageRoles: boolean,
): boolean {
  return isOwner && !canManageRoles
}
