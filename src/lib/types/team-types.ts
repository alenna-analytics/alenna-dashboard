export type TeamMemberStatus = 'active' | 'pending'

export type WorkspaceRoleSystemKey = 'owner' | 'admin' | 'staff'

export type WorkspaceRole = {
  id: string
  slug: string
  name: string
  description: string | null
  system_key: WorkspaceRoleSystemKey | null
  permissions: string[] | null
  member_count: number
  invitation_count: number
}

export type WorkspaceRolesListResponse = {
  roles: WorkspaceRole[]
  roles_used: number
  roles_limit: number | null
  can_manage_roles: boolean
}

export type TeamMember = {
  user_id: string | null
  invitation_id: string | null
  email: string
  first_name: string | null
  last_name: string | null
  role_id: string
  role: string
  role_name: string
  status: TeamMemberStatus
  is_you: boolean
}

export type TeamListResponse = {
  members: TeamMember[]
  users_used: number
  users_limit: number | null
  upgrade_cta: 'growth' | 'enterprise' | 'none'
}

export type TeamInvitePayload = {
  email: string
  role_id: string
}

export type TeamMemberRolePayload = {
  role_id: string
}

export type TeamInviteResponse = {
  kind: 'invited'
  member: TeamMember
}

export type WorkspaceRoleCreatePayload = {
  name: string
  description?: string | null
  permissions: string[]
}

export type WorkspaceRolePatchPayload = {
  name?: string | null
  description?: string | null
  permissions?: string[] | null
}
