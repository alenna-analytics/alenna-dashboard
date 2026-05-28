import { useEffect, useState } from 'react'

/** Updates once per minute so relative labels (e.g. "hace X min") refresh without refetch. */
export function useNowMinuteTick(): number {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now())
    }, 60_000)
    return () => window.clearInterval(id)
  }, [])

  return nowMs
}
