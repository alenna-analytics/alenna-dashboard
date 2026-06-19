import type { AppIconName } from '@/lib/icons/catalog'
import type { ShellStringKey } from '@/lib/i18n/shell-strings'

export type ModuleId =
  | 'reports'
  | 'products'
  | 'sales'
  | 'ads'
  | 'simulations'
  | 'integrations'
  | 'channels'

export type ModuleSection = 'analytics' | 'config'

export type ModuleDefinition = {
  id: ModuleId
  labelKey: ShellStringKey
  path: string
  icon: AppIconName
  comingSoon: boolean
  section: ModuleSection
}

export type ModuleState = ModuleDefinition & {
  enabled: boolean
}

export function isModuleId(value: string): value is ModuleId {
  return (
    value === 'reports' ||
    value === 'products' ||
    value === 'sales' ||
    value === 'ads' ||
    value === 'simulations' ||
    value === 'integrations' ||
    value === 'channels'
  )
}

export function parseModuleIds(values: string[]): ModuleId[] {
  return values.filter(isModuleId)
}
