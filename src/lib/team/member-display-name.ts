import type { TeamMember } from '@/lib/types/team-types'

export function memberDisplayName(member: TeamMember): string {
  const parts = [member.first_name, member.last_name].filter(Boolean)
  if (parts.length > 0) return parts.join(' ')
  return member.email
}
