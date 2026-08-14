export type InitialsSource = {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}

export function userInitials(source: InitialsSource): string {
  const first = source.firstName?.trim() ?? ''
  const last = source.lastName?.trim() ?? ''
  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase()
  }
  if (first.length >= 2) {
    return first.slice(0, 2).toUpperCase()
  }
  if (first.length === 1) {
    return first.toUpperCase()
  }
  const email = source.email?.trim() ?? ''
  if (email.length > 0) {
    return email[0]!.toUpperCase()
  }
  return '?'
}
