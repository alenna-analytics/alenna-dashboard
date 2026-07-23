/** True when dashboard should use POST /connectors/amazon/sandbox-connect (not OAuth redirect). */
export function isAmazonSandboxConnectMode(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname.toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host.includes('staging')
}
