const DEFAULT_SUPPORT_EMAIL = 'contacto@alenna.io'

export function supportEmail(): string {
  const raw = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim()
  return raw && raw.length > 0 ? raw : DEFAULT_SUPPORT_EMAIL
}

export function supportMailto(subject?: string): string {
  const email = supportEmail()
  if (!subject) return `mailto:${email}`
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`
}
