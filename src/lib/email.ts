export const EMAIL_MAX_LENGTH = 128
export const EMAIL_TLD_MAX_LENGTH = 4

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
