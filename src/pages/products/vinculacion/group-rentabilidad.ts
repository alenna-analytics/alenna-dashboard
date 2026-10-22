/** Sin IVA strips transferred VAT. Unconfigured tenants use the MX 16% rate. */
export function ivaDivisor(
  includeIva: boolean,
  transferredIvaPct: number | null | undefined,
): number {
  if (includeIva) return 1
  const pct =
    transferredIvaPct == null || !Number.isFinite(transferredIvaPct) ? 16 : transferredIvaPct
  const divisor = 1 + pct / 100
  if (divisor <= 0) return 1
  return 1 / divisor
}

/** True when two or more known unit costs are not the same. */
export function unitCostsDiffer(costs: Array<number | null | undefined>): boolean {
  const known = costs.filter((cost): cost is number => cost != null && Number.isFinite(cost))
  if (known.length < 2) return false
  const first = known[0] ?? 0
  return known.some((cost) => Math.abs(cost - first) >= 0.01)
}
