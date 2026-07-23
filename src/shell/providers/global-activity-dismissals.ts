const STORAGE_KEY = 'alenna.globalActivity.terminalDismissals.v1'

type DismissalStore = Record<string, string>

function readStore(): DismissalStore {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DismissalStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: DismissalStore): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore quota / private mode
  }
}

function storageKey(tenantId: string, activityId: string): string {
  return `${tenantId}:${activityId}`
}

export function isTerminalDismissed(
  tenantId: string | null | undefined,
  activityId: string,
  dismissKey: string,
): boolean {
  if (!tenantId || !dismissKey) return false
  return readStore()[storageKey(tenantId, activityId)] === dismissKey
}

export function persistTerminalDismissal(
  tenantId: string | null | undefined,
  activityId: string,
  dismissKey: string,
): void {
  if (!tenantId || !dismissKey) return
  const store = readStore()
  store[storageKey(tenantId, activityId)] = dismissKey
  writeStore(store)
}

export function clearTerminalDismissal(
  tenantId: string | null | undefined,
  activityId: string,
): void {
  if (!tenantId) return
  const store = readStore()
  const key = storageKey(tenantId, activityId)
  if (!(key in store)) return
  delete store[key]
  writeStore(store)
}
