import type { GetTokenFn } from '@/lib/api/client'
import { apiFetch, apiPatchJson, apiPostJson } from '@/lib/api/client'
import { shellT, type ShellStringKey } from '@/lib/i18n/shell-strings'
import type { Language } from '@/shell/providers/language-provider'
import type {
  TeamInvitePayload,
  TeamInviteResponse,
  TeamListResponse,
  TeamMemberRolePayload,
  TeamRoleSlug,
} from '@/lib/types/team-types'

type ApiErrorDetailObject = {
  message?: string
  code?: string
  msg?: string
}

type ApiErrorBody = {
  detail?: string | ApiErrorDetailObject | ApiErrorDetailObject[]
}

const TEAM_ERROR_KEYS: Record<string, ShellStringKey> = {
  users_limit_reached: 'teamErrorUsersLimitReached',
  already_member: 'teamErrorAlreadyMember',
  invite_pending: 'teamErrorInvitePending',
  cannot_invite_self: 'teamErrorCannotInviteSelf',
  cannot_assign_role: 'teamErrorCannotAssignRole',
  invalid_role: 'teamErrorInvalidRole',
  clerk_not_configured: 'teamErrorClerkNotConfigured',
  clerk_upstream_error: 'teamErrorClerkUpstream',
  clerk_invitation_rejected: 'teamErrorClerkRejected',
  last_owner: 'teamErrorLastOwner',
  cannot_modify_owner: 'teamErrorCannotModifyOwner',
  invitation_not_found: 'teamErrorInvitationNotFound',
  member_not_found: 'teamErrorMemberNotFound',
  invalid_payload: 'teamErrorInvalidPayload',
  forbidden: 'teamErrorGeneric',
}

function messageForCode(lang: Language, code: string | undefined, fallback: string): string {
  if (!code) return fallback
  const key = TEAM_ERROR_KEYS[code]
  if (key) return shellT(lang, key)
  return fallback
}

async function parseApiError(
  res: Response,
  lang: Language,
  fallbackKey: ShellStringKey,
): Promise<Error> {
  const fallback = shellT(lang, fallbackKey)
  try {
    const body = (await res.json()) as ApiErrorBody
    const detail = body.detail

    if (typeof detail === 'string' && detail.trim()) {
      return new Error(detail)
    }

    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0]
      if (typeof first?.msg === 'string' && first.msg.trim()) {
        return new Error(shellT(lang, 'teamErrorInvalidPayload'))
      }
    }

    if (typeof detail === 'object' && detail !== null && !Array.isArray(detail)) {
      const code = typeof detail.code === 'string' ? detail.code : undefined
      if (typeof detail.message === 'string' && detail.message.trim()) {
        return new Error(messageForCode(lang, code, detail.message))
      }
      return new Error(messageForCode(lang, code, fallback))
    }
  } catch {
    /* ignore */
  }
  return new Error(fallback)
}

export async function fetchTeamMembers(
  getToken: GetTokenFn,
  tenantId: string,
  lang: Language = 'es',
): Promise<TeamListResponse> {
  const res = await apiFetch('/team/members', getToken, {}, tenantId)
  if (!res.ok) {
    throw await parseApiError(res, lang, 'teamErrorGeneric')
  }
  return (await res.json()) as TeamListResponse
}

export async function inviteTeamMember(
  getToken: GetTokenFn,
  tenantId: string,
  payload: TeamInvitePayload,
  lang: Language = 'es',
): Promise<TeamInviteResponse> {
  const res = await apiPostJson('/team/invitations', getToken, payload, {}, tenantId)
  if (!res.ok) {
    throw await parseApiError(res, lang, 'teamInviteSendFailed')
  }
  return (await res.json()) as TeamInviteResponse
}

export async function revokeTeamInvitation(
  getToken: GetTokenFn,
  tenantId: string,
  invitationId: string,
  lang: Language = 'es',
): Promise<void> {
  const res = await apiFetch(
    `/team/invitations/${invitationId}`,
    getToken,
    { method: 'DELETE' },
    tenantId,
  )
  if (!res.ok) {
    throw await parseApiError(res, lang, 'teamErrorGeneric')
  }
}

export async function updateTeamMemberRole(
  getToken: GetTokenFn,
  tenantId: string,
  userId: string,
  role: TeamRoleSlug,
  lang: Language = 'es',
): Promise<void> {
  const body: TeamMemberRolePayload = { role }
  const res = await apiPatchJson(`/team/members/${userId}`, getToken, body, {}, tenantId)
  if (!res.ok) {
    throw await parseApiError(res, lang, 'teamErrorGeneric')
  }
}

export async function removeTeamMember(
  getToken: GetTokenFn,
  tenantId: string,
  userId: string,
  lang: Language = 'es',
): Promise<void> {
  const res = await apiFetch(
    `/team/members/${userId}`,
    getToken,
    { method: 'DELETE' },
    tenantId,
  )
  if (!res.ok) {
    throw await parseApiError(res, lang, 'teamErrorGeneric')
  }
}

export async function leaveTeam(
  getToken: GetTokenFn,
  tenantId: string,
  lang: Language = 'es',
): Promise<void> {
  const res = await apiPostJson('/team/leave', getToken, {}, {}, tenantId)
  if (!res.ok) {
    throw await parseApiError(res, lang, 'teamErrorGeneric')
  }
}
