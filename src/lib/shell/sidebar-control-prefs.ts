export type SidebarControlMode = 'expanded' | 'collapsed' | 'expand_on_hover'

const MODE_KEY = 'alenna.sidebar.controlMode'
const LEGACY_COLLAPSED_KEY = 'alenna.sidebar.collapsed'

function isSidebarControlMode(value: string | null): value is SidebarControlMode {
  return value === 'expanded' || value === 'collapsed' || value === 'expand_on_hover'
}

export function readSidebarControlMode(): SidebarControlMode {
  if (typeof window === 'undefined') {
    return 'expanded'
  }
  try {
    const stored = window.localStorage.getItem(MODE_KEY)
    if (isSidebarControlMode(stored)) {
      return stored
    }
    const legacy = window.localStorage.getItem(LEGACY_COLLAPSED_KEY)
    if (legacy === '1') {
      return 'collapsed'
    }
  } catch {
    /* ignore */
  }
  return 'expanded'
}

export function writeSidebarControlMode(mode: SidebarControlMode): void {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(MODE_KEY, mode)
    window.localStorage.setItem(
      LEGACY_COLLAPSED_KEY,
      mode === 'collapsed' || mode === 'expand_on_hover' ? '1' : '0',
    )
  } catch {
    /* ignore */
  }
}

export function isSidebarVisuallyCollapsed(
  mode: SidebarControlMode,
  hoverExpanded: boolean,
): boolean {
  if (mode === 'expanded') {
    return false
  }
  if (mode === 'collapsed') {
    return true
  }
  return !hoverExpanded
}
