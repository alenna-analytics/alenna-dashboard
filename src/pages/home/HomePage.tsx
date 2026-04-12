import { Show } from '@clerk/react'
import { Navigate } from 'react-router-dom'

import { AuthLoginPage } from '@/shell/auth/auth-login-page'

export function HomePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg-base bg-[radial-gradient(ellipse_90%_70%_at_20%_10%,rgba(218,151,144,0.14),transparent_55%),radial-gradient(ellipse_70%_50%_at_80%_90%,rgba(235,207,198,0.45),transparent_60%)] p-6 text-text-primary">
      <Show when="signed-in" fallback={<AuthLoginPage />}>
        <Navigate to="/dashboard" replace />
      </Show>
    </main>
  )
}
