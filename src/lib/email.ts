const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(raw: string): boolean {
  const value = raw.trim()
  if (value.length < 3 || value.length > 254) return false
  return EMAIL_PATTERN.test(value)
}
