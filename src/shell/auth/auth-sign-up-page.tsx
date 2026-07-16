import { SignUp, useAuth } from '@clerk/react'
import { Navigate } from 'react-router-dom'

import { AuthShell } from '@/shell/auth/auth-shell'
import { clerkAuthAppearance } from '@/shell/auth/clerk-auth-appearance'

export function AuthSignUpPage() {
  const { isLoaded, isSignedIn } = useAuth()

  if (isLoaded && isSignedIn) {
    return <Navigate to="/" replace />
  }

  return (
    <AuthShell headlineKey="authSignUpHeadline" supportingKey="authSignUpSupporting">
      <SignUp
        appearance={clerkAuthAppearance}
        routing="path"
        path="/sign-up"
        signInUrl="/login"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
      />
    </AuthShell>
  )
}
