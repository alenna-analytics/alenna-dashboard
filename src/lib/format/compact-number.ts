export function formatCompactNumber(value: number, fractionDigits: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(Math.max(fractionDigits, 1))}M`
  }
  if (abs >= 1_000) {
    return `${(value / 1_000).toFixed(fractionDigits)}K`
  }
  return value.toFixed(fractionDigits)
}
