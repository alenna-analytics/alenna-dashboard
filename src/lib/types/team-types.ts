export type TeamRoleSlug = 'owner' | 'admin' | 'staff'

export type TeamMemberStatus = 'active' | 'pending'

export type TeamMember = {
  user_id: string | null
  invitation_id: string | null
  email: string
  first_name: string | null
  last_name: string | null
  role: TeamRoleSlug
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
  role: TeamRoleSlug
}

export type TeamMemberRolePayload = {
  role: TeamRoleSlug
}

export type TeamInviteResponse = {
  kind: 'invited' | 'added'
  member: TeamMember
}
