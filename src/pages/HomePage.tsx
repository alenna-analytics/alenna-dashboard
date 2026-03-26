import { Show } from '@clerk/react'
import { Navigate } from 'react-router-dom'

import { AuthLoginPage } from '@/components/auth/auth-login-page'

export function HomePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#050b16] bg-[radial-gradient(ellipse_90%_70%_at_20%_10%,rgba(91,140,255,0.14),transparent_55%),radial-gradient(ellipse_70%_50%_at_80%_90%,rgba(91,140,255,0.08),transparent_60%)] p-6 text-white">
      <Show when="signed-in" fallback={<AuthLoginPage />}>
        <Navigate to="/dashboard" replace />
      </Show>
    </main>
  )
}
