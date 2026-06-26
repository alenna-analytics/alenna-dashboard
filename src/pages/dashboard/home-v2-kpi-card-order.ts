export const HOME_V2_KPI_CARD_IDS = [
  'net-sales',
  'net-profit',
  'roas',
  'contribution',
  'ebitda',
  'units',
  'orders',
  'aov',
] as const

export type HomeV2KpiCardId = (typeof HOME_V2_KPI_CARD_IDS)[number]

const ID_SET = new Set<string>(HOME_V2_KPI_CARD_IDS)

export function isHomeV2KpiCardId(value: string): value is HomeV2KpiCardId {
  return ID_SET.has(value)
}

export const HOME_V2_KPI_DEFAULT_ORDER: HomeV2KpiCardId[] = [...HOME_V2_KPI_CARD_IDS]

export type HomeV2KpiOrderState = {
  order: HomeV2KpiCardId[]
  v: number
}

export const HOME_V2_KPI_ORDER_VERSION = 1
export const HOME_V2_KPI_ORDER_KEY = 'alenna.home-v2.kpi-order.v1'

export function normalizeHomeV2KpiOrder(raw: unknown): HomeV2KpiCardId[] {
  if (!raw || typeof raw !== 'object') return HOME_V2_KPI_DEFAULT_ORDER
  const o = raw as Record<string, unknown>
  if (o.v !== HOME_V2_KPI_ORDER_VERSION) return HOME_V2_KPI_DEFAULT_ORDER
  if (!Array.isArray(o.order)) return HOME_V2_KPI_DEFAULT_ORDER

  const seen = new Set<HomeV2KpiCardId>()
  const ordered: HomeV2KpiCardId[] = []
  for (const item of o.order) {
    if (typeof item !== 'string' || !isHomeV2KpiCardId(item) || seen.has(item)) continue
    seen.add(item)
    ordered.push(item)
  }

  for (const id of HOME_V2_KPI_DEFAULT_ORDER) {
    if (!seen.has(id)) ordered.push(id)
  }

  return ordered.length > 0 ? ordered : HOME_V2_KPI_DEFAULT_ORDER
}

export function parseHomeV2KpiOrderState(raw: unknown): HomeV2KpiOrderState | null {
  const order = normalizeHomeV2KpiOrder(raw)
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.v !== HOME_V2_KPI_ORDER_VERSION) return null
  return { order, v: HOME_V2_KPI_ORDER_VERSION }
}

export function reorderHomeV2KpiCards(
  order: HomeV2KpiCardId[],
  activeId: HomeV2KpiCardId,
  overId: HomeV2KpiCardId,
): HomeV2KpiCardId[] {
  if (activeId === overId) return order
  const fromIndex = order.indexOf(activeId)
  const toIndex = order.indexOf(overId)
  if (fromIndex === -1 || toIndex === -1) return order
  const next = [...order]
  next.splice(fromIndex, 1)
  next.splice(toIndex, 0, activeId)
  return next
}
