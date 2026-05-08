import { Show } from '@clerk/react'
import { Navigate } from 'react-router-dom'

import { AuthLoginPage } from '@/shell/auth/auth-login-page'

export function HomePage() {
  return (
    <main className="auth-login-shell relative flex h-dvh w-full flex-col">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
        <div className="my-auto flex w-full flex-col px-5 py-8 sm:px-9 lg:px-16 lg:py-10">
          <Show when="signed-in" fallback={<AuthLoginPage />}>
            <Navigate to="/dashboard" replace />
          </Show>
        </div>
      </div>
    </main>
  )
}
