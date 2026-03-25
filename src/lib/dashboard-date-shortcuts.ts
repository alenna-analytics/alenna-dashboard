export function isFullCalendarYearRange(start: Date, end: Date): boolean {
  const y = start.getFullYear()
  return (
    start.getMonth() === 0 &&
    start.getDate() === 1 &&
    end.getFullYear() === y &&
    end.getMonth() === 11 &&
    end.getDate() === 31
  )
}

export function fullCalendarMonthValue(start: Date, end: Date): string | null {
  const y = start.getFullYear()
  const m = start.getMonth()
  if (start.getDate() !== 1) return null
  const lastDay = new Date(y, m + 1, 0).getDate()
  if (
    end.getFullYear() !== y ||
    end.getMonth() !== m ||
    end.getDate() !== lastDay
  ) {
    return null
  }
  return `${y}-${String(m + 1).padStart(2, '0')}`
}

export function buildYearShortcutOptions(): number[] {
  const cy = new Date().getFullYear()
  const earliest = cy - 12
  const years: number[] = []
  for (let y = cy + 1; y >= earliest; y--) years.push(y)
  return years
}

export function monthOptionsForYear(
  year: number,
  locale: string
): { value: string; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1)
    const value = `${year}-${String(i + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    return { value, label }
  })
}
