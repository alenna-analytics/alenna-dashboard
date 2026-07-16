import { HandleSSOCallback } from '@clerk/react'
import { useNavigate } from 'react-router-dom'

export function SsoCallbackPage() {
  const navigate = useNavigate()

  return (
    <main className="auth-login-shell relative flex h-dvh w-full items-center justify-center">
      <HandleSSOCallback
        navigateToApp={() => {
          void navigate('/', { replace: true })
        }}
        navigateToSignIn={() => {
          void navigate('/login', { replace: true })
        }}
        navigateToSignUp={() => {
          void navigate('/sign-up', { replace: true })
        }}
      />
    </main>
  )
}
