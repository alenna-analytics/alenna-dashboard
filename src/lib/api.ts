const baseUrl = (): string =>
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export type GetTokenFn = (args?: { skipCache?: boolean }) => Promise<string | null>

export async function apiFetch(
  path: string,
  getToken: GetTokenFn,
  init: RequestInit = {},
  tenantId?: string | null,
): Promise<Response> {
  const url = `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers(init.headers)
  const tid = typeof tenantId === 'string' ? tenantId.trim() : ''
  if (tid) {
    headers.set('X-Tenant-ID', tid)
  }
  const token = await getToken({ skipCache: true })
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(url, { ...init, headers })
}

export async function apiPostJson(
  path: string,
  getToken: GetTokenFn,
  body: unknown,
  init: RequestInit = {},
  tenantId?: string | null,
): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  const payload = body === undefined || body === null ? {} : body
  return apiFetch(
    path,
    getToken,
    {
      ...init,
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    },
    tenantId,
  )
}

export async function apiPatchJson(
  path: string,
  getToken: GetTokenFn,
  body: unknown,
  init: RequestInit = {},
  tenantId?: string | null,
): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  return apiFetch(path, getToken, {
    ...init,
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  }, tenantId)
}
