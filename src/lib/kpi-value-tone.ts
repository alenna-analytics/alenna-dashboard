import { cn } from '@/lib/utils'

export function isNegativeKpiValue(value: number | null | undefined): boolean {
  return value != null && value < 0
}

export function kpiValueToneClass(
  value: number | null | undefined,
  defaultClass: string,
): string {
  return cn(defaultClass, isNegativeKpiValue(value) && 'text-danger')
}
