export function roundCostInput(value: number): number {
  return Math.round(value * 10_000) / 10_000
}

export function parseCostInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parsed = Number.parseFloat(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return roundCostInput(parsed)
}

export function costsEqual(current: number | null, next: number): boolean {
  if (current === null) return false
  return roundCostInput(current) === roundCostInput(next)
}

export function formatCostDraft(cost: number | null): string {
  if (cost === null) return ''
  return String(roundCostInput(cost))
}
