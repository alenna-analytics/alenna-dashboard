import { Navigate, useLocation } from 'react-router-dom'

export function LegacyAppRedirect() {
  const { pathname } = useLocation()
  const suffix = pathname.replace(/^\/app\/?/, '') || ''
  const target =
    suffix === '' || suffix === 'dashboard'
      ? '/dashboard'
      : `/dashboard/${suffix}`
  return <Navigate to={target} replace />
}
