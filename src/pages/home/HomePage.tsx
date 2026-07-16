import { Show } from '@clerk/react'
import { Navigate } from 'react-router-dom'

import { SessionGate } from '@/shell/auth/session-gate'

export function HomePage() {
  return (
    <Show when="signed-in" fallback={<Navigate to="/login" replace />}>
      <SessionGate />
    </Show>
  )
}
