import { useEffect, useState } from 'react'

/** Monotonic seconds while `active` is true; 0 when inactive. */
export function useSyncElapsedSeconds(active: boolean): number {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!active) {
      return
    }
    const t0 = Date.now()
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - t0) / 1000))
    }, 400)
    const raf = requestAnimationFrame(() => {
      setElapsed(0)
    })
    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(id)
    }
  }, [active])

  return active ? elapsed : 0
}
