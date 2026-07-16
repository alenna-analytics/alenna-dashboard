import { SignIn, useAuth } from '@clerk/react'
import { Navigate } from 'react-router-dom'

import { AuthShell } from '@/shell/auth/auth-shell'
import { clerkAuthAppearance } from '@/shell/auth/clerk-auth-appearance'

export function AuthLoginPage() {
  const { isLoaded, isSignedIn } = useAuth()

  if (isLoaded && isSignedIn) {
    return <Navigate to="/" replace />
  }

  return (
    <AuthShell atmosphere>
      <SignIn
        appearance={clerkAuthAppearance}
        routing="path"
        path="/login"
        signUpUrl="/sign-up"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
      />
    </AuthShell>
  )
}
