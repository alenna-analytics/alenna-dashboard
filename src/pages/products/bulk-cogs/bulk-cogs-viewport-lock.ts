import { useEffect } from 'react'

const MAIN_LOCK_CLASS = 'overflow-hidden'
const COLUMN_LOCK_CLASSES = ['!flex', '!h-full', '!min-h-0', '!flex-col', '!overflow-hidden'] as const
const OUTLET_LOCK_CLASSES = ['!h-full', '!min-h-0', '!flex-1', '!overflow-hidden'] as const

export function useBulkCogsViewportLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const main = document.querySelector('main')
    const column = main?.firstElementChild as HTMLElement | null
    const outlet = column?.lastElementChild as HTMLElement | null
    if (!main || !column || !outlet) return

    main.classList.add(MAIN_LOCK_CLASS)
    column.classList.add(...COLUMN_LOCK_CLASSES)
    outlet.classList.add(...OUTLET_LOCK_CLASSES)

    return () => {
      main.classList.remove(MAIN_LOCK_CLASS)
      column.classList.remove(...COLUMN_LOCK_CLASSES)
      outlet.classList.remove(...OUTLET_LOCK_CLASSES)
    }
  }, [enabled])
}
