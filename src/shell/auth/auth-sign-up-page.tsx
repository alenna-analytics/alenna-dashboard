import { SignUp, useAuth } from '@clerk/react'
import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'

import { writeSignupIntent, type SignupIntent } from '@/lib/onboarding-constants'
import { AuthShell } from '@/shell/auth/auth-shell'
import { clerkAuthAppearance } from '@/shell/auth/clerk-auth-appearance'

function parseSignupIntent(value: string | null): SignupIntent | null {
  if (value === 'trial' || value === 'growth') return value
  return null
}

export function AuthSignUpPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const intent = parseSignupIntent(searchParams.get('intent'))
    if (intent) {
      writeSignupIntent(intent)
    }
  }, [searchParams])

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
