import { Show } from '@clerk/react'
import { Navigate, Outlet } from 'react-router-dom'

export function AppAuthBoundary() {
  return (
    <Show when="signed-in" fallback={<Navigate to="/" replace />}>
      <Outlet />
    </Show>
  )
}
