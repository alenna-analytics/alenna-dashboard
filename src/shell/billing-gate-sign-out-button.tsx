import { useAuth } from '@clerk/react'
import { useState } from 'react'

import { Button } from '@/ui/button'

type BillingGateSignOutButtonProps = {
  label: string
}

export function BillingGateSignOutButton({ label }: BillingGateSignOutButtonProps) {
  const { signOut } = useAuth()
  const [pending, setPending] = useState(false)

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      className="text-sm font-medium text-neutral-500 hover:bg-transparent hover:text-neutral-800"
      onClick={() => {
        setPending(true)
        void signOut({ redirectUrl: '/login' }).finally(() => setPending(false))
      }}
    >
      {label}
    </Button>
  )
}
