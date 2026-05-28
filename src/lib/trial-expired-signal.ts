type TrialExpiredListener = () => void

let listener: TrialExpiredListener | null = null

export function onTrialExpired(cb: TrialExpiredListener): () => void {
  listener = cb
  return () => {
    if (listener === cb) {
      listener = null
    }
  }
}

export function signalTrialExpired(): void {
  listener?.()
}
