export const CONFIGURATION_BASE_PATH = '/dashboard/configuration'

export function isConfigurationRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/'
  return (
    normalized === CONFIGURATION_BASE_PATH ||
    normalized.startsWith(`${CONFIGURATION_BASE_PATH}/`)
  )
}
