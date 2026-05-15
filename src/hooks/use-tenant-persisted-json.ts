import { useCallback, useEffect, useMemo, useState } from 'react'

type PersistedSnapshot<T extends Record<string, unknown>> = {
  storageKey: string | null
  value: T
}

function readPersistedValue<T extends Record<string, unknown>>(
  storageKey: string | null,
  defaults: T,
  parse: (raw: unknown) => T | null,
): T {
  if (!storageKey) return defaults
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as unknown
    return parse(parsed) ?? defaults
  } catch {
    return defaults
  }
}

export function useTenantPersistedJson<T extends Record<string, unknown>>(
  tenantId: string | null,
  namespace: string,
  defaults: T,
  parse: (raw: unknown) => T | null,
): [T, (patch: Partial<T>) => void] {
  const storageKey = tenantId ? `${namespace}:${tenantId}` : null
  const [snapshot, setSnapshot] = useState<PersistedSnapshot<T>>(() => ({
    storageKey,
    value: readPersistedValue(storageKey, defaults, parse),
  }))
  const currentSnapshot = useMemo<PersistedSnapshot<T>>(() => {
    if (snapshot.storageKey === storageKey) return snapshot
    return {
      storageKey,
      value: readPersistedValue(storageKey, defaults, parse),
    }
  }, [defaults, parse, snapshot, storageKey])

  useEffect(() => {
    if (!currentSnapshot.storageKey) return
    try {
      localStorage.setItem(currentSnapshot.storageKey, JSON.stringify(currentSnapshot.value))
    } catch {
      /* ignore */
    }
  }, [currentSnapshot])

  const setPatch = useCallback((patch: Partial<T>) => {
    setSnapshot((previousSnapshot) => {
      const previousValue =
        previousSnapshot.storageKey === storageKey
          ? previousSnapshot.value
          : readPersistedValue(storageKey, defaults, parse)
      return {
        storageKey,
        value: { ...previousValue, ...patch },
      }
    })
  }, [defaults, parse, storageKey])

  return [currentSnapshot.value, setPatch]
}
