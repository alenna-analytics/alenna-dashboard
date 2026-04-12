import { Show } from '@clerk/react'
import { Navigate } from 'react-router-dom'

import { AuthLoginPage } from '@/shell/auth/auth-login-page'

export function HomePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-transparent p-6 text-text-primary">
      <Show when="signed-in" fallback={<AuthLoginPage />}>
        <Navigate to="/dashboard" replace />
      </Show>
    </main>
  )
}
