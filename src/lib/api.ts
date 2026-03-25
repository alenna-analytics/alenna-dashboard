const baseUrl = (): string =>
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export type GetTokenFn = (args?: { skipCache?: boolean }) => Promise<string | null>

export async function apiFetch(
  path: string,
  getToken: GetTokenFn,
  init: RequestInit = {},
): Promise<Response> {
  const url = `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers(init.headers)
  const token = await getToken()
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
): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  return apiFetch(
    path,
    getToken,
    {
      ...init,
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    },
  )
}
