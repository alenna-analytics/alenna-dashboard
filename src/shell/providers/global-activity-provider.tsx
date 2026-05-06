import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'

export type GlobalActivityPhase = 'loading' | 'success' | 'error'

export type GlobalActivityItem = {
  id: string
  phase: GlobalActivityPhase
  title: string
  subtitle?: string
  href: string
  minimized: boolean
}

/** Single slot for Shopify channel order sync (one concurrent sync per workspace UX). */
export const GLOBAL_ACTIVITY_SHOPIFY_SYNC_ID = 'shopify-channel-sync'

export function cogsBackfillActivityId(jobId: string): string {
  return `cogs-backfill:${jobId}`
}

type GlobalActivityState = {
  items: GlobalActivityItem[]
}

type GlobalActivityAction =
  | {
      type: 'upsert'
      payload: Omit<GlobalActivityItem, 'minimized'> & { minimized?: boolean }
    }
  | {
      type: 'patch'
      id: string
      patch: Partial<Pick<GlobalActivityItem, 'phase' | 'title' | 'subtitle' | 'href'>>
    }
  | { type: 'minimize'; id: string }
  | { type: 'restoreAll' }
  | { type: 'remove'; id: string }

function reducer(state: GlobalActivityState, action: GlobalActivityAction): GlobalActivityState {
  switch (action.type) {
    case 'upsert': {
      const { payload } = action
      const nextMinimized =
        payload.minimized ??
        state.items.find((x) => x.id === payload.id)?.minimized ??
        false
      const item: GlobalActivityItem = {
        id: payload.id,
        phase: payload.phase,
        title: payload.title,
        subtitle: payload.subtitle,
        href: payload.href,
        minimized: nextMinimized,
      }
      const idx = state.items.findIndex((x) => x.id === item.id)
      const items =
        idx === -1
          ? [...state.items, item]
          : state.items.map((x, i) => (i === idx ? { ...x, ...item } : x))
      return { items }
    }
    case 'patch': {
      const items = state.items.map((x) =>
        x.id === action.id ? { ...x, ...action.patch } : x,
      )
      return { items }
    }
    case 'minimize': {
      const items = state.items.map((x) =>
        x.id === action.id ? { ...x, minimized: true } : x,
      )
      return { items }
    }
    case 'restoreAll': {
      const items = state.items.map((x) => ({ ...x, minimized: false }))
      return { items }
    }
    case 'remove': {
      const items = state.items.filter((x) => x.id !== action.id)
      return { items }
    }
    default:
      return state
  }
}

const initialState: GlobalActivityState = { items: [] }

type GlobalActivityContextValue = {
  items: GlobalActivityItem[]
  visibleItems: GlobalActivityItem[]
  hasMinimized: boolean
  minimizedAggregatePhase: GlobalActivityPhase | null
  upsertActivity: (
    payload: Omit<GlobalActivityItem, 'minimized'> & { minimized?: boolean },
  ) => void
  patchActivity: (
    id: string,
    patch: Partial<Pick<GlobalActivityItem, 'phase' | 'title' | 'subtitle' | 'href'>>,
  ) => void
  minimizeActivity: (id: string) => void
  restoreAllActivities: () => void
  removeActivity: (id: string) => void
}

const GlobalActivityContext = createContext<GlobalActivityContextValue | null>(null)

export function GlobalActivityProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const upsertActivity = useCallback(
    (payload: Omit<GlobalActivityItem, 'minimized'> & { minimized?: boolean }) => {
      dispatch({ type: 'upsert', payload })
    },
    [],
  )

  const patchActivity = useCallback(
    (
      id: string,
      patch: Partial<Pick<GlobalActivityItem, 'phase' | 'title' | 'subtitle' | 'href'>>,
    ) => {
      dispatch({ type: 'patch', id, patch })
    },
    [],
  )

  const minimizeActivity = useCallback((id: string) => {
    dispatch({ type: 'minimize', id })
  }, [])

  const restoreAllActivities = useCallback(() => {
    dispatch({ type: 'restoreAll' })
  }, [])

  const removeActivity = useCallback((id: string) => {
    dispatch({ type: 'remove', id })
  }, [])

  const visibleItems = useMemo(
    () => state.items.filter((x) => !x.minimized),
    [state.items],
  )

  const minimizedItems = useMemo(() => state.items.filter((x) => x.minimized), [state.items])

  const hasMinimized = minimizedItems.length > 0

  const minimizedAggregatePhase = useMemo((): GlobalActivityPhase | null => {
    if (minimizedItems.length === 0) return null
    if (minimizedItems.some((x) => x.phase === 'error')) return 'error'
    if (minimizedItems.some((x) => x.phase === 'loading')) return 'loading'
    if (minimizedItems.some((x) => x.phase === 'success')) return 'success'
    return null
  }, [minimizedItems])

  const value = useMemo(
    (): GlobalActivityContextValue => ({
      items: state.items,
      visibleItems,
      hasMinimized,
      minimizedAggregatePhase,
      upsertActivity,
      patchActivity,
      minimizeActivity,
      restoreAllActivities,
      removeActivity,
    }),
    [
      state.items,
      visibleItems,
      hasMinimized,
      minimizedAggregatePhase,
      upsertActivity,
      patchActivity,
      minimizeActivity,
      restoreAllActivities,
      removeActivity,
    ],
  )

  return (
    <GlobalActivityContext.Provider value={value}>{children}</GlobalActivityContext.Provider>
  )
}

export function useGlobalActivity(): GlobalActivityContextValue {
  const ctx = useContext(GlobalActivityContext)
  if (!ctx) {
    throw new Error('useGlobalActivity must be used within GlobalActivityProvider')
  }
  return ctx
}
