export const EMAIL_MAX_LENGTH = 128
export const EMAIL_TLD_MAX_LENGTH = 4
export const INVITE_EMAILS_MAX = 10

const EMAIL_TLD_MIN_LENGTH = 2
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(raw: string): boolean {
  const value = raw.trim()
  if (value.length < 5 || value.length > EMAIL_MAX_LENGTH) return false
  if (!EMAIL_PATTERN.test(value)) return false

  const at = value.indexOf('@')
  if (at <= 0 || at !== value.lastIndexOf('@')) return false

  const domain = value.slice(at + 1)
  const lastDot = domain.lastIndexOf('.')
  if (lastDot <= 0) return false

  const tld = domain.slice(lastDot + 1)
  if (tld.length < EMAIL_TLD_MIN_LENGTH || tld.length > EMAIL_TLD_MAX_LENGTH) return false
  return /^[a-zA-Z]+$/.test(tld)
}

export function parseInviteEmails(raw: string): { emails: string[]; invalid: string[] } {
  const tokens = raw
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter(Boolean)
  const emails: string[] = []
  const invalid: string[] = []
  const seen = new Set<string>()
  for (const token of tokens) {
    const key = token.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    if (isValidEmail(token)) emails.push(token)
    else invalid.push(token)
  }
  return { emails, invalid }
}
